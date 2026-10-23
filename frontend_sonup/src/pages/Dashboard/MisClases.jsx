import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo/Logo'
import './MisClases.css'

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

const MusicIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Data ───────────────────────────────────────────────────────────────── */

const CLASES = [
  { id: 1, dia: '10', mes: 'OCT', materia: 'Música',     tema: 'Ritmo con palmas',    asistida: true  },
  { id: 2, dia: '14', mes: 'OCT', materia: 'Música',     tema: 'Tambor y movimiento', asistida: false },
  { id: 3, dia: '18', mes: 'OCT', materia: 'Artes',      tema: 'Mezcla de colores',   asistida: false },
  { id: 4, dia: '21', mes: 'OCT', materia: 'Panadería',  tema: 'Pan de queso',        asistida: false },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const MisClases = () => {
  const navigate = useNavigate()

  return (
    <div className="mc-page">

      {/* Top bar */}
      <header className="mc-topbar">
        <button
          className="mc-topbar__back"
          onClick={() => navigate('/dashboard')}
          aria-label="Volver al inicio"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="mc-topbar__title">Mis clases</h1>
        <button className="mc-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Hero — próxima clase */}
      <section className="mc-hero" aria-label="Próxima clase">
        <div className="mc-hero__icon-wrap" aria-hidden="true">
          <MusicIcon />
        </div>
        <div className="mc-hero__content">
          <p className="mc-hero__tag">PRÓXIMA CLASE</p>
          <p className="mc-hero__title">Música</p>
          <p className="mc-hero__sub">Sábado 14 · 10:00 de la mañana</p>
        </div>
        <span className="mc-hero__deco" aria-hidden="true" />
      </section>

      {/* Lista de clases */}
      <section className="mc-section" aria-label="Clases de octubre">
        <h2 className="mc-section__month">Octubre</h2>

        <ul className="mc-grid" role="list">
          {CLASES.map(c => (
            <li key={c.id} className={`mc-clase-card${c.asistida ? ' mc-clase-card--done' : ''}`}>
              {/* Fecha */}
              <div className="mc-clase-card__fecha" aria-label={`${c.dia} de ${c.mes}`}>
                <span className="mc-clase-card__dia">{c.dia}</span>
                <span className="mc-clase-card__mes">{c.mes}</span>
              </div>

              {/* Info */}
              <div className="mc-clase-card__info">
                <p className="mc-clase-card__materia">{c.materia}</p>
                <p className="mc-clase-card__tema">{c.tema}</p>
              </div>

              {/* Estado */}
              <div
                className={`mc-clase-card__estado${c.asistida ? ' mc-clase-card__estado--done' : ''}`}
                aria-label={c.asistida ? 'Asistida' : 'Pendiente'}
              >
                {c.asistida && <CheckIcon />}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="mc-footer">
        <button
          className="mc-logout"
          onClick={() => navigate('/login')}
          aria-label="Cerrar sesión"
        >
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default MisClases
