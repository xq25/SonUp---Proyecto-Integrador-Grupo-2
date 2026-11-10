import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, ROLES } from '../../../context/AuthContext'
import { getChildren } from '../../../services/children.js'
import { getWorkshopSkills } from '../../../services/workshops.js'
import { getSkills } from '../../../services/skills.js'
import { getWorkshopAttendances, updateAttendance } from '../../../services/attendances.js'
import { getEvaluationScales, getAttendanceEvaluations } from '../../../services/evaluations.js'
import { formatFecha, nombreDe, toBogotaDateInput } from '../../../utils/workshops.js'
import './Talleres.css'

/**
 * Fase 3 · taller finalizado: resumen de lo ocurrido.
 * Con el taller cerrado la API ya no deja crear asistencias ni evaluaciones: lo único que se
 * corrige es la observación de cada asistencia (PATCH /attendances/:id { observation }).
 * Desde aquí también se emite el certificado del participante ligado a este taller.
 */
const ResultadosTaller = ({ taller, onVolver }) => {
  const [datos, setDatos]   = useState(null)
  const [error, setError]   = useState('')
  const { activeRole } = useAuth()
  const base = activeRole === ROLES.admin ? '/administrador' : '/tallerista'
  const [editando, setEditando] = useState(null)   // { id, texto }
  const [guardando, setGuardando] = useState(false)
  const [errorObs, setErrorObs] = useState('')

  const guardarObservacion = async () => {
    setGuardando(true); setErrorObs('')
    try {
      const texto = editando.texto.trim()
      await updateAttendance(editando.id, { observation: texto })
      setDatos(d => ({ ...d, filas: d.filas.map(f => (f.id === editando.id ? { ...f, observacion: texto } : f)) }))
      setEditando(null)
    } catch (err) { setErrorObs(err.message) }
    finally { setGuardando(false) }
  }

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [kids, wSkills, skills, escs, atts] = await Promise.all([
          getChildren(), getWorkshopSkills(taller.id), getSkills(), getEvaluationScales(), getWorkshopAttendances(taller.id),
        ])
        const evs = await Promise.allSettled(atts.map(a => getAttendanceEvaluations(a.id)))
        if (!vivo) return
        const escalaPorId = new Map(escs.map(e => [String(e.id), e]))
        const skillNombre = (ws) => skills.find(s => String(s.id) === String(ws.skillId))?.name ?? `Habilidad ${ws.skillId}`
        const columnas = wSkills.map(ws => ({ id: String(ws.id), nombre: skillNombre(ws) }))

        const filas = atts.map((a, i) => {
          const kid = kids.find(k => String(k.id ?? k.childId) === String(a.studentId))
          const lista = evs[i].status === 'fulfilled' ? evs[i].value : []
          const porHabilidad = {}
          lista.forEach(ev => { porHabilidad[String(ev.workshopSkillId)] = escalaPorId.get(String(ev.evaluationScaleId)) })
          return {
            id: String(a.id),
            studentId: String(a.studentId),
            nombre: nombreDe(kid, `Estudiante ${a.studentId}`),
            fecha: toBogotaDateInput(a.attendedAt),
            observacion: a.observation || '',
            porHabilidad,
            sinEvaluaciones: evs[i].status === 'rejected',
          }
        }).sort((x, y) => x.fecha.localeCompare(y.fecha) || x.nombre.localeCompare(y.nombre))

        setDatos({ columnas, filas })
      } catch (err) {
        if (vivo) setError(err.message || 'No se pudieron cargar los resultados.')
      }
    })()
    return () => { vivo = false }
  }, [taller.id])

  const sesiones = datos ? [...new Set(datos.filas.map(f => f.fecha))] : []

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

      {datos && datos.filas.length === 0 && (
        <p className="talleres-estado">Este taller se finalizó sin asistencias registradas.</p>
      )}

      {datos && datos.filas.length > 0 && (
        <>
          <p className="talleres-sub">{sesiones.length} {sesiones.length === 1 ? 'sesión' : 'sesiones'} · {datos.filas.length} asistencias</p>
          {sesiones.map(dia => (
            <section key={dia} className="resultado-sesion">
              <h2 className="resultado-sesion__titulo">{formatFecha(`${dia}T12:00:00-05:00`)}</h2>
              <div className="resultado-tabla-wrap">
                <table className="resultado-tabla">
                  <thead>
                    <tr>
                      <th scope="col">Participante</th>
                      {datos.columnas.map(c => <th scope="col" key={c.id}>{c.nombre}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.filas.filter(f => f.fecha === dia).map(f => (
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
                                <button type="button" className="btn-volver" disabled={guardando} onClick={() => { setEditando(null); setErrorObs('') }}>Cancelar</button>
                              </span>
                            </span>
                          ) : (
                            <>
                              {f.observacion && <small className="resultado-obs">{f.observacion}</small>}
                              <span className="resultado-edit__acciones">
                                <button type="button" className="btn-volver" onClick={() => { setEditando({ id: f.id, texto: f.observacion }); setErrorObs('') }}>
                                  {f.observacion ? 'Corregir observación' : 'Agregar observación'}
                                </button>
                                <Link className="btn-volver" to={`${base}/certificados?participante=${f.studentId}&taller=${taller.id}`}>Certificado</Link>
                              </span>
                            </>
                          )}
                          {f.sinEvaluaciones && <small className="resultado-obs resultado-obs--error">No se pudieron leer sus valoraciones.</small>}
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
