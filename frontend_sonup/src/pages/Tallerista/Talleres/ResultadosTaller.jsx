import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, ROLES } from '../../../context/AuthContext'
import { getChildren } from '../../../services/children.js'
import { getWorkshopSkills } from '../../../services/workshops.js'
import { getSkills, getStudentSkills } from '../../../services/skills.js'
import { getWorkshopAttendances, updateAttendance } from '../../../services/attendances.js'
import { getWorkshopSessions } from '../../../services/sessions.js'
import { getEvaluationScales, getAttendanceEvaluations } from '../../../services/evaluations.js'
import { formatFecha, formatHora, nombreDe } from '../../../utils/workshops.js'
import './Talleres.css'

/**
 * Taller finalizado: resultados.
 *  1. Calificación acumulada de cada joven en las habilidades del taller (`GET /students/:id/skills`).
 *     Es la que cuenta: se calcula con las sesiones finalizadas, en orden de inicio.
 *  2. Detalle por sesión, en orden de fecha: la escala valorada en esa sesión y la observación.
 * Solo se puede corregir la observación de cada asistencia.
 */
const EscalaChip = ({ escala }) => (
  escala
    ? <span className={`val-btn val-btn--sel val-btn--${String(escala.code).toLowerCase()} resultado-escala`} title={escala.name}>{escala.code}</span>
    : <span className="resultado-vacio" aria-label="Sin valorar">—</span>
)

