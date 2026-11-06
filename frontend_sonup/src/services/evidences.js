import { api } from './api.js'

export const createEvidence = (body) => api.post('/evidences', body)
export const getEvidence = (id) => api.get(`/evidences/${id}`)
export const getStudentEvidences = (studentId) => api.get(`/students/${studentId}/evidences`)
export const getEvidenceStudents = (evidenceId) => api.get(`/evidences/${evidenceId}/students`)
