import { api } from './api.js'
import { EVIDENCE_TYPES, isEvidenceType } from '../utils/evidenceType.js'

export { EVIDENCE_TYPES }

/** `type` es obligatorio y solo puede ser IMAGE o VIDEO: se comprueba antes de llamar a la API. */
const assertType = (type) => {
  if (!isEvidenceType(type)) {
    throw new Error(`El tipo de la evidencia es obligatorio y debe ser uno de: ${EVIDENCE_TYPES.join(', ')}.`)
  }
}

/** body: { url, title, type: 'IMAGE' | 'VIDEO', studentIds: string[] } */
export const createEvidence = (body) => {
  assertType(body?.type)
  return api.post('/evidences', body)
}

/** body: cualquiera de { url, title, type }. Si trae `type`, debe ser válido. */
export const updateEvidence = (id, body) => {
  if (body && 'type' in body) assertType(body.type)
  return api.patch(`/evidences/${id}`, body)
}

export const getEvidence = (id) => api.get(`/evidences/${id}`)

/** Cada elemento conserva el `type` de la evidencia (`evidence.type`). */
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
