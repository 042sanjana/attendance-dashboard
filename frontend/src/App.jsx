import React, { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './components/Dashboard.jsx'
import EmployeeDetail from './components/EmployeeDetail.jsx'
import UploadModal from './components/UploadModal.jsx'

export default function App() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Bumping refreshKey forces Dashboard & children to refetch data
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return (
    <div className="app-shell">
      <Sidebar onUploadClick={() => setUploadOpen(true)} />
      <div className="main-area">
        <Topbar onUploadClick={() => setUploadOpen(true)} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard refreshKey={refreshKey} />} />
            <Route path="/employees/:empId" element={<EmployeeDetail />} />
          </Routes>
        </div>
      </div>
      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            triggerRefresh()
          }}
        />
      )}
    </div>
  )
}
