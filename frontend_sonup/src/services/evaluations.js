import { api } from './api.js'

export const createEvaluation = (body) => api.post('/evaluations', body)

export const getEvaluationScales = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.activeOnly !== undefined) params.set('activeOnly', String(filters.activeOnly))
  const qs = params.toString()
  return api.get(`/evaluation-scales${qs ? `?${qs}` : ''}`)
}

/** Evaluaciones de una asistencia: [{ workshopSkillId, evaluationScaleId, … }] */
export const getAttendanceEvaluations = (attendanceId) =>
  api.get(`/attendances/${attendanceId}/evaluations`)

/** Quita una valoración guardada (solo con el taller en curso). `workshopSkillId` es el id de la fila workshop_skill. */
export const deleteEvaluation = (attendanceId, workshopSkillId) =>
  api.delete(`/attendances/${attendanceId}/evaluations/${workshopSkillId}`)
