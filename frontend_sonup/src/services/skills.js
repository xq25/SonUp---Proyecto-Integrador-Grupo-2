import { api } from './api.js'

export const getSkills = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.skillCategoryId) params.set('skillCategoryId', filters.skillCategoryId)
  if (filters.status)          params.set('status', filters.status)
  const qs = params.toString()
  return api.get(`/skills${qs ? `?${qs}` : ''}`)
}

export const getSkillCategories = () => api.get('/skill-categories')

export const getStudentCategoryAverages = (studentId) => api.get(`/students/${studentId}/category-averages`)

export const getStudentProgress = (studentId, { from, to } = {}) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to)   params.set('to', to)
  const qs = params.toString()
  return api.get(`/students/${studentId}/progress${qs ? `?${qs}` : ''}`)
}

export const getStudentSkills = (studentId) => api.get(`/students/${studentId}/skills`)

export const createSkillCategory = (body) => api.post('/skill-categories', body)
export const createSkill = (body) => api.post('/skills', body)
