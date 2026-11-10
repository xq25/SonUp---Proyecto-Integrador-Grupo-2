import { useState } from 'react'
import { EVIDENCE_TYPE_LABEL, guessEvidenceType } from '../../utils/evidenceType.js'
import './EvidencePreview.css'

const ImageIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
)
const VideoIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

export const TypeBadge = ({ type }) => (
  <span className={`evp-badge evp-badge--${String(type || 'none').toLowerCase()}`}>
    {EVIDENCE_TYPE_LABEL[type] ?? 'Sin tipo'}
  </span>
)

/**
 * Vista de una evidencia según su `type`:
 *  - IMAGE → <img>
 *  - VIDEO → <video> si el enlace es un archivo directo (.mp4, .webm…); si es Drive/YouTube no se
 *    puede incrustar de forma segura, así que se muestra el icono y el enlace «Abrir».
 * `variant="thumb"` es la miniatura de la tarjeta (nunca reproduce); `"full"` es el visor.
 */
const EvidencePreview = ({ evidence, variant = 'thumb', fondo }) => {
  const [fallo, setFallo] = useState(false)
  const { url, type, title } = evidence
  const esArchivoVideo = type === 'VIDEO' && guessEvidenceType(url) === 'VIDEO'
  const icono = type === 'IMAGE' ? <ImageIcon size={variant === 'full' ? 34 : 22} /> : <VideoIcon size={variant === 'full' ? 34 : 22} />

  let contenido
  if (type === 'IMAGE' && !fallo) {
    contenido = <img className="evp-media" src={url} alt={title} loading="lazy" referrerPolicy="no-referrer" onError={() => setFallo(true)} />
  } else if (esArchivoVideo && variant === 'full' && !fallo) {
    contenido = <video className="evp-media" src={url} controls preload="metadata" onError={() => setFallo(true)} />
  } else {
    contenido = (
      <div className="evp-placeholder">
        <span className="evp-icono">{icono}</span>
        {variant === 'full' && (
          <small>{fallo ? 'No se pudo previsualizar aquí.' : 'Este material se abre en otra pestaña.'}</small>
        )}
      </div>
    )
  }

  return (
    <div className={`evp evp--${variant}`} style={fondo ? { background: fondo } : undefined}>
      {contenido}
    </div>
  )
}

export default EvidencePreview
