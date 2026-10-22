import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login          from './pages/Login/Login'
import Dashboard      from './pages/Dashboard/Dashboard'
import TalleristaHome from './pages/Tallerista/TalleristaHome'
import './App.css'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"                    element={<Navigate to="/login" replace />} />
      <Route path="/login"               element={<Login />} />
      <Route path="/dashboard"           element={<Dashboard />} />
      <Route path="/tallerista/inicio"   element={<TalleristaHome />} />
    </Routes>
  </BrowserRouter>
)

export default App
