import { api } from './api.js'

export const createAttendance = (body) => api.post('/attendances', body)

/** Con el taller cerrado solo se corrige la observación. */
export const updateAttendance = (id, body) => api.patch(`/attendances/${id}`, body)

export const getWorkshopAttendances = (workshopId) =>
  api.get(`/workshops/${workshopId}/attendances`)

export const getStudentAttendances = (studentId) =>
  api.get(`/students/${studentId}/attendances`)
