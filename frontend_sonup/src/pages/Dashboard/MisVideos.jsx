import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

const VIDEOS = [
  { id: 'v1', titulo: 'Ritmo con tambor', color: '#176D65' },
  { id: 'v2', titulo: 'Mi primer lienzo', color: '#3D9387' },
  { id: 'v3', titulo: 'Trabajo en equipo', color: '#2E9B56' },
  { id: 'v4', titulo: 'Manos a la masa', color: '#F49A18' },
]

const FOTOS = [
  { id: 'f1', titulo: 'Mi obra terminada', color: '#176D65' },
  { id: 'f2', titulo: 'Con mis compañeros', color: '#3D9387' },
  { id: 'f3', titulo: 'Clase de música', color: '#2E9B56' },
  { id: 'f4', titulo: 'Taller de panadería', color: '#F49A18' },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const MisVideos = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('videos') // 'videos' | 'fotos'
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedFoto, setSelectedFoto] = useState(null)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleCardClick = (item) => {
    if (activeTab === 'videos') {
      setSelectedVideo(item)
    } else {
      setSelectedFoto(item)
    }
  }

  const activeMedia = activeTab === 'videos' ? selectedVideo : selectedFoto

  return (
    <div className="mv-page">
      {/* Top bar */}
      <header className="mv-topbar">
        <button
          className="mv-topbar__back"
          onClick={() => navigate('/dashboard')}
          aria-label="Volver al inicio"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="mv-topbar__title">Mis videos</h1>
        <button className="mv-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Tabs */}
      <nav className="mv-tabs" aria-label="Multimedia">
        <button
          className={`mv-tab ${activeTab === 'videos' ? 'mv-tab--active' : ''}`}
          onClick={() => handleTabChange('videos')}
          aria-current={activeTab === 'videos' ? 'true' : undefined}
        >
          <VideoCameraIcon />
          <span>Videos</span>
        </button>
        <button
          className={`mv-tab ${activeTab === 'fotos' ? 'mv-tab--active' : ''}`}
          onClick={() => handleTabChange('fotos')}
          aria-current={activeTab === 'fotos' ? 'true' : undefined}
        >
          <ImageIcon />
          <span>Fotos</span>
        </button>
      </nav>

      {/* Visor destacado cuando un elemento está seleccionado */}
      {activeMedia && (
        <section
          className="mv-player"
          style={{ backgroundColor: activeMedia.color || '#176D65' }}
          aria-label={activeTab === 'videos' ? 'Reproductor de video' : 'Visor de foto'}
        >
          <button
            className="mv-player__close"
            onClick={() => {
              if (activeTab === 'videos') setSelectedVideo(null)
              else setSelectedFoto(null)
            }}
            aria-label="Cerrar visor"
          >
            <CloseIcon />
          </button>

          <div className="mv-player__body">
            <div className="mv-player__icon" aria-hidden="true">
              {activeTab === 'videos' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </div>
            <h2 className="mv-player__title">{activeMedia.titulo}</h2>
            <p className="mv-player__sub">
              {activeTab === 'videos' ? 'Reproduciendo evidencia' : 'Foto ampliada'}
            </p>
          </div>
        </section>
      )}

      {/* Grid de tarjetas (4 items) */}
      <section className="mv-content" aria-label={activeTab === 'videos' ? 'Lista de videos' : 'Lista de fotos'}>
        <div className="mv-grid" role="list">
          {(activeTab === 'videos' ? VIDEOS : FOTOS).map(item => (
            <button
              key={item.id}
              className="mv-card"
              role="listitem"
              onClick={() => handleCardClick(item)}
              aria-label={`Ver ${item.titulo}`}
            >
              <div
                className="mv-card__thumb"
                style={{ backgroundColor: item.color }}
              >
                <div className="mv-card__circle" style={{ color: item.color }}>
                  {activeTab === 'videos' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M23 7l-7 5 7 5V7z"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className="mv-card__footer">
                <p className="mv-card__titulo">{item.titulo}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mv-footer">
        <button
          className="mv-logout"
          onClick={() => navigate('/login')}
          aria-label="Cerrar sesión"
        >
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default MisVideos
