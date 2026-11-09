import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY  = 'sonup_session'

const getStored = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null }
  catch { return null }
}

const isExpired = (expiresAt) => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

const destinoPorRol = (roles = []) => {
  if (roles.includes('ADMIN'))       return '/administrador/inicio'
  if (roles.includes('TALLERISTA'))  return '/tallerista/inicio'
  if (roles.includes('ESTUDIANTE'))  return '/dashboard'
  if (roles.includes('ACUDIENTE'))   return '/acudiente'
  return '/login'
}

/* ── Provider ────────────────────────────────────────────────────────────── */

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const stored = getStored()
    if (!stored) return null
    if (isExpired(stored.expiresAt)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return stored
  })

  /* Cierra la sesión si llega a expiresAt */
  useEffect(() => {
    if (!session?.expiresAt) return
    const ms = new Date(session.expiresAt) - Date.now()
    if (ms <= 0) { logout(); return }
    const t = setTimeout(logout, ms)
    return () => clearTimeout(t)
  }, [session?.expiresAt])

  const saveSession = useCallback((data) => {
    let expiresAt = data.expiresAt ?? null
    if (!expiresAt && data.expiresIn > 0) {
      expiresAt = new Date(Date.now() + data.expiresIn * 1000).toISOString()
    }
    const s = {
      token:     data.token,
      expiresAt,
      user:      data.user ?? null,
      saga:      data.saga ?? null,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, saveSession, logout, destinoPorRol }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

export const useAuth = () => useContext(AuthContext)
