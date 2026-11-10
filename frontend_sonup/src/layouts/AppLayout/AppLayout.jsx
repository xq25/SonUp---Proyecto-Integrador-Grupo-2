import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import Sidebar from '../../components/Sidebar/Sidebar'
import './AppLayout.css'

/**
 * Estructura de las vistas con sesión: header arriba (mensaje / Mis vistas), sidebar del rol
 * activo a la izquierda y la página a la derecha. El sidebar y el header quedan fijos; la
 * página es la que se desplaza (así sus barras sticky propias quedan bajo el header).
 */
const AppLayout = () => {
  const { pathname } = useLocation()
  const { activeRole } = useAuth()
  // La vista del joven/estudiante es de navegación simple: sin sidebar
  const conSidebar = activeRole !== ROLES.estudiante
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  return (
    <div className="app-shell">
      <Header conSidebar={conSidebar} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div className="app-body">
        {conSidebar && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className="app-main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
