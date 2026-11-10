import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protege un grupo de rutas.
 * - Sin sesión → /login.
 * - Si el rol ACTIVO («Mis vistas») no es de los pedidos → a la vista inicial del rol activo.
 *   Así cada rol se ve como su propio mockup aunque la cuenta tenga varios roles.
 * Es solo comodidad de navegación: el backend vuelve a validar rol y "lo suyo" en cada petición.
 */
const ProtectedRoute = ({ roles }) => {
  const { session, activeRole, destinoPorRol } = useAuth()
  const location = useLocation()

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (roles && !roles.includes(activeRole)) {
    const destino = destinoPorRol(activeRole ? [activeRole] : [])
    // Evita un bucle si el destino tampoco es permitido (cuenta sin roles válidos)
    return <Navigate to={destino === location.pathname ? '/sin-acceso' : destino} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
