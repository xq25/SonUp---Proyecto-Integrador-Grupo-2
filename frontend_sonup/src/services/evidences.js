import { api } from './api.js'

export const createEvidence = (body) => api.post('/evidences', body)
export const getEvidence = (id) => api.get(`/evidences/${id}`)
export const getStudentEvidences = async (studentId) => {
  const relations = await api.get(`/students/${studentId}/evidences`)
  return relations.map(({ id: studentEvidenceId, studentId: ownerId, evidence }) => {
    if (!evidence) {
      throw new Error('La respuesta de evidencias no incluye el detalle del material.')
    }
    return { ...evidence, studentEvidenceId, studentId: ownerId }
  })
}
export const getEvidenceStudents = (evidenceId) => api.get(`/evidences/${evidenceId}/students`)
