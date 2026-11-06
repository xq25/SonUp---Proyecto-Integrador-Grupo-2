import { api } from './api.js'

export const createAttendance = (body) => api.post('/attendances', body)

export const getWorkshopAttendances = (workshopId) =>
  api.get(`/workshops/${workshopId}/attendances`)

export const getStudentAttendances = (studentId) =>
  api.get(`/students/${studentId}/attendances`)
