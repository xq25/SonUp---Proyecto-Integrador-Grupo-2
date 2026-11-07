const BASE_URL = import.meta.env.VITE_API_URL
const ACTOR_ID = import.meta.env.VITE_ACTOR_ID

const headers = () => {
  const token = localStorage.getItem('token')
  if (token) return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  return { 'Content-Type': 'application/json', 'X-Actor-Id': ACTOR_ID }
}

const handleResponse = async (r) => {
  if (!r.ok) {
    // Try to parse error body for EXTERNAL_SERVICE codes
    let errMsg = String(r.status)
    try {
      const body = await r.json()
      if (body?.error?.message) errMsg = body.error.message
      else if (body?.error?.code) errMsg = body.error.code
    } catch { /* ignore parse error */ }
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
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  put: (path) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: headers(),
    }).then(handleResponse),

  delete: (path) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: headers(),
    }).then(handleResponse),
}
