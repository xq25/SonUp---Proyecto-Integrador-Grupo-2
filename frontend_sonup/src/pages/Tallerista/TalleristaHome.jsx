import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo/Logo'
import './TalleristaHome.css'

/* ═══════════════════════════════ Icons ═══════════════════════════════════ */

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const ParticipantesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const TalleresIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const InformesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const CertificadosIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)
const EvidenciasIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
)
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const StarSmIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

/* ═══════════════════════════════ Data ════════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'inicio',        label: 'Inicio',              icon: <HomeIcon />,          enabled: true  },
  { id: 'participantes', label: 'Participantes',        icon: <ParticipantesIcon />, enabled: false },
  { id: 'talleres',      label: 'Talleres y sesiones',  icon: <TalleresIcon />,      enabled: false },
  { id: 'informes',      label: 'Informes',             icon: <InformesIcon />,      enabled: false },
  { id: 'certificados',  label: 'Certificados',         icon: <CertificadosIcon />,  enabled: false },
  { id: 'evidencias',    label: 'Evidencias',           icon: <EvidenciasIcon />,    enabled: false },
]

/* ═══════════════════════════════ Helpers ═════════════════════════════════ */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function getCurrentDate() {
  const raw = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/* ═══════════════════════════════ Component ═══════════════════════════════ */

const TalleristaHome = () => {
  const navigate = useNavigate()
  const [activeNav,   setActiveNav]   = useState('inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNav = (item) => {
    if (!item.enabled) return
    setActiveNav(item.id)
    setSidebarOpen(false)
  }

  return (
    <div className="tl-layout">

      {/* Mobile top-bar */}
      <div className="tl-topbar">
        <button
          className="tl-topbar__menu-btn"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <XIcon /> : <MenuIcon />}
        </button>
        <div className="tl-topbar__logo"><Logo /></div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="tl-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
      <aside className={`tl-sidebar${sidebarOpen ? ' tl-sidebar--open' : ''}`}
        role="navigation" aria-label="Menú principal">

        <div className="tl-sidebar__top">
          <div className="tl-sidebar__logo">
            <Logo />
          </div>

          <nav>
            <ul className="tl-nav-list" role="list">
              {NAV_ITEMS.map(item => (
                <li key={item.id}>
                  <button
                    className={[
                      'tl-nav-item',
                      activeNav === item.id  ? 'tl-nav-item--active'   : '',
                      !item.enabled          ? 'tl-nav-item--disabled' : '',
                    ].join(' ')}
                    onClick={() => handleNav(item)}
                    aria-current={activeNav === item.id ? 'page' : undefined}
                    tabIndex={item.enabled ? 0 : -1}
                    aria-disabled={!item.enabled}
                  >
                    <span className="tl-nav-item__icon">{item.icon}</span>
                    <span className="tl-nav-item__label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="tl-sidebar__bottom">
          <div className="tl-sidebar__user">
            <div className="tl-sidebar__avatar" aria-hidden="true">LR</div>
            <div className="tl-sidebar__user-info">
              <span className="tl-sidebar__user-name">Laura Ríos</span>
              <span className="tl-sidebar__user-role">Tallerista · Música</span>
            </div>
          </div>
          <button
            className="tl-sidebar__logout"
            onClick={() => navigate('/login')}
            aria-label="Cerrar sesión"
          >
            <ChevronLeftIcon />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══ Main ═════════════════════════════════════════════════════════ */}
      <main className="tl-main" id="main-content">

        {/* Header */}
        <header className="tl-header">
          <div>
            <h1 className="tl-header__greeting">{getGreeting()}, Laura</h1>
            <p className="tl-header__sub">Aquí tienes lo más importante para hoy.</p>
          </div>
        </header>

        {/* Hero card — próxima clase */}
        <section className="tl-hero-card" aria-label="Próxima clase">
          <div className="tl-hero-card__deco" aria-hidden="true">
            <span className="tl-hero-deco tl-hero-deco--lg" />
            <span className="tl-hero-deco tl-hero-deco--sm" />
          </div>
          <div className="tl-hero-card__content">
            <p className="tl-hero-card__tag">PRÓXIMA CLASE · 10:00 A. M.</p>
            <h2 className="tl-hero-card__title">Música con Mariana y su grupo</h2>
            <p className="tl-hero-card__sub">Ritmo con palmas y tamboor · Salón 3</p>
          </div>
          <button className="tl-hero-card__btn" aria-label="Registrar sesión de clase">
            Registrar sesión
          </button>
        </section>

        {/* Stats row */}
        <div className="tl-stats-grid" role="region" aria-label="Estadísticas del mes">
          <div className="tl-stat-card">
            <p className="tl-stat-card__label">Asistencia del mes</p>
            <p className="tl-stat-card__value">87%</p>
            <p className="tl-stat-card__detail">52 de 60 asistencias</p>
          </div>
          <div className="tl-stat-card">
            <p className="tl-stat-card__label">Valoraciones pendientes</p>
            <p className="tl-stat-card__value tl-stat-card__value--orange">8</p>
            <p className="tl-stat-card__detail">Primer período 2026</p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="tl-bottom-grid">

          {/* Jornada */}
          <section className="tl-jornada-card" aria-label="Jornada de hoy">
            <div className="tl-jornada-card__header">
              <h3 className="tl-jornada-card__title">Tu jornada</h3>
              <p className="tl-jornada-card__date">{getCurrentDate()}</p>
            </div>
            <ul className="tl-jornada-list" role="list">
              <li className="tl-jornada-item">
                <span className="tl-jornada-item__time">10:00</span>
                <span className="tl-jornada-item__dot tl-jornada-item__dot--teal" aria-hidden="true" />
                <div className="tl-jornada-item__info">
                  <p className="tl-jornada-item__name">Música · Grupo A</p>
                  <p className="tl-jornada-item__meta">10 participantes · Salón 3</p>
                </div>
                <button className="tl-jornada-item__btn" aria-label="Abrir sesión Música Grupo A">Abrir</button>
              </li>
              <li className="tl-jornada-item">
                <span className="tl-jornada-item__time">2:00</span>
                <span className="tl-jornada-item__dot tl-jornada-item__dot--orange" aria-hidden="true" />
                <div className="tl-jornada-item__info">
                  <p className="tl-jornada-item__name">Valoración individual</p>
                  <p className="tl-jornada-item__meta">Mariana Gómez</p>
                </div>
                <button className="tl-jornada-item__btn" aria-label="Abrir valoración Mariana Gómez">Abrir</button>
              </li>
            </ul>
          </section>

          {/* Progreso */}
          <section className="tl-progreso-card" aria-label="Progreso del grupo">
            <h3 className="tl-progreso-card__title">Progreso del grupo</h3>
            <p className="tl-progreso-card__sub">Música · primer período</p>
            <div className="tl-progreso-row"
              role="progressbar" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso 72%">
              <div className="tl-progreso-bar">
                <div className="tl-progreso-bar__fill" style={{ width: '72%' }} />
              </div>
              <span className="tl-progreso-bar__pct">72%</span>
            </div>
            <p className="tl-progreso-card__detail">106 de 150 indicadores valorados</p>
            <div className="tl-progreso-highlights">
              <div className="tl-progreso-highlight">
                <ClockIcon /><span>Última sesión: Lunes 13 oct</span>
              </div>
              <div className="tl-progreso-highlight">
                <StarSmIcon /><span>Indicadores al día: 106</span>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

export default TalleristaHome
