import { useState } from 'react'
import './CertificatePreview.css'

export const CREDENTIAL_STATUS_LABEL = { pending: 'Borrador', valid: 'Válido', revoked: 'Revocado' }

const IMAGEN = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i
const PDF    = /\.pdf(\?|#|$)/i

/** Drive: .../file/d/ID/view → .../file/d/ID/preview (la versión incrustable). */
const driveEmbed = (url) => {
  const m = /^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/.exec(url || '')
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null
}

export const CredentialStatus = ({ status }) => (
  <span className={`certp-estado certp-estado--${status}`}>{CREDENTIAL_STATUS_LABEL[status] ?? status}</span>
)

/**
 * Vista previa de un certificado (credencial) a partir de su `url`; las credenciales no tienen `type`:
 *  - imagen (.png/.jpg/…)         → <img>
 *  - PDF directo (.pdf)            → <embed type="application/pdf">
 *  - Google Drive                  → <iframe> con la versión /preview
 *  - cualquier otra cosa           → solo el enlace
 * Siempre queda el enlace «Descargar o abrir», porque muchos servidores no permiten incrustar.
 */
const CertificatePreview = ({ url, title = 'Certificado' }) => {
  const [fallo, setFallo] = useState(false)
  if (!url) return <p className="certp-vacio">Este certificado no tiene documento asociado.</p>

  const drive = driveEmbed(url)
  let visor = null
  if (IMAGEN.test(url) && !fallo) {
    visor = <img className="certp-media" src={url} alt={title} referrerPolicy="no-referrer" onError={() => setFallo(true)} />
  } else if (PDF.test(url)) {
    visor = <embed className="certp-media certp-media--doc" src={url} type="application/pdf" title={title} />
  } else if (drive) {
    visor = <iframe className="certp-media certp-media--doc" src={drive} title={title} referrerPolicy="no-referrer" allow="fullscreen" />
  }

  return (
    <div className="certp">
      {visor ?? <p className="certp-vacio">{fallo ? 'No se pudo previsualizar la imagen aquí.' : 'Este documento no se puede previsualizar aquí.'}</p>}
      <a className="certp-link" href={url} target="_blank" rel="noopener noreferrer">Descargar o abrir en otra pestaña ↗</a>
    </div>
  )
}

export default CertificatePreview
