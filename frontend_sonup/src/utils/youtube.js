/**
 * Enlaces de YouTube. La guía del backend pide guardar los videos como
 * `https://www.youtube.com/embed/<id>` y mostrarlos en un <iframe>: un enlace
 * `youtu.be/…` o `watch?v=…` no se reproduce embebido.
 */

const HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
  'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be', 'www.youtu.be',
])

const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/

/** Id del video (11 caracteres) o null si el enlace no es de YouTube. */
export const youtubeId = (url) => {
  let u
  try { u = new URL(String(url ?? '').trim()) } catch { return null }
  if (!HOSTS.has(u.hostname.toLowerCase())) return null

  let id = null
  if (u.hostname.toLowerCase().endsWith('youtu.be')) {
    id = u.pathname.split('/')[1]
  } else if (u.pathname === '/watch') {
    id = u.searchParams.get('v')
  } else {
    // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const [, tipo, valor] = u.pathname.split('/')
    if (['embed', 'shorts', 'live', 'v'].includes(tipo)) id = valor
  }
  return id && ID_VALIDO.test(id) ? id : null
}

export const isYoutubeUrl = (url) => youtubeId(url) !== null

/** Enlace embebible (`/embed/<id>`); si no es de YouTube devuelve el enlace tal cual. */
export const toYoutubeEmbed = (url) => {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : url
}

/** Miniatura pública del video. */
export const youtubeThumbnail = (url) => {
  const id = youtubeId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}
