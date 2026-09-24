import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import { getEmployeeDetail } from '../api.js'

export default function EmployeeDetail() {
  const { empId } = useParams()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getEmployeeDetail(empId)
      .then((res) => { if (active) setEmployee(res.data) })
      .catch(() => { if (active) setError('Employee not found or the server is unreachable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [empId])

  const counts = React.useMemo(() => {
    const base = { Present: 0, Absent: 0, WFH: 0, Leave: 0, 'Half Day': 0 }
    employee?.attendance?.forEach((r) => { base[r.status] = (base[r.status] || 0) + 1 })
    return base
  }, [employee])

  return (
    <div className="employee-detail">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to dashboard</Link>

      {loading && <div className="chart-placeholder">Loading employee…</div>}
      {error && <div className="alert alert-error page-alert">{error}</div>}

      {employee && !loading && (
        <>
          <div className="employee-header-card">
            <div className="employee-avatar"><User size={28} /></div>
            <div>
              <h2>{employee.name}</h2>
              <p className="mono">{employee.emp_id}</p>
            </div>
          </div>

          <div className="summary-grid employee-stats-grid">
            {Object.entries(counts).map(([status, count]) => (
              <div className="summary-card" key={status}>
                <div className="summary-card-body">
                  <span className="summary-card-value">{count}</span>
                  <span className="summary-card-label">{status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <h3>Attendance History</h3>
              <span className="chart-subtitle">{employee.attendance.length} records</span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.attendance.length === 0 ? (
                    <tr><td colSpan={5} className="empty-row">No attendance records yet.</td></tr>
                  ) : (
                    employee.attendance.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{r.check_in || '—'}</td>
                        <td>{r.check_out || '—'}</td>
                        <td>{r.comments || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
