/**
 * Tipo de una evidencia. El backend solo acepta estos dos valores, en mayúsculas
 * (cualquier otro, o si falta, responde 400). El front los usa para previsualizar
 * con <img> o <video>.
 */
export const EVIDENCE_TYPES = ['VIDEO', 'IMAGE']

export const EVIDENCE_TYPE_LABEL = {
  IMAGE: 'Imagen',
  VIDEO: 'Video',
}

export const isEvidenceType = (value) => EVIDENCE_TYPES.includes(value)

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'ogg']

/**
 * Sugerencia de tipo según la extensión de la URL. Devuelve null si no se puede
 * deducir (URLs de Drive, YouTube o sin extensión): ahí la persona debe elegirlo.
 */
export const guessEvidenceType = (url) => {
  try {
    const ext = new URL(String(url).trim()).pathname.split('.').pop()?.toLowerCase()
    if (IMAGE_EXT.includes(ext)) return 'IMAGE'
    if (VIDEO_EXT.includes(ext)) return 'VIDEO'
  } catch { /* URL incompleta mientras se escribe */ }
  return null
}
