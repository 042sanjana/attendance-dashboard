import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { resetAllData } from '../api.js'

export default function ResetDataButton({ onReset, className = 'nav-item' }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await resetAllData()
      setOpen(false)
      onReset?.()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to reset data.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <Trash2 size={18} />
        <span>Reset All Data</span>
      </button>
      {open && (
        <ConfirmDialog
          title="Reset all attendance data?"
          message="This permanently deletes every employee, every attendance record, and the upload history — giving you a completely fresh, empty dashboard. This cannot be undone."
          confirmLabel="Reset Everything"
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  )
}