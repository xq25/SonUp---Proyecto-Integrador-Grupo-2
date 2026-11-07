import { api } from './api.js'

export const getStaff = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.roleId)   params.set('roleId',   filters.roleId)
  if (filters.statusId) params.set('statusId', filters.statusId)
  if (filters.search)   params.set('search',   filters.search)
  const qs = params.toString()
  return api.get(`/staff${qs ? `?${qs}` : ''}`)
}

export const getStaffMember = (id) => api.get(`/staff/${id}`)
