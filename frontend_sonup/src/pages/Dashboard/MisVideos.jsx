import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudentEvidences } from '../../services/evidences.js'
import './MisVideos.css'

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

const VideoCameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const CARD_COLORS = ['#176D65','#3D9387','#2E9B56','#F49A18','#3477A9','#9B6B2E']
const cardColor = (id) => CARD_COLORS[Number(String(id ?? '0').at(-1) ?? 0) % CARD_COLORS.length]

/* ─── Component ──────────────────────────────────────────────────────────── */

const MisVideos = () => {
  const navigate = useNavigate()
  const [evidencias,     setEvidencias]     = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [selectedVideo,  setSelectedVideo]  = useState(null)

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
    getStudentEvidences(studentId)
      .then(data => setEvidencias(data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="mv-page">
      {/* Top bar */}
      <header className="mv-topbar">
        <button className="mv-topbar__back" onClick={() => navigate('/dashboard')} aria-label="Volver al inicio">
          <ChevronLeftIcon />
        </button>
        <h1 className="mv-topbar__title">Mis videos</h1>
        <button className="mv-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Visor cuando hay un video seleccionado */}
      {selectedVideo && (
        <section
          className="mv-player"
          style={{ backgroundColor: cardColor(selectedVideo.id) }}
          aria-label="Reproductor"
        >
          <button className="mv-player__close" onClick={() => setSelectedVideo(null)} aria-label="Cerrar visor">
            <CloseIcon />
          </button>
          <div className="mv-player__body">
            <div className="mv-player__icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h2 className="mv-player__title">{selectedVideo.title}</h2>
            <p className="mv-player__sub">Evidencia multimedia</p>
            <a
              href={selectedVideo.url}
              target="_blank"
              rel="noreferrer"
              className="mv-player__link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', color: '#fff', fontSize: '0.85rem', textDecoration: 'underline' }}
            >
              <ExternalLinkIcon /> Abrir enlace
            </a>
          </div>
        </section>
      )}

      {/* Grid de evidencias */}
      {cargando ? (
        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
          Cargando videos…
        </p>
      ) : (
        <section className="mv-content" aria-label="Lista de videos">
          {evidencias.length === 0 ? (
            <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
              Aún no hay videos registrados.
            </p>
          ) : (
            <div className="mv-grid" role="list">
              {evidencias.map(e => (
                <button
                  key={String(e.id)}
                  className="mv-card"
                  role="listitem"
                  onClick={() => setSelectedVideo(e)}
                  aria-label={`Ver ${e.title}`}
                >
                  <div className="mv-card__thumb" style={{ backgroundColor: cardColor(e.id) }}>
                    <div className="mv-card__circle" style={{ color: cardColor(e.id) }}>
                      <VideoCameraIcon />
                    </div>
                  </div>
                  <div className="mv-card__footer">
                    <p className="mv-card__titulo">{e.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="mv-footer">
        <button className="mv-logout" onClick={() => navigate('/login')} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default MisVideos
