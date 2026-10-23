import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo/Logo'
import './Dashboard.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const VolumeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

const MusicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

const StarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const StarFillIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="#F49A18" stroke="#F49A18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const VideoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const MedalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

/* ─── Data ───────────────────────────────────────────────────────────────── */

const MODULOS = [
  {
    id:       'logros',
    label:    'Lo que logré',
    icon:     <StarIcon />,
    variante: 'accent',
    ruta:     '/joven/lo-que-logre',
  },
  {
    id:       'videos',
    label:    'Mis videos',
    icon:     <VideoIcon />,
    variante: 'default',
    ruta:     '/joven/mis-videos',
  },
  {
    id:       'certificados',
    label:    'Mis certificados',
    icon:     <MedalIcon />,
    variante: 'default',
    ruta:     '/joven/mis-certificados',
  },
  {
    id:       'clases',
    label:    'Mis clases',
    icon:     <CalendarIcon />,
    variante: 'default',
    ruta:     '/joven/mis-clases',
  },
]

const LOGROS = 7

/* ─── Component ──────────────────────────────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="joven-page">

      {/* Header */}
      <header className="joven-header">
        <Logo />
        <button className="joven-sound-btn" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Saludo */}
      <div className="joven-saludo">
        <h1 className="joven-saludo__titulo">¡Hola, Mariana!</h1>
        <p className="joven-saludo__sub">¿Qué quieres ver hoy?</p>
      </div>

      {/* Música — hero card ancha */}
      <button
        className="joven-musica-card"
        aria-label="Ir a Música"
        onClick={() => navigate('/joven/mis-clases')}
      >
        <div className="joven-musica-card__icono"><MusicIcon /></div>
        <div className="joven-musica-card__content">
          <p className="joven-musica-card__tag">MI PRÓXIMA CLASE</p>
          <p className="joven-musica-card__titulo">Música</p>
          <p className="joven-musica-card__sub">Sábado · 10:00 de la mañana</p>
        </div>
        <span className="joven-musica-card__deco" aria-hidden="true" />
      </button>

      {/* Los 4 módulos en grid */}
      <div className="joven-modulos" role="list">
        {MODULOS.map(m => (
          <button
            key={m.id}
            className={`joven-modulo joven-modulo--${m.variante}`}
            role="listitem"
            onClick={() => m.ruta && navigate(m.ruta)}
          >
            <div className="joven-modulo__icono">{m.icon}</div>
            <p className="joven-modulo__label">{m.label}</p>
          </button>
        ))}
      </div>

      {/* Card de logros */}
      <div className="joven-logros-card">
        <div className="joven-logros-card__info">
          <h2 className="joven-logros-card__titulo">En Música este semestre</h2>
          <p className="joven-logros-card__sub">{LOGROS} cosas que ya lograste</p>
        </div>
        <div className="joven-estrellas" aria-label={`${LOGROS} estrellas`}>
          {Array.from({ length: LOGROS }).map((_, i) => (
            <StarFillIcon key={i} />
          ))}
        </div>
      </div>

      {/* Pie */}
      <footer className="joven-footer">
        <button className="joven-logout" onClick={() => navigate('/login')}>
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default Dashboard
