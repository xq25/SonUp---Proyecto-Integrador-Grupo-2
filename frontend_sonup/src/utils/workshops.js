/* Utilidades compartidas por las pantallas de talleres (Planeación y Sesiones). */

/** Fases del ciclo de vida de un taller en el backend. */
export const WORKSHOP_PHASE = {
  planned:   { n: 1, label: 'Planeación' },
  active:    { n: 2, label: 'Ejecución' },
  finished:  { n: 3, label: 'Cierre y resultados' },
  cancelled: { n: 0, label: 'Cancelado' },
}

export const WORKSHOP_STATUS_LABEL = {
  planned:   'En planeación',
  active:    'En curso',
  finished:  'Finalizado',
  cancelled: 'Cancelado',
}

const TZ = 'America/Bogota'

const partsOf = (value, options) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, ...options })
      .formatToParts(new Date(value))
      .map(p => [p.type, p.value]),
  )

/** yyyy-mm-dd en hora de Bogotá (para <input type="date">). */
export const toBogotaDateInput = (value) => {
  if (!value) return ''
  const p = partsOf(value, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

/** HH:mm en hora de Bogotá (para <input type="time">). */
export const toBogotaTimeInput = (value) => {
  if (!value) return ''
  const p = partsOf(value, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return `${p.hour}:${p.minute}`
}

export const todayBogota = () => toBogotaDateInput(new Date())

/**
 * Inicio del día (00:00, Bogotá) como ISO. Es la fecha de inicio que se le da a un taller:
 * así se puede tomar asistencia desde el primer minuto de ese día (la asistencia no puede
 * ser anterior al inicio del taller).
 */
export const startOfBogotaDay = (yyyyMmDd) => `${yyyyMmDd}T00:00:00-05:00`

export const formatFecha = (value) =>
  value
    ? new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ })
    : 'Sin definir'

/* ── Sesiones de taller ─────────────────────────────────────────────────── */

export const SESSION_STATUS_LABEL = {
  planned:     'Programada',
  in_progress: 'En curso',
  finished:    'Finalizada',
}

/** Fecha (yyyy-mm-dd) + hora (HH:mm) de Bogotá → ISO UTC. `null` si falta algo o no es válida. */
export const bogotaToISO = (fecha, hora) => {
  if (!fecha || !hora) return null
  const d = new Date(`${fecha}T${hora}:00-05:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Hora legible en Bogotá (p. ej. «3:00 p. m.»). */
export const formatHora = (value) =>
  value
    ? new Date(value).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
    : ''

/** Lista de pasos → texto `steps` de la API («1. …\n2. …»). */
export const stepsToText = (pasos = []) =>
  pasos.map((p, i) => `${i + 1}. ${p}`).join('\n')

/** Texto `steps` de la API → lista de pasos (sin la numeración). */
export const textToSteps = (texto) =>
  (texto ?? '')
    .split('\n')
    .map(l => l.trim().replace(/^\d+\s*[.)-]\s*/, ''))
    .filter(Boolean)

/** Lista de materiales → texto `materials` de la API (uno por línea). */
export const materialsToText = (materiales = []) => materiales.join('\n')

/** Texto `materials` de la API → lista (acepta salto de línea o coma, como en Planeación). */
export const textToMaterials = (texto) =>
  (texto ?? '')
    .split(/[\n,]/)
    .map(m => m.trim())
    .filter(Boolean)

const porInicio = (a, b) => new Date(a.startsAt) - new Date(b.startsAt)

/** Sesión en curso del taller, si la hay (solo puede haber una). */
export const sesionEnCurso = (sesiones = []) => sesiones.find(s => s.status === 'in_progress') ?? null

/** Siguiente sesión programada (la de inicio más temprano), aunque su hora aún no haya llegado. */
export const siguienteProgramada = (sesiones = []) =>
  [...sesiones].filter(s => s.status === 'planned').sort(porInicio)[0] ?? null

export const nombreDe = (persona, respaldo = '') =>
  [persona?.firstName, persona?.lastName].filter(Boolean).join(' ')
  || persona?.fullName
  || respaldo
