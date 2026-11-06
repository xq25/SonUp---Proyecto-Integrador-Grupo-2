import { api } from './api.js'

export const createCredential = (body) => api.post('/credentials', body)
export const getCredential = (id) => api.get(`/credentials/${id}`)
export const getStudentCredentials = (studentId) => api.get(`/students/${studentId}/credentials`)
export const updateCredential = (id, body) => api.patch(`/credentials/${id}`, body)
export const deleteCredential = (id) => api.delete(`/credentials/${id}`)
