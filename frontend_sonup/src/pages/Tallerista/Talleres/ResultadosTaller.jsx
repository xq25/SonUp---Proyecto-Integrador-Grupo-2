import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, ROLES } from '../../../context/AuthContext'
import { getChildren } from '../../../services/children.js'
import { getWorkshopSkills } from '../../../services/workshops.js'
import { getSkills } from '../../../services/skills.js'
import { getWorkshopAttendances, updateAttendance } from '../../../services/attendances.js'
import { getWorkshopSessions } from '../../../services/sessions.js'
import { getEvaluationScales, getAttendanceEvaluations } from '../../../services/evaluations.js'
import { formatFecha, nombreDe } from '../../../utils/workshops.js'
import './Talleres.css'

/**
 * Taller finalizado: resultados agrupados por sesión.
 * Columnas = habilidades del taller; celdas = escala I/EP/NR/L evaluada en esa sesión.
 * Solo se puede corregir la observación de cada asistencia.
 */
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
        const evs = await Promise.allSettled(atts.map(a => getAttendanceEvaluations(a.id)))
        if (!vivo) return

        const escalaPorId   = new Map(escs.map(e => [String(e.id), e]))
        const skillNombre   = (ws) => skills.find(s => String(s.id) === String(ws.skillId))?.name ?? `Habilidad ${ws.skillId}`
        const columnas      = wSkills.map(ws => ({ id: String(ws.id), nombre: skillNombre(ws) }))
        const sessionById   = new Map(sessions.map(s => [String(s.id), s]))

        // Group attendances by sessionId
        const grupos = {}
        atts.forEach((a, i) => {
          const sessId = String(a.sessionId ?? 'sin-sesion')
          if (!grupos[sessId]) grupos[sessId] = []
          const kid        = kids.find(k => String(k.id ?? k.childId) === String(a.studentId))
          const lista      = evs[i].status === 'fulfilled' ? evs[i].value : []
          const porHabilidad = {}
          lista.forEach(ev => { porHabilidad[String(ev.workshopSkillId)] = escalaPorId.get(String(ev.evaluationScaleId)) })
          grupos[sessId].push({
            id:          String(a.id),
            studentId:   String(a.studentId),
            nombre:      nombreDe(kid, `Estudiante ${a.studentId}`),
            observacion: a.observation || '',
            porHabilidad,
            sinEvaluaciones: evs[i].status === 'rejected',
          })
        })

        const sesiones = Object.entries(grupos).map(([sessId, filas]) => {
          const sess = sessionById.get(sessId)
          return {
            id:    sessId,
            topic: sess?.topic ?? (sessId !== 'sin-sesion' ? `Sesión ${sessId}` : 'Sesiones'),
            filas: [...filas].sort((x, y) => x.nombre.localeCompare(y.nombre)),
          }
        })

        setDatos({ columnas, sesiones })
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
            {datos.sesiones.length} {datos.sesiones.length === 1 ? 'sesión' : 'sesiones'} · {totalAsistencias} asistencias
          </p>

          {datos.sesiones.map(ses => (
            <section key={ses.id} className="resultado-sesion">
              <h2 className="resultado-sesion__titulo">{ses.topic}</h2>
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
                        {datos.columnas.map(c => {
                          const esc = f.porHabilidad[c.id]
                          return (
                            <td key={c.id}>
                              {esc
                                ? <span className={`val-btn val-btn--sel val-btn--${String(esc.code).toLowerCase()} resultado-escala`} title={esc.name}>{esc.code}</span>
                                : <span className="resultado-vacio" aria-label="Sin valorar">—</span>}
                            </td>
                          )
                        })}
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