const ResultadosTaller = ({ taller, onVolver }) => {
  const [datos, setDatos]     = useState(null)
  const [error, setError]     = useState('')
  const { activeRole } = useAuth()
  const base = activeRole === ROLES.admin ? '/administrador' : '/tallerista'
  const [editando, setEditando]   = useState(null)   // { id, texto }
  const [guardando, setGuardando] = useState(false)
  const [errorObs, setErrorObs]   = useState('')

  const guardarObservacion = async () => {
    setGuardando(true); setErrorObs('')
    try {
      const texto = editando.texto.trim()
      await updateAttendance(editando.id, { observation: texto })
      setDatos(d => ({
        ...d,
        sesiones: d.sesiones.map(s => ({
          ...s,
          filas: s.filas.map(f => f.id === editando.id ? { ...f, observacion: texto } : f),
        })),
      }))
      setEditando(null)
    } catch (err) { setErrorObs(err.message) }
    finally { setGuardando(false) }
  }

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [kids, wSkills, skills, escs, atts, sessions] = await Promise.all([
          getChildren(), getWorkshopSkills(taller.id), getSkills(),
          getEvaluationScales(), getWorkshopAttendances(taller.id), getWorkshopSessions(taller.id),
        ])
        const estudiantesIds = [...new Set(atts.map(a => String(a.studentId)))]
        const [evs, acumuladas] = await Promise.all([
          Promise.allSettled(atts.map(a => getAttendanceEvaluations(a.id))),
          Promise.allSettled(estudiantesIds.map(id => getStudentSkills(id))),
        ])
        if (!vivo) return

        const escalaPorId = new Map(escs.map(e => [String(e.id), e]))
        const skillNombre = (ws) => skills.find(s => String(s.id) === String(ws.skillId))?.name ?? `Habilidad ${ws.skillId}`
        const columnas    = wSkills.map(ws => ({ id: String(ws.id), skillId: String(ws.skillId), nombre: skillNombre(ws) }))
        const sessionById = new Map(sessions.map(s => [String(s.id), s]))
        const nombreJoven = (id) => nombreDe(kids.find(k => String(k.id ?? k.childId) === String(id)), `Estudiante ${id}`)

        /* 1. Calificación acumulada por joven y habilidad */
        const acumulado = estudiantesIds.map((id, i) => {
          const r = acumuladas[i]
          const porSkill = {}
          if (r.status === 'fulfilled') {
            ;(r.value ?? []).forEach(c => { porSkill[String(c.skillId)] = c.scale ?? escalaPorId.get(String(c.evaluationScaleId)) })
          }
          return { studentId: id, nombre: nombreJoven(id), porSkill, fallo: r.status === 'rejected' }
        }).sort((x, y) => x.nombre.localeCompare(y.nombre))

        /* 2. Asistencias agrupadas por sesión */
        const grupos = {}
        atts.forEach((a, i) => {
          const sessId = String(a.sessionId ?? 'sin-sesion')
          const lista  = evs[i].status === 'fulfilled' ? evs[i].value : []
          const porHabilidad = {}
          lista.forEach(ev => { porHabilidad[String(ev.workshopSkillId)] = escalaPorId.get(String(ev.evaluationScaleId)) })
          ;(grupos[sessId] ??= []).push({
            id:          String(a.id),
            studentId:   String(a.studentId),
            nombre:      nombreJoven(a.studentId),
            observacion: a.observation || '',
            porHabilidad,
            sinEvaluaciones: evs[i].status === 'rejected',
          })
        })

        const sesiones = Object.entries(grupos)
          .map(([sessId, filas]) => {
            const sess = sessionById.get(sessId)
            return {
              id:     sessId,
              topic:  sess?.topic ?? (sessId !== 'sin-sesion' ? `Sesión ${sessId}` : 'Sin sesión'),
              inicio: sess?.startsAt ?? null,
              filas:  [...filas].sort((x, y) => x.nombre.localeCompare(y.nombre)),
            }
          })
          // En orden de fecha (como se cargan las calificaciones); lo que no tiene sesión, al final
          .sort((x, y) => (x.inicio ? new Date(x.inicio).getTime() : Infinity) - (y.inicio ? new Date(y.inicio).getTime() : Infinity))

        setDatos({ columnas, sesiones, acumulado })
      } catch (err) {
        if (vivo) setError(err.message || 'No se pudieron cargar los resultados.')
      }
    })()
    return () => { vivo = false }
  }, [taller.id])

  const totalAsistencias = datos ? datos.sesiones.reduce((acc, s) => acc + s.filas.length, 0) : 0

  return (
    <div className="talleres-page">
      <header className="talleres-header">
        <div>
          <button type="button" className="btn-volver btn-volver--header" onClick={onVolver}>← Volver a mis talleres</button>
          <p className="talleres-fase">FASE 3 · RESULTADOS</p>
          <h1 className="talleres-titulo">{taller.name}</h1>
          <p className="talleres-sub">
            {formatFecha(taller.startsAt)} → {formatFecha(taller.endsAt)} · <span className="taller-badge taller-badge--finished">Finalizado</span>
          </p>
        </div>
      </header>

      {!datos && !error && <p className="talleres-estado">Cargando resultados…</p>}
      {error && <p className="talleres-estado talleres-estado--error" role="alert">{error}</p>}

      {datos && totalAsistencias === 0 && (
        <p className="talleres-estado">Este taller se finalizó sin asistencias registradas.</p>
      )}

      {datos && totalAsistencias > 0 && (
        <>
          <p className="talleres-sub">
            {datos.sesiones.length} {datos.sesiones.length === 1 ? 'sesión' : 'sesiones'} · {totalAsistencias} asistencias · {datos.acumulado.length} {datos.acumulado.length === 1 ? 'participante' : 'participantes'}
          </p>

          {/* ── 1. Calificación acumulada ── */}
          <section className="resultado-sesion resultado-acumulado" aria-labelledby="res-acumulado">
            <div className="resultado-sesion__head">
              <h2 id="res-acumulado" className="resultado-sesion__titulo">Calificación acumulada</h2>
              <span className="resultado-sesion__meta">Promedio de las sesiones finalizadas, en orden de fecha</span>
            </div>
            <div className="resultado-tabla-wrap">
              <table className="resultado-tabla">
                <thead>
                  <tr>
                    <th scope="col">Participante</th>
                    {datos.columnas.map(c => <th scope="col" key={c.id}>{c.nombre}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {datos.acumulado.map(j => (
                    <tr key={j.studentId}>
                      <th scope="row">
                        {j.nombre}
                        {j.fallo && <small className="resultado-obs resultado-obs--error">No se pudo leer su calificación.</small>}
                      </th>
                      {datos.columnas.map(c => <td key={c.id}><EscalaChip escala={j.porSkill[c.skillId]} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 2. Detalle por sesión ── */}
          <h2 className="resultado-seccion">Detalle por sesión</h2>
          {datos.sesiones.map((ses, idx) => (
            <section key={ses.id} className="resultado-sesion" aria-labelledby={`res-ses-${ses.id}`}>
              <div className="resultado-sesion__head">
                <h3 id={`res-ses-${ses.id}`} className="resultado-sesion__titulo">
                  <span className="resultado-sesion__n">{idx + 1}</span>{ses.topic}
                </h3>
                {ses.inicio && (
                  <span className="resultado-sesion__meta">{formatFecha(ses.inicio)} · {formatHora(ses.inicio)} · {ses.filas.length} {ses.filas.length === 1 ? 'asistente' : 'asistentes'}</span>
                )}
              </div>
              <div className="resultado-tabla-wrap">
                <table className="resultado-tabla">
                  <thead>
                    <tr>
                      <th scope="col">Participante</th>
                      {datos.columnas.map(c => <th scope="col" key={c.id}>{c.nombre}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ses.filas.map(f => (
                      <tr key={f.id}>
                        <th scope="row">
                          {f.nombre}
                          {editando?.id === f.id ? (
                            <span className="resultado-edit">
                              <textarea
                                className="resultado-edit__texto" rows={3} maxLength={1000} value={editando.texto}
                                aria-label={`Observación de ${f.nombre}`}
                                onChange={e => setEditando({ ...editando, texto: e.target.value })}
                              />
                              {errorObs && <small className="resultado-obs resultado-obs--error" role="alert">{errorObs}</small>}
                              <span className="resultado-edit__acciones">
                                <button type="button" className="btn-publicar btn-publicar--sm" disabled={guardando} onClick={guardarObservacion}>
                                  {guardando ? 'Guardando…' : 'Guardar'}
                                </button>
                                <button type="button" className="btn-volver" disabled={guardando}
                                  onClick={() => { setEditando(null); setErrorObs('') }}>Cancelar</button>
                              </span>
                            </span>
                          ) : (
                            <>
                              {f.observacion && <small className="resultado-obs">{f.observacion}</small>}
                              <span className="resultado-edit__acciones">
                                <button type="button" className="btn-volver"
                                  onClick={() => { setEditando({ id: f.id, texto: f.observacion }); setErrorObs('') }}>
                                  {f.observacion ? 'Corregir observación' : 'Agregar observación'}
                                </button>
                                <Link className="btn-volver"
                                  to={`${base}/certificados?participante=${f.studentId}&taller=${taller.id}`}>
                                  Certificado
                                </Link>
                              </span>
                            </>
                          )}
                          {f.sinEvaluaciones && (
                            <small className="resultado-obs resultado-obs--error">No se pudieron leer sus valoraciones.</small>
                          )}
                        </th>
                        {datos.columnas.map(c => <td key={c.id}><EscalaChip escala={f.porHabilidad[c.id]} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

export default ResultadosTaller
