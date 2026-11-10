import { Link } from 'react-router-dom'
import { useAuth, ROLES, destinoPorRol } from '../../context/AuthContext'
import './Vistas.css'

/** La vista del joven no tiene sidebar: sus pantallas necesitan su propio «Volver». */
const VolverInicio = () => {
  const { activeRole } = useAuth()
  if (activeRole !== ROLES.estudiante) return null
  return <Link to={destinoPorRol([activeRole])} className="vista-volver">← Volver al inicio</Link>
}

export default VolverInicio
