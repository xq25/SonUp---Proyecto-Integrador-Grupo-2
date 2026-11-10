import { api } from './api.js'

export const getProfessionals = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()
  return api.get(`/professionals${qs ? `?${qs}` : ''}`)
}

export const getProfessional = (id) => api.get(`/professionals/${id}`)
