import { api } from './api.js'

export const getChildren = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.search)   params.set('search', filters.search)
  if (filters.statusId) params.set('statusId', filters.statusId)
  const qs = params.toString()
  return api.get(`/children${qs ? `?${qs}` : ''}`)
}

export const getChild = (id) => api.get(`/children/${id}`)

export const getChildByDocument = (documentNumber) =>
  api.get(`/children/by-document/${documentNumber}`)

export const getChildGuardians = (childId) => api.get(`/children/${childId}/guardians`)

/**
 * Display helper: returns the name if available, otherwise the id.
 * Follows the API recommendation: `child.statusName ?? child.statusId`
 */
export const displayField = (name, id) => name ?? id ?? '—'
