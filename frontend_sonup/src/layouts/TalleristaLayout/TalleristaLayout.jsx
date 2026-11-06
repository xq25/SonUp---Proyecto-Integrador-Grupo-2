import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import Logo from '../../components/Logo/Logo'
import './TalleristaLayout.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

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
const HabilidadesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a5 5 0 0 1 5 5c0 2.5-1.5 4.5-3.5 5.4V14h1a1 1 0 0 1 0 2h-1v1h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1H10a1 1 0 0 1 0-2h1v-1H10a1 1 0 0 1 0-2h1v-1.6C9.5 11.5 8 9.5 8 7a4 4 0 0 1 4-5z"/>
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

/* ─── Nav items ──────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { id: 'inicio',        label: 'Inicio',             icon: <HomeIcon />,          ruta: '/tallerista/inicio',       enabled: true  },
  { id: 'participantes', label: 'Participantes',       icon: <ParticipantesIcon />, ruta: '/tallerista/participante/1', enabled: true  },
  { id: 'talleres',      label: 'Talleres y sesiones', icon: <TalleresIcon />,      ruta: '/tallerista/talleres',     enabled: true  },
  { id: 'habilidades',   label: 'Habilidades y juegos',icon: <HabilidadesIcon />,   ruta: '/tallerista/habilidades',  enabled: true  },
  { id: 'informes',      label: 'Informes',            icon: <InformesIcon />,      ruta: '/tallerista/informes',     enabled: true  },
  { id: 'certificados',  label: 'Certificados',        icon: <CertificadosIcon />,  ruta: '/tallerista/certificados', enabled: true  },
  { id: 'evidencias',    label: 'Evidencias',          icon: <EvidenciasIcon />,    ruta: '/tallerista/evidencias',   enabled: true  },
]

/* ─── Layout ─────────────────────────────────────────────────────────────── */

const TalleristaLayout = () => {
  const navigate    = useNavigate()
  const location    = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNav = (item) => {
    if (!item.enabled) return
    setSidebarOpen(false)
    if (item.ruta) navigate(item.ruta)
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

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="tl-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`tl-sidebar${sidebarOpen ? ' tl-sidebar--open' : ''}`}
        role="navigation"
        aria-label="Menú principal"
      >
        <div className="tl-sidebar__top">
          <div className="tl-sidebar__logo">
            <Logo />
          </div>

          <nav>
            <ul className="tl-nav-list" role="list">
              {NAV_ITEMS.map(item => {
                const isActive = location.pathname === item.ruta
                return (
                  <li key={item.id}>
                    <button
                      className={[
                        'tl-nav-item',
                        isActive        ? 'tl-nav-item--active'   : '',
                        !item.enabled   ? 'tl-nav-item--disabled' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleNav(item)}
                      aria-current={isActive ? 'page' : undefined}
                      tabIndex={item.enabled ? 0 : -1}
                      aria-disabled={!item.enabled}
                    >
                      <span className="tl-nav-item__icon">{item.icon}</span>
                      <span className="tl-nav-item__label">{item.label}</span>
                    </button>
                  </li>
                )
              })}
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

      {/* ── Contenido de la página activa ── */}
      <main className="tl-main" id="main-content">
        <Outlet />
      </main>

    </div>
  )
}

export default TalleristaLayout
