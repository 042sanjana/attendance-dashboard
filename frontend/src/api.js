import axios from 'axios'

// Vite proxies /api to http://localhost:8000
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// ============================================================
// Dashboard
// ============================================================

export const getSummary = (date) => {
  return api.get('/summary', {
    params: date ? { date } : {},
  })
}

export const getChartData = (days = 14) => {
  return api.get('/chart-data', {
    params: { days },
  })
}

export const getStatusDistribution = (date) => {
  return api.get('/status-distribution', {
    params: date ? { date } : {},
  })
}

// ============================================================
// Employees
// ============================================================

export const getEmployees = (params = {}) => {
  return api.get('/employees', {
    params,
  })
}

export const getEmployeeDetail = (empId) => {
  return api.get(
    `/employees/${encodeURIComponent(empId)}`
  )
}

export const createEmployee = (data) => {
  return api.post(
    '/employees',
    data
  )
}

export const updateEmployee = (
  empId,
  data
) => {
  return api.put(
    `/employees/${encodeURIComponent(empId)}`,
    data
  )
}

export const deleteEmployee = (empId) => {
  return api.delete(
    `/employees/${encodeURIComponent(empId)}`
  )
}

// ============================================================
// Attendance
// ============================================================

export const getAttendance = (
  params = {}
) => {
  return api.get(
    '/attendance',
    {
      params,
    }
  )
}

export const createAttendance = (
  data
) => {
  return api.post(
    '/attendance',
    data
  )
}

export const updateAttendance = (
  recordId,
  data
) => {
  return api.put(
    `/attendance/${recordId}`,
    data
  )
}

export const deleteAttendance = (
  recordId
) => {
  return api.delete(
    `/attendance/${recordId}`
  )
}

// ============================================================
// Excel Upload
// ============================================================

export const uploadFile = (
  file,
  onUploadProgress
) => {
  const formData = new FormData()

  formData.append(
    'file',
    file
  )

  return api.post(
    '/upload',
    formData,
    {
      headers: {
        'Content-Type':
          'multipart/form-data',
      },
      onUploadProgress,
    }
  )
}

// ============================================================
// Upload History
// ============================================================

export const getUploadHistory = () => {
  return api.get(
    '/uploads/history'
  )
}

// ============================================================
// RESET
// ============================================================
//
// React currently uses POST.
// FastAPI now supports POST /api/reset.
//
// This fixes the previous:
// 405 Method Not Allowed
// ============================================================

export const resetAllData = () => {
  return api.post(
    '/reset'
  )
}

export default api