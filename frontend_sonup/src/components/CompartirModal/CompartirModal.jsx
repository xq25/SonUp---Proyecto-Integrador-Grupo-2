import { useState, useEffect } from 'react'
import { getChildGuardians } from '../../services/children.js'
import './CompartirModal.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.031 2C6.516 2 2.025 6.49 2.025 12c0 1.93.551 3.73 1.506 5.257L2.001 22l4.898-1.503A9.914 9.914 0 0012.03 22c5.516 0 10.009-4.49 10.009-10S17.547 2 12.031 2zm0 18.232c-1.637 0-3.176-.453-4.498-1.242l-.323-.195-2.91.894.887-2.836-.214-.339A8.18 8.18 0 013.82 12c0-4.527 3.684-8.211 8.211-8.211 4.527 0 8.21 3.684 8.21 8.211 0 4.527-3.683 8.232-8.21 8.232zm4.502-6.175c-.247-.124-1.46-.721-1.687-.803-.227-.082-.392-.124-.557.124-.165.247-.639.803-.783.968-.144.165-.288.185-.535.062-.247-.124-1.042-.384-1.986-1.225-.734-.655-1.23-1.464-1.374-1.711-.144-.247-.015-.38.109-.503.111-.111.247-.288.371-.432.124-.144.165-.247.247-.412.082-.165.041-.309-.021-.432-.062-.124-.557-1.34-.763-1.835-.2-.483-.404-.417-.557-.425l-.474-.008c-.165 0-.432.062-.659.309-.227.247-.866.845-.866 2.061 0 1.216.886 2.391 1.01 2.556.124.165 1.745 2.665 4.227 3.738.59.255 1.051.408 1.41.522.593.189 1.133.162 1.56.099.476-.071 1.46-.597 1.666-1.175.206-.577.206-1.072.144-1.175-.062-.103-.227-.165-.474-.288z"/>
  </svg>
)

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const cleanPhoneForWhatsApp = (raw) => {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`
  }
  return digits
}

const getUnshareableResourceError = (rawUrl) => {
  if (!rawUrl) return ''

  let hostname
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase()
  } catch {
    return 'La URL guardada para este material no es válida. Actualízala antes de compartir.'
  }

  const isReservedHost = hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.test') ||
    hostname.endsWith('.example') ||
    hostname.endsWith('.invalid')

  return isReservedHost
    ? 'El enlace guardado es de prueba y no es accesible para las familias. Actualiza el material con una URL pública HTTPS antes de compartir.'
    : ''
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function CompartirModal({
  isOpen,
  onClose,
  title = 'Compartir con la familia',
  tag = 'COMPARTIR CON FAMILIAR',
  childId,
  initialGuardian,
  studentName,
  defaultSubject = '',
  defaultMessage = '',
  resourceUrl = '',
  attachmentFile = null,
  recipientOptions = [],
  externalError = '',
}) {
  const recipientOptionsKey = recipientOptions.map(item => String(item.id)).join('|')
  const [guardian, setGuardian]   = useState(initialGuardian ?? null)
  const [guardianOptions, setGuardianOptions] = useState(initialGuardian ? [initialGuardian] : [])
  const [selectedRecipientId, setSelectedRecipientId] = useState(String(childId ?? recipientOptions[0]?.id ?? ''))
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [subject, setSubject]     = useState(defaultSubject)
  const [message, setMessage]     = useState(defaultMessage)
  const [cargando, setCargando]   = useState(false)
  const [copiado, setCopiado]     = useState(false)
  const [errorCompartir, setErrorCompartir] = useState('')
  const [estadoCompartir, setEstadoCompartir] = useState('')
  const [gmailComposeUrl, setGmailComposeUrl] = useState('')

  /* Sync defaults */
  useEffect(() => {
    setSubject(defaultSubject)
    setMessage(defaultMessage)
  }, [defaultSubject, defaultMessage])

  useEffect(() => {
    if (!isOpen) return
    setSelectedRecipientId(String(childId ?? recipientOptions[0]?.id ?? ''))
  }, [isOpen, childId, recipientOptionsKey])

  /* Load guardian from childId if not passed */
  useEffect(() => {
    if (!isOpen) return
    let active = true
    setGuardian(null)
    setGuardianOptions([])
    setPhone('')
    setEmail('')
    setCargando(false)
    setErrorCompartir('')
    setEstadoCompartir('')
    setGmailComposeUrl('')

    if (initialGuardian) {
      setGuardian(initialGuardian)
      setGuardianOptions([initialGuardian])
      setPhone(initialGuardian.phone || '')
      setEmail(initialGuardian.email || '')
      return () => { active = false }
    }

    if (!selectedRecipientId) {
      setCargando(false)
      return () => { active = false }
    }

    setCargando(true)
    getChildGuardians(selectedRecipientId)
      .then((res) => {
        if (!active) return
        const options = Array.isArray(res)
          ? res.map(item => item.guardian ?? item)
          : []
        setGuardianOptions(options)
        const first = options[0] ?? null
        setGuardian(first)
        setPhone(first?.phone || '')
        setEmail(first?.email || '')
      })
      .catch((error) => {
        if (active) setErrorCompartir(`No se pudieron consultar los acudientes: ${error.message}`)
      })
      .finally(() => {
        if (active) setCargando(false)
      })

    return () => { active = false }
  }, [isOpen, selectedRecipientId, initialGuardian])

  if (!isOpen) return null

  const selectedRecipient = recipientOptions.find(
    item => String(item.id) === selectedRecipientId
  )
  const displayedStudentName = selectedRecipient?.name || studentName
  const blockUnshareableResource = () => {
    const error = getUnshareableResourceError(resourceUrl)
    if (!error) return false
    setErrorCompartir(error)
    return true
  }

  const buildMessage = (needsAttachment = false) => {
    let text = message.trim()
    if (resourceUrl && !text.includes(resourceUrl)) {
      text = `${text}${text ? '\n\n' : ''}Consulta el material aquí:\n${resourceUrl}`
    }
    if (needsAttachment && attachmentFile) {
      text = `${text}${text ? '\n\n' : ''}Antes de enviar, adjunta el archivo descargado "${attachmentFile.name}".`
    }
    return text
  }

  const downloadAttachment = () => {
    if (!attachmentFile) return
    const url = URL.createObjectURL(attachmentFile)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = attachmentFile.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const enviarWhatsApp = () => {
    const waPhone = cleanPhoneForWhatsApp(phone)
    if (!waPhone) {
      setErrorCompartir('Ingresa el número de WhatsApp de la familia para continuar.')
      return
    }
    if (blockUnshareableResource()) return
    setErrorCompartir('')
    if (attachmentFile) downloadAttachment()
    const text = encodeURIComponent(buildMessage(Boolean(attachmentFile)))
    const url = `https://wa.me/${waPhone}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
    if (attachmentFile) {
      setEstadoCompartir(`Se descargó ${attachmentFile.name}; adjúntalo en WhatsApp antes de enviar.`)
    }
  }

  const enviarCorreo = () => {
    const destination = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      setErrorCompartir('Ingresa un correo electrónico válido para continuar.')
      return
    }
    if (blockUnshareableResource()) return
    setErrorCompartir('')
    if (attachmentFile) downloadAttachment()
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: destination,
      su: subject,
      body: buildMessage(Boolean(attachmentFile)),
    })
    const composeUrl = `https://mail.google.com/mail/?${params.toString()}`
    setGmailComposeUrl(composeUrl)
    const composeWindow = window.open(composeUrl, '_blank')
    if (!composeWindow) {
      setEstadoCompartir('El navegador bloqueó la nueva pestaña. Usa el enlace para abrir el borrador en Gmail.')
      return
    }
    composeWindow.opener = null
    setEstadoCompartir(attachmentFile
      ? `Se abrió un borrador de Gmail. Adjunta ${attachmentFile.name} y pulsa Enviar.`
      : 'Se abrió un borrador de Gmail. Revisa el mensaje y pulsa Enviar.')
  }

  const compartirArchivo = async () => {
    if (!attachmentFile) return
    if (blockUnshareableResource()) return
    setErrorCompartir('')
    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [attachmentFile] })) {
      try {
        await navigator.share({
          files: [attachmentFile],
          title,
          text: buildMessage(),
          url: resourceUrl || undefined,
        })
        setEstadoCompartir('El archivo quedó listo para compartir desde la aplicación que elijas.')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorCompartir(`No se pudo abrir la opción para compartir el archivo: ${error.message}`)
        }
      }
      return
    }

    downloadAttachment()
    setEstadoCompartir(`Se descargó ${attachmentFile.name}; adjúntalo en WhatsApp o en tu correo.`)
  }

  const copiarPortapapeles = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = message
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  return (
    <div className="comp-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="comp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Head */}
        <header className="comp-header">
          <div>
            <p className="comp-tag">{tag}</p>
            <h2 className="comp-titulo">{title}</h2>
          </div>
          <button className="comp-close" onClick={onClose} aria-label="Cerrar modal">
            <XIcon />
          </button>
        </header>

        {/* Body */}
        <div className="comp-body">

          {/* Acudiente info card */}
          {guardian ? (
            <div className="comp-acudiente-card">
              <div className="comp-acudiente-info">
                <span className="comp-acudiente-label">Familiar registrado</span>
                <p className="comp-acudiente-nombre">{guardian.fullName || 'Acudiente'}</p>
                {displayedStudentName && (
                  <span className="comp-acudiente-sub">Estudiante: {displayedStudentName}</span>
                )}
              </div>
              {guardian.phone && (
                <span className="comp-acudiente-sub">Tel: {guardian.phone}</span>
              )}
            </div>
          ) : cargando ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Consultando datos del acudiente…
            </p>
          ) : (
            displayedStudentName && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Estudiante: <strong>{displayedStudentName}</strong>
              </p>
            )
          )}
          {(errorCompartir || externalError) && (
            <p className="comp-mensaje comp-mensaje--error" role="alert">{errorCompartir || externalError}</p>
          )}
          {estadoCompartir && (
            <p className="comp-mensaje" role="status">{estadoCompartir}</p>
          )}
          {gmailComposeUrl && (
            <p className="comp-mensaje">
              <a href={gmailComposeUrl} target="_blank" rel="noreferrer">Abrir borrador en Gmail</a>
            </p>
          )}

          {recipientOptions.length > 1 && (
            <div className="comp-campo">
              <label className="comp-label" htmlFor="comp-student">Estudiante destinatario</label>
              <select
                id="comp-student"
                className="comp-input"
                value={selectedRecipientId}
                onChange={(event) => setSelectedRecipientId(event.target.value)}
              >
                {recipientOptions.map(item => (
                  <option key={String(item.id)} value={String(item.id)}>{item.name}</option>
                ))}
              </select>
            </div>
          )}

          {guardianOptions.length > 1 && (
            <div className="comp-campo">
              <label className="comp-label" htmlFor="comp-guardian">Acudiente destinatario</label>
              <select
                id="comp-guardian"
                className="comp-input"
                value={String(guardian?.id ?? '')}
                onChange={(event) => {
                  const selected = guardianOptions.find(item => String(item.id) === event.target.value)
                  setGuardian(selected ?? null)
                  setPhone(selected?.phone || '')
                  setEmail(selected?.email || '')
                }}
              >
                {guardianOptions.map((item, index) => (
                  <option key={String(item.id ?? index)} value={String(item.id ?? '')}>
                    {item.fullName || `Acudiente ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Teléfono / WhatsApp input */}
          <div className="comp-campo">
            <label className="comp-label">Teléfono / WhatsApp de la familia</label>
            <input
              type="tel"
              className="comp-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 3001234567"
            />
          </div>

          {/* Correo input */}
          <div className="comp-campo">
            <label className="comp-label">Correo electrónico de la familia</label>
            <input
              type="email"
              className="comp-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            {!email && (
              <span className="comp-ayuda">No hay un correo disponible en el registro; puedes escribirlo aquí.</span>
            )}
          </div>

          {/* Asunto input */}
          <div className="comp-campo">
            <label className="comp-label">Asunto</label>
            <input
              type="text"
              className="comp-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Mensaje textarea */}
          <div className="comp-campo">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="comp-label">Mensaje para la familia</label>
              <button
                type="button"
                className={`btn-comp-copiar${copiado ? ' btn-comp-copiar--copiado' : ''}`}
                onClick={copiarPortapapeles}
              >
                {copiado ? <CheckIcon /> : <CopyIcon />}
                {copiado ? '¡Copiado!' : 'Copiar mensaje'}
              </button>
            </div>
            <textarea
              className="comp-textarea"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Canales de envío */}
          <div className="comp-campo">
            <label className="comp-label">Enviar a través de:</label>
            <div className="comp-metodos">
              <button
                type="button"
                className="btn-comp-canal btn-comp-whatsapp"
                onClick={enviarWhatsApp}
                disabled={!cleanPhoneForWhatsApp(phone)}
                title={!cleanPhoneForWhatsApp(phone) ? 'Ingresa un teléfono de WhatsApp' : 'Abrir WhatsApp con el material'}
              >
                <WhatsAppIcon />
                WhatsApp
              </button>
              <button
                type="button"
                className="btn-comp-canal btn-comp-correo"
                onClick={enviarCorreo}
                disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
                title={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Ingresa un correo válido' : 'Abrir Gmail con el mensaje preparado'}
              >
                <MailIcon />
                Abrir Gmail
              </button>
            </div>
          </div>

          {attachmentFile && (
            <button type="button" className="btn-comp-archivo" onClick={compartirArchivo}>
              Compartir archivo: {attachmentFile.name}
            </button>
          )}

        </div>

        {/* Footer */}
        <footer className="comp-footer">
          <button type="button" className="btn-comp-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </footer>

      </div>
    </div>
  )
}
