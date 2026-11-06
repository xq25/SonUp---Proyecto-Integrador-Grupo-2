import { api } from './api.js'

export const getChildren = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.search)   params.set('search', filters.search)
  if (filters.statusId) params.set('statusId', filters.statusId)
  const qs = params.toString()
  return api.get(`/children${qs ? `?${qs}` : ''}`)
}

export const getChild = (id) => api.get(`/children/${id}`)

export const getChildGuardians = (childId) => api.get(`/children/${childId}/guardians`)
