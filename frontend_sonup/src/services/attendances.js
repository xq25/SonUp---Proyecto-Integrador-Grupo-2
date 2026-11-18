import { api } from './api.js'

export const createAttendance = (body) => api.post('/attendances', body)

/** Con el taller cerrado solo se corrige la observación. */
export const updateAttendance = (id, body) => api.patch(`/attendances/${id}`, body)

/** Solo con la sesión en curso. */
export const deleteAttendance = (id) => api.delete(`/attendances/${id}`)

export const getWorkshopAttendances = (workshopId) =>
  api.get(`/workshops/${workshopId}/attendances`)

export const getStudentAttendances = (studentId, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.workshopId) params.set('workshopId', String(filters.workshopId))
  const qs = params.toString()
  return api.get(`/students/${studentId}/attendances${qs ? `?${qs}` : ''}`)
}
