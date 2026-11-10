import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ROLES } from './context/AuthContext'
import ProtectedRoute      from './components/ProtectedRoute'
import AppLayout           from './layouts/AppLayout/AppLayout'
import Login               from './pages/Login/Login'
import SinAcceso           from './pages/Sesion/SinAcceso'
import CompletarRegistro   from './pages/Sesion/CompletarRegistro'
import Dashboard           from './pages/Dashboard/Dashboard'
import MisClases            from './pages/Dashboard/MisClases'
import LoQueLogre           from './pages/Dashboard/LoQueLogre'
import MisVideos            from './pages/Dashboard/MisVideos'
import MisCertificados      from './pages/Dashboard/MisCertificados'
import AcudienteHome       from './pages/Acudiente/AcudienteHome'
import AcudienteInforme    from './pages/Acudiente/AcudienteInforme'
import TalleristaHome      from './pages/Tallerista/TalleristaHome'
import AdminHome           from './pages/Administrador/AdminHome'
import ParticipantePerfil  from './pages/Tallerista/ParticipantePerfil/ParticipantePerfil'
import Informes             from './pages/Tallerista/Informes/Informes'
import Planeacion           from './pages/Tallerista/Planeacion/Planeacion'
import Talleres             from './pages/Tallerista/Talleres/Talleres'
import Habilidades          from './pages/Tallerista/Habilidades/Habilidades'
import Certificados         from './pages/Tallerista/Certificados/Certificados'
import Evidencias           from './pages/Tallerista/Evidencias/Evidencias'
import Perfil              from './pages/Vistas/Perfil'
import TalleresDisponibles from './pages/Vistas/TalleresDisponibles'
import ArbolHabilidades    from './pages/Vistas/ArbolHabilidades'
import Personas            from './pages/Vistas/Personas'
import './App.css'

const { admin, tallerista, estudiante, acudiente } = ROLES

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Todo lo demás exige sesión y comparte el header con el menú por roles */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/sin-acceso"         element={<SinAcceso />} />
            <Route path="/completar-registro" element={<CompletarRegistro />} />

            {/* Joven */}
            <Route element={<ProtectedRoute roles={[estudiante]} />}>
              <Route path="/dashboard"                element={<Dashboard />} />
              <Route path="/joven/talleres"           element={<TalleresDisponibles />} />
              <Route path="/joven/perfil"             element={<Perfil />} />
              <Route path="/joven/mis-clases"         element={<MisClases />} />
              <Route path="/joven/lo-que-logre"       element={<LoQueLogre />} />
              <Route path="/joven/mis-videos"         element={<MisVideos />} />
              <Route path="/joven/mis-certificados"   element={<MisCertificados />} />
              <Route path="/mis-clases"               element={<MisClases />} />
              <Route path="/lo-que-logre"             element={<LoQueLogre />} />
              <Route path="/mis-videos"               element={<MisVideos />} />
              <Route path="/mis-certificados"         element={<MisCertificados />} />
            </Route>

            {/* Acudiente */}
            <Route element={<ProtectedRoute roles={[acudiente]} />}>
              <Route path="/acudiente"         element={<AcudienteHome />} />
              <Route path="/acudiente/informe"      element={<AcudienteInforme />} />
              <Route path="/acudiente/talleres"     element={<TalleresDisponibles />} />
              <Route path="/acudiente/clases"       element={<MisClases />} />
              <Route path="/acudiente/logros"       element={<LoQueLogre />} />
              <Route path="/acudiente/evidencias"   element={<MisVideos />} />
              <Route path="/acudiente/certificados" element={<MisCertificados />} />
              <Route path="/acudiente/perfil"       element={<Perfil />} />
            </Route>

            {/* Tallerista: solo lo suyo (lo aplica el backend) */}
            <Route element={<ProtectedRoute roles={[tallerista]} />}>
              <Route path="/tallerista/inicio"                 element={<TalleristaHome />} />
              <Route path="/tallerista/participante"           element={<ParticipantePerfil />} />
              <Route path="/tallerista/participante/:childId"  element={<ParticipantePerfil />} />
              <Route path="/tallerista/informes"               element={<Informes />} />
              <Route path="/tallerista/informes/:childId"      element={<Informes />} />
              {/* Fase 1 (planned) aparte de las fases 2 y 3 (active / finished) */}
              <Route path="/tallerista/planeacion"             element={<Planeacion crearPath="/tallerista/habilidades" />} />
              <Route path="/tallerista/talleres"               element={<Talleres />} />
              <Route path="/tallerista/habilidades"            element={<Habilidades returnPath="/tallerista/planeacion" />} />
              <Route path="/tallerista/certificados"           element={<Certificados />} />
              <Route path="/tallerista/evidencias"             element={<Evidencias />} />
              <Route path="/tallerista/arbol-habilidades"      element={<ArbolHabilidades />} />
              <Route path="/tallerista/perfil"                 element={<Perfil />} />
            </Route>

            {/* Administrador: ve todo */}
            <Route element={<ProtectedRoute roles={[admin]} />}>
              <Route path="/administrador/inicio"                element={<AdminHome />} />
              <Route path="/administrador/participante"          element={<ParticipantePerfil />} />
              <Route path="/administrador/participante/:childId" element={<ParticipantePerfil />} />
              <Route path="/administrador/informes"              element={<Informes />} />
              <Route path="/administrador/informes/:childId"     element={<Informes />} />
              <Route path="/administrador/planeacion"            element={<Planeacion isAdmin crearPath="/administrador/habilidades" />} />
              <Route path="/administrador/talleres"              element={<Talleres isAdmin />} />
              <Route path="/administrador/habilidades"           element={<Habilidades isAdmin returnPath="/administrador/planeacion" />} />
              <Route path="/administrador/certificados"          element={<Certificados />} />
              <Route path="/administrador/evidencias"            element={<Evidencias />} />
              <Route path="/administrador/arbol-habilidades"     element={<ArbolHabilidades />} />
              <Route path="/administrador/acudientes"            element={<Personas tipo="acudientes" />} />
              <Route path="/administrador/personal"              element={<Personas tipo="personal" />} />
              <Route path="/administrador/perfil"                element={<Perfil />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

export default App
