import React from 'react'

const STATUS_CLASS = {
  Present: 'badge-present',
  Absent: 'badge-absent',
  WFH: 'badge-wfh',
  Leave: 'badge-leave',
  'Half Day': 'badge-halfday',
}

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-none">—</span>
  const cls = STATUS_CLASS[status] || 'badge-none'
  return <span className={`badge ${cls}`}>{status}</span>
}
