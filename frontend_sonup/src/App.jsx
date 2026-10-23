import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login               from './pages/Login/Login'
import Dashboard           from './pages/Dashboard/Dashboard'
import TalleristaLayout    from './layouts/TalleristaLayout/TalleristaLayout'
import TalleristaHome      from './pages/Tallerista/TalleristaHome'
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

      {/* Rutas del Tallerista — comparten sidebar */}
      <Route element={<TalleristaLayout />}>
        <Route path="/tallerista/inicio"       element={<TalleristaHome />} />
        <Route path="/tallerista/participante" element={<ParticipantePerfil />} />
        <Route path="/tallerista/informes"     element={<Informes />} />
        <Route path="/tallerista/talleres"     element={<Talleres />} />
        <Route path="/tallerista/habilidades"   element={<Habilidades />} />
        <Route path="/tallerista/certificados" element={<Certificados />} />
        <Route path="/tallerista/evidencias"   element={<Evidencias />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
