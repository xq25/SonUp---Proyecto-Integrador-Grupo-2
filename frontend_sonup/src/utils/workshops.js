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

export const nombreDe = (persona, respaldo = '') =>
  [persona?.firstName, persona?.lastName].filter(Boolean).join(' ')
  || persona?.fullName
  || respaldo
