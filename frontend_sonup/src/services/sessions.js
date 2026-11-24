import { api } from './api.js'

export const getWorkshopSessions = (workshopId) =>
  api.get(`/workshops/${workshopId}/sessions`)

export const createSession = (workshopId, body) =>
  api.post(`/workshops/${workshopId}/sessions`, body)

export const updateSession = (id, body) => api.patch(`/sessions/${id}`, body)

export const startSession = (id) => api.post(`/sessions/${id}/start`)

/** endsAt opcional: si no se pasa, el backend usa la hora actual. */
export const finishSession = (id, endsAt) =>
  api.post(`/sessions/${id}/finish`, endsAt ? { endsAt } : {})

export const deleteSession = (id) => api.delete(`/sessions/${id}`)

export const getSessionAttendances = (id) => api.get(`/sessions/${id}/attendances`)
