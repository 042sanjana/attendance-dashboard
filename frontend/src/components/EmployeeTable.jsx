import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'

export default function EmployeeTable({
  employees,
  loading,
  search,
  onSearchChange,
  selectedDate,
  onDateChange,
}) {
  const navigate = useNavigate()

  return (
    <div className="table-card" id="employees-section">
      <div className="table-card-header">
        <div>
          <h3>Employees</h3>
          <span className="chart-subtitle">{employees.length} shown</span>
        </div>
        <div className="table-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or Emp ID…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Status ({selectedDate || 'latest'})</th>
              <th>Present</th>
              <th>Absent</th>
              <th>WFH</th>
              <th>Total Records</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">Loading employees…</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No employees found. Try adjusting your search or upload an Excel file.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr
                  key={emp.emp_id}
                  className="clickable-row"
                  onClick={() => navigate(`/employees/${encodeURIComponent(emp.emp_id)}`)}
                >
                  <td className="mono">{emp.emp_id}</td>
                  <td className="emp-name-cell">{emp.name}</td>
                  <td><StatusBadge status={emp.latest_status} /></td>
                  <td>{emp.present_count}</td>
                  <td>{emp.absent_count}</td>
                  <td>{emp.wfh_count}</td>
                  <td>{emp.total_records}</td>
                  <td className="row-arrow"><ChevronRight size={16} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
