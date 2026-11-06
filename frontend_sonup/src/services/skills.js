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

export const getStudentSkills = (studentId) => api.get(`/students/${studentId}/skills`)
