import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

const SESSION_KEY = 'sonup_session'
const CHILD_KEY   = 'sonup_selected_child'
const ROLE_KEY    = 'sonup_active_role'

export const ROLES = {
  admin:      'ADMIN',
  tallerista: 'TALLERISTA',
  estudiante: 'ESTUDIANTE',
  acudiente:  'ACUDIENTE',
  donante:    'DONANTE',
}

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? null }
  catch { return null }
}

const isExpired = (expiresAt) => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

/** Vista inicial según los roles del token (el de mayor alcance primero). */
export const destinoPorRol = (roles = []) => {
  if (roles.includes(ROLES.admin))      return '/administrador/inicio'
  if (roles.includes(ROLES.tallerista)) return '/tallerista/inicio'
  if (roles.includes(ROLES.estudiante)) return '/dashboard'
  if (roles.includes(ROLES.acudiente))  return '/acudiente'
  if (roles.includes(ROLES.donante))    return '/sin-acceso'
  return '/login'
}

/** Orden en que se muestran los roles en «Mis vistas». */
export const ROLE_ORDER = [ROLES.admin, ROLES.tallerista, ROLES.acudiente, ROLES.estudiante, ROLES.donante]

/** Rol con el que se entra por defecto (el de mayor alcance); coincide con `destinoPorRol`. */
export const rolPorDefecto = (roles = []) =>
  [ROLES.admin, ROLES.tallerista, ROLES.estudiante, ROLES.acudiente, ROLES.donante].find(r => roles.includes(r)) ?? null

/** Roles cuyas vistas dependen de estar enlazado con su registro en Saga ("lo suyo"). */
const ROLES_CON_ENLACE = [ROLES.tallerista, ROLES.estudiante, ROLES.acudiente]

/* ── Provider ────────────────────────────────────────────────────────────── */

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const stored = readJson(SESSION_KEY)
    if (!stored) return null
    if (isExpired(stored.expiresAt)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return stored
  })
  const [storedChildId, setStoredChildId] = useState(() => localStorage.getItem(CHILD_KEY))
  const [storedRole, setStoredRole] = useState(() => localStorage.getItem(ROLE_KEY))

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(CHILD_KEY)
    localStorage.removeItem(ROLE_KEY)
    setStoredChildId(null)
    setStoredRole(null)
    setSession(null)
  }, [])

  /* Cierra la sesión al llegar a expiresAt */
  useEffect(() => {
    if (!session?.expiresAt) return
    const ms = new Date(session.expiresAt) - Date.now()
    if (ms <= 0) { logout(); return }
    const t = setTimeout(logout, Math.min(ms, 2 ** 31 - 1))
    return () => clearTimeout(t)
  }, [session?.expiresAt, logout])

  const saveSession = useCallback((data) => {
    let expiresAt = data.expiresAt ?? null
    if (!expiresAt && data.expiresIn > 0) {
      expiresAt = new Date(Date.now() + data.expiresIn * 1000).toISOString()
    }
    const s = {
      token: data.token,
      expiresAt,
      user:  data.user ?? null,
      saga:  data.saga ?? null,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    localStorage.removeItem(CHILD_KEY)
    localStorage.removeItem(ROLE_KEY)   // cada login entra con el rol por defecto
    setStoredChildId(null)
    setStoredRole(null)
    setSession(s)
  }, [])

  /**
   * GET /auth/profile: relee usuario, roles e ids de Saga con el token vigente.
   * Sirve para reintentar cuando el login llegó con `saga: null` (Saga dormida en Render)
   * y para releer los ids después de que el usuario se registra en Saga.
   */
  const refreshProfile = useCallback(async () => {
    const p = await api.get('/auth/profile')
    setSession(prev => {
      if (!prev) return prev
      const next = {
        ...prev,
        expiresAt: p.expiresAt ?? prev.expiresAt,
        user: { id: p.id, username: p.username, email: p.email, roles: p.roles ?? [] },
        saga: p.saga ?? null,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return next
    })
    return p
  }, [])

  /* Si la sesión quedó sin bloque `saga`, reintenta (hasta 3 veces, espaciado por el arranque de Render) */
  const intentos = useRef(0)
  const token    = session?.token
  const sinSaga  = Boolean(session) && !session.saga
  useEffect(() => {
    if (!token || !sinSaga || intentos.current >= 3) return
    const t = setTimeout(() => {
      intentos.current += 1
      refreshProfile().catch(() => {})
    }, intentos.current === 0 ? 0 : 8000)
    return () => clearTimeout(t)
  }, [token, sinSaga, refreshProfile, session?.saga])
  useEffect(() => { if (!token) intentos.current = 0 }, [token])

  /* ── Derivados ─────────────────────────────────────────────────────────── */

  const roles = useMemo(() => session?.user?.roles ?? [], [session])
  const saga  = session?.saga ?? null
  const hasRole = useCallback((...wanted) => wanted.some(r => roles.includes(r)), [roles])

  /**
   * Rol con el que se está usando la app («Mis vistas»). Una cuenta puede tener varios roles,
   * pero cada vez se ve el mockup de uno solo. Es solo de interfaz: el backend autoriza con
   * todos los roles del token.
   */
  const activeRole = roles.includes(storedRole) ? storedRole : rolPorDefecto(roles)

  /** Cambia el rol activo (solo lo guarda; quien llama recarga hacia el inicio de ese rol). */
  const selectRole = useCallback((role) => {
    if (!role) return
    localStorage.setItem(ROLE_KEY, role)
    setStoredRole(role)
  }, [])

  /** ¿Falta enlazar la cuenta con Saga? (solo aplica al rol activo si tiene vistas de "lo suyo") */
  const needsLink = Boolean(session) && saga !== null && saga.linked === false &&
    ROLES_CON_ENLACE.includes(activeRole)

  /** Jóvenes que se pueden consultar según el rol activo: el propio (ESTUDIANTE) o los vigentes (ACUDIENTE). */
  const childIds = useMemo(() => {
    if (activeRole === ROLES.estudiante) return saga?.childId ? [String(saga.childId)] : []
    if (activeRole === ROLES.acudiente)  return [...new Set((saga?.childIds ?? []).map(String))]
    return []
  }, [activeRole, saga])

  /** Joven activo: el elegido en el selector del header, o el primero. */
  const activeChildId = childIds.includes(String(storedChildId)) ? String(storedChildId) : (childIds[0] ?? null)

  const selectChild = useCallback((id) => {
    const value = id == null ? null : String(id)
    if (value) localStorage.setItem(CHILD_KEY, value)
    else localStorage.removeItem(CHILD_KEY)
    setStoredChildId(value)
  }, [])

  const value = {
    session, saveSession, logout, refreshProfile, destinoPorRol,
    roles, saga, hasRole, needsLink, activeRole, selectRole,
    childIds, activeChildId, selectChild,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
