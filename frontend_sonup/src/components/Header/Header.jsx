import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth, ROLE_ORDER } from '../../context/AuthContext'
import { ROLE_PILL } from './navConfig'
import Icon from '../Sidebar/icons.jsx'
import './Header.css'

const ROLE_ICON = { ADMIN: 'shield', TALLERISTA: 'monitor', ACUDIENTE: 'family', ESTUDIANTE: 'cap', DONANTE: 'heart' }

/**
 * Header de la aplicación.
 *  - Cerrado: el mensaje «No somos Down, somos UP!» al centro.
 *  - «Mis vistas» abierto: en su lugar se despliegan los roles de la cuenta (`user.roles`).
 *    Al elegir otro rol la página se RECARGA hacia el dashboard de ese rol.
 * El rol es solo de interfaz: el backend autoriza con todos los roles del token.
 */
const Header = ({ sidebarOpen = false, onToggleSidebar }) => {
  const { pathname } = useLocation()
  const { roles, activeRole, selectRole, destinoPorRol } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const rootRef = useRef(null)

  const misRoles = useMemo(() => ROLE_ORDER.filter(r => roles.includes(r)), [roles])
  const home = destinoPorRol(activeRole ? [activeRole] : roles)

  useEffect(() => { setAbierto(false) }, [pathname])

  useEffect(() => {
    if (!abierto) return
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setAbierto(false) }
    const onKey  = (e) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  const elegir = (rol) => {
    if (rol === activeRole) { setAbierto(false); return }
    selectRole(rol)
    // Recarga completa: cada rol arranca limpio, en el dashboard de su propio mockup
    window.location.assign(destinoPorRol([rol]))
  }

  return (
    <header className="app-header" ref={rootRef}>
      <div className="app-header__bar">

        <button
          type="button"
          className="app-header__burger"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
          aria-label={sidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
        >
          <Icon name={sidebarOpen ? 'close' : 'menu'} size={22} />
        </button>

        <Link to={home} className="app-header__brand" aria-label="Ir al inicio">
          <span className="app-header__brand-orange">asis</span><span className="app-header__brand-teal">co</span>
        </Link>

        <div className={`app-header__center${abierto ? ' app-header__center--open' : ''}`}>
          <p className="app-header__message" aria-hidden={abierto}>
            No somos Down,&nbsp;<strong>somos <span>UP!</span></strong>
          </p>

          <div id="app-header-roles" className="app-header__roles" role="group" aria-label="Mis roles">
            {misRoles.map(rol => {
              const activo = rol === activeRole
              return (
                <button
                  key={rol}
                  type="button"
                  data-role={rol}
                  className={`app-header__role${activo ? ' app-header__role--active' : ''}`}
                  aria-pressed={activo}
                  aria-current={activo ? 'true' : undefined}
                  onClick={() => elegir(rol)}
                >
                  <Icon name={ROLE_ICON[rol]} size={18} />
                  <span>{ROLE_PILL[rol] ?? rol}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className={`app-header__views${abierto ? ' app-header__views--open' : ''}`}
          onClick={() => setAbierto(o => !o)}
          aria-expanded={abierto}
          aria-controls="app-header-roles"
        >
          <span className="app-header__views-chevron"><Icon name="chevron" size={16} /></span>
          <Icon name="grid" size={20} />
          <span>Mis vistas</span>
        </button>

      </div>
    </header>
  )
}

export default Header
