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

export const updateWorkshop = (id, body) => api.patch(`/workshops/${id}`, body)

export const getWorkshopSkills = (workshopId) =>
  api.get(`/workshops/${workshopId}/skills`)

export const createWorkshop = (body) => api.post('/workshops', body)

export const addWorkshopSkill = (workshopId, skillId) =>
  api.put(`/workshops/${workshopId}/skills/${skillId}`)
