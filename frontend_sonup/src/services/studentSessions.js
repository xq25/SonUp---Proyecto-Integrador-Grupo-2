import { getWorkshopSessions } from './sessions.js'

/** Estados de taller que el joven y el acudiente ven como «disponibles». */
const DISPONIBLES = ['planned', 'active']

/**
 * Sesiones que un joven (o su acudiente) puede ver: las de los talleres disponibles
 * (`planned`/`active`) y las de los talleres a los que ya asistió, aunque estén finalizados.
 * Es la misma regla del backend (AccessPolicy.assertCanReadWorkshop): si un taller falla,
 * se omite sin bloquear los demás.
 */
export const getSesionesDelJoven = async (workshops = [], attendances = []) => {
  const ids = new Set(attendances.map(a => String(a.workshopId)))
  workshops.forEach(w => { if (DISPONIBLES.includes(w.status)) ids.add(String(w.id)) })
  const res = await Promise.allSettled([...ids].map(id => getWorkshopSessions(id)))
  return res.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
}

/** Sesiones por venir (programadas desde hoy) y la que esté en curso, en orden de inicio. */
export const proximasSesiones = (sesiones = [], ahora = new Date()) => {
  const inicioDeHoy = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ahora) + 'T00:00:00-05:00')
  return sesiones
    .filter(s => s.status === 'in_progress' || (s.status === 'planned' && new Date(s.startsAt) >= inicioDeHoy))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
}
