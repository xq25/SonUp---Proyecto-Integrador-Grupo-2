import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'
import { menuForRole, isItemActive, ROLE_LABEL } from '../Header/navConfig'
import { getChild } from '../../services/children.js'
import Icon from './icons.jsx'
import './Sidebar.css'

const initials = (name) =>
  name?.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?'

/**
 * Menú lateral del ROL ACTIVO. Si la cuenta aún no está enlazada con Saga ofrece
 * «Completar registro» en lugar de las vistas de "lo suyo".
 */
const Sidebar = ({ open = false, onClose }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session, activeRole, needsLink, childIds, activeChildId, selectChild, logout } = useAuth()
  const [nombresJovenes, setNombresJovenes] = useState({})

  const items = useMemo(() => menuForRole(activeRole), [activeRole])
  const userName = session?.user?.username || session?.user?.email || 'Usuario'

  /* Selector de joven del acudiente (solo si tiene varios) */
  const mostrarSelector = activeRole === ROLES.acudiente && childIds.length > 1
  useEffect(() => {
    if (!mostrarSelector) return
    let vivo = true
    childIds.forEach(id => {
      getChild(id)
        .then(c => {
          const nombre = [c.firstName, c.lastName].filter(Boolean).join(' ')
          if (vivo && nombre) setNombresJovenes(prev => ({ ...prev, [id]: nombre }))
        })
        .catch(() => {})
    })
    return () => { vivo = false }
  }, [mostrarSelector, childIds])

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {open && <div className="app-sidebar__overlay" onClick={onClose} aria-hidden="true" />}

      <aside id="app-sidebar" className={`app-sidebar${open ? ' app-sidebar--open' : ''}`} aria-label="Menú principal">
        <div className="app-sidebar__top">
          {mostrarSelector && (
            <label className="app-sidebar__child">
              <span>Joven que consultas</span>
              <select value={activeChildId ?? ''} onChange={e => selectChild(e.target.value)}>
                {childIds.map(id => (
                  <option key={id} value={id}>{nombresJovenes[id] ?? `Joven ${id}`}</option>
                ))}
              </select>
            </label>
          )}

          <nav>
            {needsLink ? (
              <div className="app-sidebar__link-card">
                <p>Tu cuenta aún no está enlazada con tu registro en la fundación.</p>
                <NavLink to="/completar-registro" className="app-sidebar__cta" onClick={onClose}>Completar registro</NavLink>
              </div>
            ) : items.length === 0 ? (
              <p className="app-sidebar__empty">No hay vistas disponibles para este rol en este módulo.</p>
            ) : (
              <ul className="app-sidebar__list" role="list">
                {items.map(item => {
                  const activo = isItemActive(item, pathname)
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={`app-sidebar__item${activo ? ' app-sidebar__item--active' : ''}`}
                        aria-current={activo ? 'page' : undefined}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </nav>
        </div>

        <div className="app-sidebar__bottom">
          <div className="app-sidebar__user">
            <div className="app-sidebar__avatar" aria-hidden="true">{initials(userName)}</div>
            <div className="app-sidebar__user-info">
              <span className="app-sidebar__user-name" title={userName}>{userName}</span>
              <span className="app-sidebar__user-role">{ROLE_LABEL[activeRole] ?? '—'}</span>
            </div>
          </div>
          <button type="button" className="app-sidebar__logout" onClick={cerrarSesion}>
            <Icon name="logout" size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
