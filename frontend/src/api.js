import axios from 'axios'

// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.js)
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const getSummary = (date) => api.get('/summary', { params: date ? { date } : {} })
export const getChartData = (days = 14) => api.get('/chart-data', { params: { days } })
export const getStatusDistribution = (date) => api.get('/status-distribution', { params: date ? { date } : {} })
export const getEmployees = (params = {}) => api.get('/employees', { params })
export const getEmployeeDetail = (empId) => api.get(`/employees/${encodeURIComponent(empId)}`)
export const getAttendance = (params = {}) => api.get('/attendance', { params })
export const uploadFile = (file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}
export const getUploadHistory = () => api.get('/uploads/history')

export default api
