import { api } from './api.js'

export const createEvaluation = (body) => api.post('/evaluations', body)

export const getEvaluationScales = () => api.get('/evaluation-scales')
