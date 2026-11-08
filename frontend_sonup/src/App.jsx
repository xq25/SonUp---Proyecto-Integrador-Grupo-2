import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login               from './pages/Login/Login'
import Dashboard           from './pages/Dashboard/Dashboard'
import MisClases            from './pages/Dashboard/MisClases'
import LoQueLogre           from './pages/Dashboard/LoQueLogre'
import MisVideos            from './pages/Dashboard/MisVideos'
import MisCertificados      from './pages/Dashboard/MisCertificados'
import AcudienteHome       from './pages/Acudiente/AcudienteHome'
import AcudienteInforme    from './pages/Acudiente/AcudienteInforme'
import TalleristaLayout    from './layouts/TalleristaLayout/TalleristaLayout'
import AdministradorLayout from './layouts/AdministradorLayout/AdministradorLayout'
import TalleristaHome      from './pages/Tallerista/TalleristaHome'
import AdminHome           from './pages/Administrador/AdminHome'
import ParticipantePerfil  from './pages/Tallerista/ParticipantePerfil/ParticipantePerfil'
import Informes             from './pages/Tallerista/Informes/Informes'
import Talleres             from './pages/Tallerista/Talleres/Talleres'
import Habilidades          from './pages/Tallerista/Habilidades/Habilidades'
import Certificados         from './pages/Tallerista/Certificados/Certificados'
import Evidencias           from './pages/Tallerista/Evidencias/Evidencias'
import './App.css'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"      element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/joven/mis-clases" element={<MisClases />} />
      <Route path="/joven/lo-que-logre" element={<LoQueLogre />} />
      <Route path="/joven/mis-videos" element={<MisVideos />} />
      <Route path="/joven/mis-certificados" element={<MisCertificados />} />
      <Route path="/mis-clases" element={<MisClases />} />
      <Route path="/lo-que-logre" element={<LoQueLogre />} />
      <Route path="/mis-videos" element={<MisVideos />} />
      <Route path="/mis-certificados" element={<MisCertificados />} />
      <Route path="/acudiente" element={<AcudienteHome />} />
      <Route path="/acudiente/informe" element={<AcudienteInforme />} />

      {/* Rutas del Tallerista — comparten sidebar */}
      <Route element={<TalleristaLayout />}>
        <Route path="/tallerista/inicio"                element={<TalleristaHome />} />
        <Route path="/tallerista/participante/:childId" element={<ParticipantePerfil />} />
        <Route path="/tallerista/informes"              element={<Informes />} />
        <Route path="/tallerista/informes/:childId"     element={<Informes />} />
        <Route path="/tallerista/talleres"              element={<Talleres />} />
        <Route path="/tallerista/habilidades"           element={<Habilidades />} />
        <Route path="/tallerista/certificados"          element={<Certificados />} />
        <Route path="/tallerista/evidencias"            element={<Evidencias />} />
      </Route>

      {/* Rutas del Administrador — mismo layout pero ve todo */}
      <Route element={<AdministradorLayout />}>
        <Route path="/administrador/inicio"                element={<AdminHome />} />
        <Route path="/administrador/participante/:childId" element={<ParticipantePerfil />} />
        <Route path="/administrador/informes"              element={<Informes />} />
        <Route path="/administrador/informes/:childId"     element={<Informes />} />
        <Route path="/administrador/talleres"              element={<Talleres isAdmin returnPath="/administrador/inicio" />} />
        <Route path="/administrador/habilidades"           element={<Habilidades isAdmin returnPath="/administrador/talleres" />} />
        <Route path="/administrador/certificados"          element={<Certificados />} />
        <Route path="/administrador/evidencias"            element={<Evidencias />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
