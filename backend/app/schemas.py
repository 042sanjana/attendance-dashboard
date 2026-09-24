"""
Pydantic schemas used for request/response validation.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, time, datetime


class AttendanceBase(BaseModel):
    date: date
    status: str
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    comments: Optional[str] = None


class AttendanceOut(AttendanceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    emp_id: str


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    emp_id: str
    name: str


class EmployeeWithStats(EmployeeOut):
    latest_status: Optional[str] = None
    latest_date: Optional[date] = None
    present_count: int = 0
    absent_count: int = 0
    wfh_count: int = 0
    leave_count: int = 0
    total_records: int = 0


class EmployeeDetail(EmployeeOut):
    attendance: List[AttendanceOut] = []


class SummaryOut(BaseModel):
    total_employees: int
    present: int
    absent: int
    wfh: int
    leave: int
    half_day: int
    date: Optional[str] = None


ALLOWED_STATUSES = ("Present", "Absent", "WFH", "Leave", "Half Day")


class EmployeeCreate(BaseModel):
    emp_id: str
    name: str


class EmployeeUpdate(BaseModel):
    name: str


class AttendanceCreate(BaseModel):
    emp_id: str
    date: date
    status: str
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    comments: Optional[str] = None


class AttendanceUpdate(BaseModel):
    date: Optional[date] = None
    status: Optional[str] = None
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    comments: Optional[str] = None


class UploadRowError(BaseModel):
    row: int
    reason: str
    data: Optional[dict] = None


class UploadResult(BaseModel):
    filename: str
    total_rows: int
    new_employees: int
    inserted_attendance: int
    updated_attendance: int
    error_rows: int
    errors: List[UploadRowError] = []
    preview_inserted: List[dict] = []
    preview_updated: List[dict] = []


class ChartPoint(BaseModel):
    date: str
    present: int
    absent: int
    wfh: int
    leave: int
    half_day: int