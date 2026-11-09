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

const handleResponse = async (r) => {
  if (r.status === 401) {
    localStorage.removeItem(SESSION_KEY)
    window.location.href = '/login'
    throw new Error('401')
  }
  if (!r.ok) {
    let errMsg = String(r.status)
    try {
      const body = await r.json()
      if (body?.error?.message) errMsg = body.error.message
      else if (body?.error?.code) errMsg = body.error.code
    } catch { /* ignorar error de parseo */ }
    throw new Error(errMsg)
  }
  if (r.status === 204) return null
  return r.json()
}

export const api = {
  get: (path) =>
    fetch(`${BASE_URL}${path}`, { headers: headers() }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method:  'PATCH',
      headers: headers(),
      body:    JSON.stringify(body),
    }).then(handleResponse),

  put: (path) =>
    fetch(`${BASE_URL}${path}`, {
      method:  'PUT',
      headers: headers(),
    }).then(handleResponse),

  delete: (path) =>
    fetch(`${BASE_URL}${path}`, {
      method:  'DELETE',
      headers: headers(),
    }).then(handleResponse),
}
