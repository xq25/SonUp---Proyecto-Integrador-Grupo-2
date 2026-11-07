import { api } from './api.js'

export const createEvaluation = (body) => api.post('/evaluations', body)

export const getEvaluationScales = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.activeOnly !== undefined) params.set('activeOnly', String(filters.activeOnly))
  const qs = params.toString()
  return api.get(`/evaluation-scales${qs ? `?${qs}` : ''}`)
}
