"""
Employee Attendance Dashboard - FastAPI backend entry point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""
from datetime import date as date_cls, timedelta
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from . import models, schemas
from .database import engine, get_db
from .excel_processor import process_excel_file

# Create tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Employee Attendance Dashboard API",
    description="API for uploading and managing employee attendance data.",
    version="1.0.0",
)

# Allow the React dev server (and any origin in dev) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = (".xlsx", ".xls")
MAX_FILE_SIZE_MB = 15


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------
@app.post("/api/upload", response_model=schemas.UploadResult)
async def upload_attendance_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.filename}'. Only .xlsx or .xls files are accepted.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit.")

    try:
        log = process_excel_file(db, file.filename, file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to process file: {exc}")

    return schemas.UploadResult(
        filename=log.filename,
        total_rows=log.total_rows,
        new_employees=log.new_employees,
        inserted_attendance=log.inserted_attendance,
        updated_attendance=log.updated_attendance,
        error_rows=log.error_rows,
        errors=[schemas.UploadRowError(**e) for e in log.errors_list],
        preview_inserted=log.preview_inserted,
        preview_updated=log.preview_updated,
    )


@app.get("/api/uploads/history")
def upload_history(db: Session = Depends(get_db), limit: int = 20):
    logs = (
        db.query(models.UploadLog)
        .order_by(models.UploadLog.uploaded_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "filename": l.filename,
            "uploaded_at": l.uploaded_at,
            "total_rows": l.total_rows,
            "new_employees": l.new_employees,
            "inserted_attendance": l.inserted_attendance,
            "updated_attendance": l.updated_attendance,
            "error_rows": l.error_rows,
        }
        for l in logs
    ]


# ---------------------------------------------------------------------------
# Dashboard summary + charts
# ---------------------------------------------------------------------------
def _status_counts(db: Session, target_date: Optional[date_cls]):
    q = db.query(models.Attendance.status, func.count(models.Attendance.id))
    if target_date:
        q = q.filter(models.Attendance.date == target_date)
    q = q.group_by(models.Attendance.status)
    counts = {status: 0 for status in ("Present", "Absent", "WFH", "Leave", "Half Day")}
    for status, cnt in q.all():
        counts[status] = cnt
    return counts


@app.get("/api/summary", response_model=schemas.SummaryOut)
def get_summary(target_date: Optional[str] = Query(None, alias="date"), db: Session = Depends(get_db)):
    parsed_date = None
    if target_date:
        try:
            parsed_date = date_cls.fromisoformat(target_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")
    else:
        latest = db.query(func.max(models.Attendance.date)).scalar()
        parsed_date = latest

    total_employees = db.query(func.count(models.Employee.emp_id)).scalar() or 0
    counts = _status_counts(db, parsed_date)

    return schemas.SummaryOut(
        total_employees=total_employees,
        present=counts["Present"],
        absent=counts["Absent"],
        wfh=counts["WFH"],
        leave=counts["Leave"],
        half_day=counts["Half Day"],
        date=parsed_date.isoformat() if parsed_date else None,
    )


@app.get("/api/chart-data", response_model=List[schemas.ChartPoint])
def get_chart_data(days: int = 14, db: Session = Depends(get_db)):
    latest = db.query(func.max(models.Attendance.date)).scalar()
    if not latest:
        return []
    start = latest - timedelta(days=days - 1)

    rows = (
        db.query(
            models.Attendance.date,
            models.Attendance.status,
            func.count(models.Attendance.id),
        )
        .filter(models.Attendance.date >= start, models.Attendance.date <= latest)
        .group_by(models.Attendance.date, models.Attendance.status)
        .all()
    )

    by_date = {}
    d = start
    while d <= latest:
        by_date[d.isoformat()] = {"present": 0, "absent": 0, "wfh": 0, "leave": 0, "half_day": 0}
        d += timedelta(days=1)

    key_map = {"Present": "present", "Absent": "absent", "WFH": "wfh", "Leave": "leave", "Half Day": "half_day"}
    for d_val, status, cnt in rows:
        iso = d_val.isoformat()
        if iso in by_date and status in key_map:
            by_date[iso][key_map[status]] = cnt

    return [schemas.ChartPoint(date=k, **v) for k, v in sorted(by_date.items())]


@app.get("/api/status-distribution")
def get_status_distribution(target_date: Optional[str] = Query(None, alias="date"), db: Session = Depends(get_db)):
    parsed_date = None
    if target_date:
        parsed_date = date_cls.fromisoformat(target_date)
    else:
        parsed_date = db.query(func.max(models.Attendance.date)).scalar()
    counts = _status_counts(db, parsed_date)
    return [{"name": k, "value": v} for k, v in counts.items()]


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------
@app.get("/api/employees", response_model=List[schemas.EmployeeWithStats])
def list_employees(
    search: Optional[str] = None,
    status: Optional[str] = None,
    target_date: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Employee)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter((models.Employee.name.ilike(like)) | (models.Employee.emp_id.ilike(like)))
    employees = query.order_by(models.Employee.emp_id).all()

    parsed_date = None
    if target_date:
        parsed_date = date_cls.fromisoformat(target_date)

    result = []
    for emp in employees:
        records = emp.attendance_records
        latest = records[0] if records else None

        if status and (not latest or latest.status != status):
            # if a status filter is applied, only include matching latest status
            if not (parsed_date and any(r.date == parsed_date and r.status == status for r in records)):
                continue

        if parsed_date:
            day_record = next((r for r in records if r.date == parsed_date), None)
            latest_status = day_record.status if day_record else None
            latest_date = parsed_date if day_record else None
        else:
            latest_status = latest.status if latest else None
            latest_date = latest.date if latest else None

        result.append(
            schemas.EmployeeWithStats(
                emp_id=emp.emp_id,
                name=emp.name,
                latest_status=latest_status,
                latest_date=latest_date,
                present_count=sum(1 for r in records if r.status == "Present"),
                absent_count=sum(1 for r in records if r.status == "Absent"),
                wfh_count=sum(1 for r in records if r.status == "WFH"),
                leave_count=sum(1 for r in records if r.status == "Leave"),
                total_records=len(records),
            )
        )
    return result


@app.get("/api/employees/{emp_id}", response_model=schemas.EmployeeDetail)
def get_employee_detail(emp_id: str, db: Session = Depends(get_db)):
    emp = db.get(models.Employee, emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return schemas.EmployeeDetail(
        emp_id=emp.emp_id,
        name=emp.name,
        attendance=[schemas.AttendanceOut.model_validate(r) for r in emp.attendance_records],
    )


@app.get("/api/attendance", response_model=List[schemas.AttendanceOut])
def list_attendance(
    target_date: Optional[str] = Query(None, alias="date"),
    emp_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Attendance)
    if target_date:
        query = query.filter(models.Attendance.date == date_cls.fromisoformat(target_date))
    if emp_id:
        query = query.filter(models.Attendance.emp_id == emp_id)
    if status:
        query = query.filter(models.Attendance.status == status)
    return query.order_by(models.Attendance.date.desc()).limit(500).all()
