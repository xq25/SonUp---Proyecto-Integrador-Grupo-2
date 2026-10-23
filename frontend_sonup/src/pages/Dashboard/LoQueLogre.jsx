import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoQueLogre.css'

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

const StarOutlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const BookmarkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

const SproutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 20h10"/>
    <path d="M12 20v-8"/>
    <path d="M12 12a5 5 0 0 1 5-5c0 4.5-5 5-5 5z"/>
    <path d="M12 12a5 5 0 0 0-5-5c0 4.5 5 5 5 5z"/>
  </svg>
)

const CheckSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Data ───────────────────────────────────────────────────────────────── */

const TALLERES = [
  {
    id: 'musica',
    label: 'Música',
    logrados: [
      'Respondo cuando me llaman',
      'Reconozco los instrumentos',
      'Hago ritmo con el grupo',
    ],
    aprendiendo: [
      'Seguir el ritmo rápido',
      'Imitar los movimientos del profe',
    ],
  },
  {
    id: 'artes',
    label: 'Artes',
    logrados: [
      'Mezclo colores primarios',
      'Pinto dentro del contorno',
    ],
    aprendiendo: [
      'Usar pincel fino',
      'Crear texturas con esponja',
      'Dibujar figuras geométricas',
    ],
  },
  {
    id: 'panaderia',
    label: 'Panadería',
    logrados: [
      'Mezclo los ingredientes',
      'Amaso con las manos',
      'Reconozco los utensilios',
      'Sigo instrucciones del profe',
    ],
    aprendiendo: [
      'Dar forma al pan',
    ],
  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const LoQueLogre = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('musica')

  const taller = TALLERES.find(t => t.id === activeTab)

  return (
    <div className="ll-page">

      {/* Top bar */}
      <header className="ll-topbar">
        <button
          className="ll-topbar__back"
          onClick={() => navigate('/dashboard')}
          aria-label="Volver al inicio"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="ll-topbar__title">Lo que logré</h1>
        <button className="ll-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Tabs de talleres */}
      <nav className="ll-tabs" aria-label="Talleres">
        {TALLERES.map(t => (
          <button
            key={t.id}
            className={`ll-tab${activeTab === t.id ? ' ll-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            aria-current={activeTab === t.id ? 'true' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Contenido del taller activo */}
      {taller && (
        <div className="ll-content">

          {/* Ya lo logré */}
          <section className="ll-card" aria-labelledby="ll-logrado-title">
            <h2 className="ll-card__title" id="ll-logrado-title">
              <StarOutlineIcon /> Ya lo logré
            </h2>
            <ul className="ll-items ll-items--logrado" role="list">
              {taller.logrados.map((item, i) => (
                <li key={i} className="ll-item ll-item--logrado">
                  <CheckSmIcon />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Estoy aprendiendo */}
          <section className="ll-card" aria-labelledby="ll-aprendiendo-title">
            <h2 className="ll-card__title" id="ll-aprendiendo-title">
              <SproutIcon /> Estoy aprendiendo
            </h2>
            <ul className="ll-items ll-items--aprendiendo" role="list">
              {taller.aprendiendo.map((item, i) => (
                <li key={i} className="ll-item ll-item--aprendiendo">
                  <BookmarkIcon />
                  {item}
                </li>
              ))}
            </ul>
          </section>

        </div>
      )}

      {/* Footer */}
      <footer className="ll-footer">
        <button
          className="ll-logout"
          onClick={() => navigate('/login')}
          aria-label="Cerrar sesión"
        >
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default LoQueLogre
