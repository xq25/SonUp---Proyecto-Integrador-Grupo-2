import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo/Logo'
import './Login.css'

/* ── SVG Icons ──────────────────────────────────────────────────────────── */

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
)

const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

/* ── Static data ────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: <ClipboardIcon />, label: 'Procesos organizados' },
  { icon: <TargetIcon />,    label: 'Seguimiento cercano' },
  { icon: <ShieldIcon />,    label: 'Información segura' },
]

/* ── Helpers ────────────────────────────────────────────────────────────── */

// El 400 trae en `error.details` qué campo falló; el 401 son credenciales incorrectas;
// 429/502/503/504 ya llegan con su mensaje en español desde services/api.js.
const errorLabel = (err) => {
  if (err?.status === 401) return 'Correo o contraseña incorrectos.'
  if (err?.status === 400) return err.message || 'Revisa el correo y la contraseña.'
  return err?.message || 'No se pudo iniciar sesión. Verifica tu conexión.'
}

/* ── Component ──────────────────────────────────────────────────────────── */

const Login = () => {
  const navigate              = useNavigate()
  const { session, saveSession, destinoPorRol } = useAuth()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  /* Con sesión vigente no se vuelve a pedir el login */
  if (session) return <Navigate to={destinoPorRol(session.user?.roles ?? [])} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Escribe tu correo y tu contraseña.'); return }
    setLoading(true)
    setError('')
    try {
      const data = await api.post('/auth/login', { email: email.trim(), password })
      saveSession(data)
      navigate(destinoPorRol(data.user?.roles ?? []))
    } catch (err) {
      setError(errorLabel(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* ── Left hero panel ─────────────────────────────────────────── */}
      <aside className="login-hero">
        <div className="hero-circles" aria-hidden="true">
          <span className="hero-circle hero-circle--outer" />
          <span className="hero-circle hero-circle--inner" />
        </div>

        <p className="hero-tag">Formación que transforma</p>

        <h1 className="hero-title">
          Un espacio para acompañar cada logro.
        </h1>

        <p className="hero-subtitle">
          Gestiona talleres, sigue el progreso y mantén conectadas a las
          familias con el proceso formativo.
        </p>

        <ul className="hero-features" role="list">
          {FEATURES.map(({ icon, label }) => (
            <li key={label} className="hero-feature">
              <span className="hero-feature__icon">{icon}</span>
              <span className="hero-feature__label">{label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <main className="login-panel">
        <div className="login-panel__inner">

          <Logo />

          <p className="form-tag">Bienvenido a Son Up</p>
          <h2 className="form-title">Inicia sesión</h2>
          <p className="form-subtitle">
            Ingresa con tu correo y contraseña.
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-wrapper">
                <span className="input-icon"><MailIcon /></span>
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <span className="input-icon"><LockIcon /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

        </div>
      </main>

    </div>
  )
}

export default Login
