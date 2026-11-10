import { api } from './api.js'

export const getWorkshops = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.evaluatorId) params.set('evaluatorId', String(filters.evaluatorId))
  if (filters.status)      params.set('status', filters.status)
  if (filters.search)      params.set('search', filters.search)
  const qs = params.toString()
  return api.get(`/workshops${qs ? `?${qs}` : ''}`)
}

export const getWorkshop = (id) => api.get(`/workshops/${id}`)

export const createWorkshop = (body) => api.post('/workshops', body)

/** Solo un taller `planned` cambia sus datos; en `active` solo cambia el estado. */
export const updateWorkshop = (id, body) => api.patch(`/workshops/${id}`, body)

/** Solo si no tiene asistencias; si las tiene, se cancela. */
export const deleteWorkshop = (id) => api.delete(`/workshops/${id}`)

export const getWorkshopSkills = (workshopId) =>
  api.get(`/workshops/${workshopId}/skills`)

export const addWorkshopSkill = (workshopId, skillId) =>
  api.put(`/workshops/${workshopId}/skills/${skillId}`)

export const removeWorkshopSkill = (workshopId, skillId) =>
  api.delete(`/workshops/${workshopId}/skills/${skillId}`)

/* ── Transiciones del ciclo de vida: planned → active → finished (o cancelled) ── */

/** Fase 1 → 2. Exige al menos una habilidad y fecha de inicio (puede ir en el mismo cambio). */
export const activateWorkshop = (id, startsAt) =>
  updateWorkshop(id, startsAt ? { status: 'active', startsAt } : { status: 'active' })

/** Fase 2 → 3. Exige fecha de fin >= inicio y >= última asistencia. */
export const finishWorkshop = (id, endsAt = new Date().toISOString()) =>
  updateWorkshop(id, { status: 'finished', endsAt })

/** Desde planned o active. finished y cancelled son finales. */
export const cancelWorkshop = (id) => updateWorkshop(id, { status: 'cancelled' })

/**
 * Joven y acudiente: `GET /workshops` solo devuelve los talleres por hacerse o en curso (planned/active).
 * Los que ya se finalizaron se consultan por id, que la API permite si el joven asistió.
 * Completa la lista con esos talleres para no perder su nombre en el historial.
 */
export const completeWorkshopsFromAttendances = async (workshops, attendances) => {
  const known = new Map(workshops.map(w => [String(w.id), w]))
  const missing = [...new Set(attendances.map(a => String(a.workshopId)))].filter(id => !known.has(id))
  const res = await Promise.allSettled(missing.map(id => getWorkshop(id)))
  res.forEach(r => { if (r.status === 'fulfilled') known.set(String(r.value.id), r.value) })
  return [...known.values()]
}
