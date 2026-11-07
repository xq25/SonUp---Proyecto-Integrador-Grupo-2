import { api } from './api.js'

export const getGuardians = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()
  return api.get(`/guardians${qs ? `?${qs}` : ''}`)
}

export const getGuardian = (id) => api.get(`/guardians/${id}`)

export const getGuardianChildren = (guardianId) => api.get(`/guardians/${guardianId}/children`)
