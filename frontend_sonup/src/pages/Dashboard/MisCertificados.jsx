import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudentCredentials } from '../../services/credentials.js'
import CompartirModal from '../../components/CompartirModal/CompartirModal.jsx'
import './MisCertificados.css'

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const RibbonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const ICON_PALETA = [
  { bg: '#E2F2EF', color: '#176D65' },
  { bg: '#FFF0D8', color: '#F49A18' },
  { bg: '#E2EDF5', color: '#3477A9' },
  { bg: '#F0E8F5', color: '#7B3D9B' },
]
const paleta = (id) => ICON_PALETA[Number(String(id ?? '0').at(-1) ?? 0) % ICON_PALETA.length]

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const ESTADO_LABEL = { pending: 'Borrador', valid: 'Firmado', revoked: 'Revocado' }

/* ─── Component ──────────────────────────────────────────────────────────── */

const MisCertificados = () => {
  const navigate = useNavigate()
  const [certificados, setCertificados] = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [selectedCert, setSelectedCert] = useState(null)
  const [mostrarCompartir, setMostrarCompartir] = useState(false)

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
    getStudentCredentials(studentId)
      .then(data => setCertificados(data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="mcert-page">
      {/* Top bar */}
      <header className="mcert-topbar">
        <button
          className="mcert-topbar__back"
          onClick={() => {
            if (selectedCert) setSelectedCert(null)
            else navigate('/dashboard')
          }}
          aria-label="Volver"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="mcert-topbar__title">Mis certificados</h1>
        <button className="mcert-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Vista detalle */}
      {selectedCert ? (
        <section className="mcert-detail" aria-label="Detalle del certificado">
          <div className="mcert-detail__nav">
            <button className="mcert-detail__back-link" onClick={() => setSelectedCert(null)}>
              <ChevronLeftIcon /> Ver todos
            </button>
          </div>

          <article className="mcert-diploma">
            <div className="mcert-diploma__border">
              <div className="mcert-diploma__badge">
                <RibbonIcon />
              </div>
              <p className="mcert-diploma__brand">SON UP</p>
              <h2 className="mcert-diploma__heading">CERTIFICADO DE PARTICIPACIÓN</h2>
              <p className="mcert-diploma__intro">Se otorga el presente certificado a</p>
              <p className="mcert-diploma__student">
                {/* nombre del estudiante — usamos "participante" si no está disponible */}
                Participante
              </p>
              <p className="mcert-diploma__text">
                por su participación activa en <strong>{selectedCert.organizationName}</strong>.
              </p>
              <p className="mcert-diploma__date">
                Fundación Asisco · {selectedCert.createdAt ? formatFecha(selectedCert.createdAt) : '—'}
              </p>
            </div>
          </article>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {selectedCert.url && (
              <a
                href={selectedCert.url}
                target="_blank"
                rel="noreferrer"
                className="mcert-download-btn"
              >
                <DownloadIcon />
                <span>Ver certificado</span>
              </a>
            )}
            <button
              type="button"
              className="mcert-download-btn"
              style={{ background: '#25D366', color: '#fff' }}
              onClick={() => setMostrarCompartir(true)}
            >
              <SendIcon />
              <span>Compartir con familiar</span>
            </button>
          </div>
        </section>
      ) : (
        /* Vista lista */
        <section className="mcert-list-section" aria-label="Lista de certificados">
          {cargando ? (
            <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
              Cargando certificados…
            </p>
          ) : certificados.length === 0 ? (
            <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
              Aún no tienes certificados.
            </p>
          ) : (
            <div className="mcert-grid" role="list">
              {certificados.map(cert => {
                const p = paleta(cert.id)
                return (
                  <button
                    key={String(cert.id)}
                    className="mcert-card"
                    role="listitem"
                    onClick={() => setSelectedCert(cert)}
                    aria-label={`Ver certificado de ${cert.organizationName}`}
                  >
                    <div
                      className="mcert-card__icon"
                      style={{ backgroundColor: p.bg, color: p.color }}
                      aria-hidden="true"
                    >
                      <RibbonIcon />
                    </div>
                    <div className="mcert-card__info">
                      <h2 className="mcert-card__title">{cert.organizationName}</h2>
                      <p className="mcert-card__sub">
                        {ESTADO_LABEL[cert.status] ?? cert.status}
                        {cert.createdAt ? ` · ${formatFecha(cert.createdAt)}` : ''}
                      </p>
                    </div>
                    <div className="mcert-card__chevron" aria-hidden="true">
                      <ChevronRightIcon />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Modal compartir certificado */}
      <CompartirModal
        isOpen={mostrarCompartir && Boolean(selectedCert)}
        onClose={() => setMostrarCompartir(false)}
        title={selectedCert ? `Certificado: ${selectedCert.organizationName}` : 'Compartir certificado'}
        tag="RECONOCIMIENTO · SON UP"
        childId={selectedCert?.studentId}
        resourceUrl={selectedCert?.url || ''}
        defaultSubject={selectedCert ? `¡Obtuve un certificado! ${selectedCert.organizationName}` : 'Mi certificado Son Up'}
        defaultMessage={selectedCert ? `Hola familia,\n\n¡Miren el certificado "${selectedCert.organizationName}" que obtuve en Son Up!\n\nPueden verlo aquí:\n${selectedCert.url ?? '(enlace adjunto)'}\n\n¡Estoy muy feliz de compartirlo con ustedes!` : ''}
      />

      {/* Footer */}
      <footer className="mcert-footer">
        <button className="mcert-logout" onClick={() => navigate('/login')} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default MisCertificados
