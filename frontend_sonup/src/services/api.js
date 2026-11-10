const BASE_URL    = import.meta.env.VITE_API_URL
const SESSION_KEY = 'sonup_session'

const getToken = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY))?.token ?? null }
  catch { return null }
}

const headers = () => {
  const token = getToken()
  const base  = { 'Content-Type': 'application/json' }
  if (token) return { ...base, 'Authorization': `Bearer ${token}` }
  return base
}

/** Error de la API con el código HTTP y el `error.code` del backend. */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name   = 'ApiError'
    this.status = status
    this.code   = code
  }
}

const MENSAJES_POR_ESTADO = {
  401: 'Tu sesión venció. Inicia sesión de nuevo.',
  403: 'No tienes permiso para esta acción.',
  404: 'No se encontró el registro.',
  429: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  502: 'El servicio no responde ahora mismo. Inténtalo de nuevo en unos segundos.',
  503: 'El servicio no responde ahora mismo. Inténtalo de nuevo en unos segundos.',
  504: 'El servicio tardó demasiado en responder. Inténtalo de nuevo.',
}

/**
 * Una sesión vencida (401) en una ruta protegida cierra la sesión y manda al login.
 * `/auth/login` no cuenta: ahí un 401 son credenciales incorrectas y la pantalla debe
 * seguir en pie para mostrar el error (recargarla lo borraría).
 */
const esRutaDeAutenticacion = (url) => /\/auth\/(login|register)(\?|$)/.test(url)

const handleResponse = async (r) => {
  if (r.status === 401 && !esRutaDeAutenticacion(r.url)) {
    localStorage.removeItem(SESSION_KEY)
    if (window.location.pathname !== '/login') window.location.href = '/login'
    throw new ApiError(MENSAJES_POR_ESTADO[401], 401, 'UNAUTHORIZED')
  }
  if (!r.ok) {
    let message = MENSAJES_POR_ESTADO[r.status] ?? String(r.status)
    let code
    try {
      const body = await r.json()
      // El backend siempre responde { error: { code, message, details } }
      if (body?.error?.message) message = body.error.message
      code = body?.error?.code
      if (!body?.error?.message && code) message = code
      // Errores de forma: el detalle dice qué campo falló
      const detalle = body?.error?.details
      if (r.status === 400 && Array.isArray(detalle) && detalle.length) {
        const campos = detalle
          .map(d => (typeof d === 'string' ? d : [d.path ?? d.field, d.message].filter(Boolean).join(': ')))
          .filter(Boolean)
          .join(' · ')
        if (campos) message = `${message} (${campos})`
      }
    } catch { /* cuerpo sin JSON: se usa el mensaje por estado */ }
    throw new ApiError(message, r.status, code)
  }
  if (r.status === 204) return null
  return r.json()
}

/** Un fallo de red (sin respuesta) se muestra en español en lugar de «Failed to fetch». */
const request = (path, init) =>
  fetch(`${BASE_URL}${path}`, init)
    .catch(() => { throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', 0, 'NETWORK') })
    .then(handleResponse)

export const api = {
  get: (path) => request(path, { headers: headers() }),

  post: (path, body) =>
    request(path, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),

  patch: (path, body) =>
    request(path, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }),

  put: (path) => request(path, { method: 'PUT', headers: headers() }),

  delete: (path) => request(path, { method: 'DELETE', headers: headers() }),
}
