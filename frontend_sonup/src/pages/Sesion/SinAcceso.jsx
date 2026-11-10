import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'
import './Sesion.css'

/** Cuentas sin vistas en este módulo (DONANTE, o sin ningún rol reconocido). */
const SinAcceso = () => {
  const navigate = useNavigate()
  const { roles, logout } = useAuth()
  const esDonante = roles.includes(ROLES.donante)

  const salir = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <div className="sesion-page">
      <section className="sesion-card" aria-labelledby="sin-acceso-titulo">
        <p className="sesion-card__tag">MÓDULO DE SEGUIMIENTO</p>
        <h1 className="sesion-card__titulo" id="sin-acceso-titulo">
          {esDonante ? 'Tu cuenta aún no tiene vistas aquí' : 'No encontramos vistas para tu cuenta'}
        </h1>
        <p className="sesion-card__texto">
          {esDonante
            ? 'El rol Donante todavía no tiene acceso al seguimiento de estudiantes. Cuando se habilite lo verás en esta misma cuenta.'
            : 'Tu cuenta no tiene un rol con acceso a este módulo. Escribe al equipo de la fundación para que revisen tus permisos.'}
        </p>
        <button type="button" className="sesion-btn" onClick={salir}>Cerrar sesión</button>
      </section>
    </div>
  )
}

export default SinAcceso
