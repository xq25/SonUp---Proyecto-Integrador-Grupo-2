import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkshops, cancelWorkshop, finishWorkshop } from '../../../services/workshops.js'
import { getWorkshopSessions, deleteSession } from '../../../services/sessions.js'
import {
  WORKSHOP_STATUS_LABEL, SESSION_STATUS_LABEL, formatFecha, formatHora, toBogotaDateInput,
  sesionEnCurso, siguienteProgramada,
} from '../../../utils/workshops.js'
import SesionTaller from './SesionTaller.jsx'
import ResultadosTaller from './ResultadosTaller.jsx'
import './Talleres.css'

/**
 * FASES 2 y 3 · SESIONES.
 *   - active   → listar sesiones, crear una nueva, iniciar/continuar la siguiente, finalizar el taller
 *   - finished → resultados de solo lectura
 *
 * Los dos botones de un taller activo son independientes:
 *   - «Nueva sesión»: formulario en blanco para programar (o dictar ya) una sesión nueva.
 *   - «Iniciar sesión» / «Continuar sesión en curso»: abre la sesión en curso (paso 2) o la
 *     siguiente programada (paso 1, con sus datos para revisarlos antes de iniciarla).
 */
const PESTANAS = [
  { id: 'active',   label: 'En curso'    },
  { id: 'finished', label: 'Finalizados' },
]

const Talleres = ({ isAdmin = false }) => {
  const base = isAdmin ? '/administrador' : '/tallerista'

  const [talleres, setTalleres]       = useState([])
  const [cargando, setCargando]       = useState(true)
  const [errorCarga, setErrorCarga]   = useState('')
  const [pestana, setPestana]         = useState('active')
  const [abierto, setAbierto]         = useState(null)   // { taller, sesion, modo: 'nueva'|'iniciar'|'editar'|'resultados' }
  const [confirmar, setConfirmar]     = useState(null)   // { id, accion: 'cancelar'|'finalizar' }
  const [accionando, setAccionando]   = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  // Sesiones por taller
  const [sesionesPorTaller, setSesionesPorTaller] = useState({})   // workshopId → session[]
  const [cargandoSesiones, setCargandoSesiones]   = useState({})   // workshopId → true
  const [borrarSesion, setBorrarSesion]           = useState(null) // id de la sesión por confirmar
  const [borrando, setBorrando]                   = useState(false)
  const [errorSesion, setErrorSesion]             = useState({})   // workshopId → mensaje
  const sesionesIniciadasRef = useRef(new Set())                    // workshopIds ya encolados

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      setTalleres(await getWorkshops({}))
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar los talleres.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const porEstado = useMemo(() => ({
    active:   talleres.filter(t => t.status === 'active'),
    finished: talleres.filter(t => t.status === 'finished'),
    planned:  talleres.filter(t => t.status === 'planned'),
  }), [talleres])

  const reemplazar = (actualizado) =>
    setTalleres(lista => lista.map(t => (String(t.id) === String(actualizado.id) ? { ...t, ...actualizado } : t)))

  /* ── Cargar sesiones de un taller ── */
  const cargarSesiones = useCallback(async (workshopId) => {
    const key = String(workshopId)
    setCargandoSesiones(c => ({ ...c, [key]: true }))
    try {
      const ss = await getWorkshopSessions(workshopId)
      setSesionesPorTaller(prev => ({ ...prev, [key]: ss }))
      setErrorSesion(e => ({ ...e, [key]: '' }))
    } catch (err) {
      setErrorSesion(e => ({ ...e, [key]: err.message || 'No se pudieron cargar las sesiones.' }))
    } finally { setCargandoSesiones(c => ({ ...c, [key]: false })) }
  }, [])

  /* ── Auto-cargar sesiones de talleres activos ── */
  useEffect(() => {
    if (cargando) return
    talleres.forEach(t => {
      if (t.status !== 'active') return
      const key = String(t.id)
      if (!sesionesIniciadasRef.current.has(key)) {
        sesionesIniciadasRef.current.add(key)
        cargarSesiones(t.id)
      }
    })
  }, [talleres, cargando, cargarSesiones])

  /* ── Acciones del taller ── */
  const ejecutarAccion = async (t, accion) => {
    setAccionando(true)
    setErrorAccion('')
    try {
      if (accion === 'cancelar') {
        reemplazar(await cancelWorkshop(t.id))
      } else if (accion === 'finalizar') {
        const actualizado = await finishWorkshop(t.id)
        reemplazar(actualizado)
        setPestana('finished')
        setAbierto({ taller: actualizado, modo: 'resultados' })
      }
      setConfirmar(null)
    } catch (err) {
      setErrorAccion(err.message)
      setConfirmar(null)
    } finally {
      setAccionando(false)
    }
  }

  /* ── Eliminar una sesión programada que no se va a dictar ── */
  const eliminarSesion = async (t, s) => {
    const key = String(t.id)
    setBorrando(true)
    try {
      await deleteSession(s.id)
      setBorrarSesion(null)
      await cargarSesiones(t.id)
    } catch (err) {
      setErrorSesion(e => ({ ...e, [key]: err.message }))
      setBorrarSesion(null)
    } finally {
      setBorrando(false)
    }
  }

  /* ── Al salir del detalle de una sesión: volver a la lista con las sesiones al día ── */
  const cerrarDetalle = (workshopId) => {
    setAbierto(null)
    if (workshopId) cargarSesiones(workshopId)
  }

  /* ── Detalle ── */
  if (abierto && abierto.modo !== 'resultados') {
    const ss = sesionesPorTaller[String(abierto.taller.id)] ?? []
    const enCurso = sesionEnCurso(ss)
    return (
      <SesionTaller
        // La key fuerza un formulario nuevo cada vez que se abre otra sesión (o una nueva)
        key={`${abierto.taller.id}-${abierto.modo}-${abierto.sesion?.id ?? 'nueva'}`}
        taller={abierto.taller}
        session={abierto.sesion ?? null}
        modoEditar={abierto.modo === 'editar'}
        otraEnCurso={enCurso && String(enCurso.id) !== String(abierto.sesion?.id) ? enCurso : null}
        onVolver={() => cerrarDetalle(abierto.taller.id)}
        onSesionFinalizada={() => cerrarDetalle(abierto.taller.id)}
      />
    )
  }
  if (abierto?.modo === 'resultados') {
    return <ResultadosTaller taller={abierto.taller} onVolver={() => setAbierto(null)} />
  }

  /* ── Lista ── */
  const visibles = porEstado[pestana]

  return (
    <div className="talleres-page">
      <header className="talleres-header">
        <div>
          <p className="talleres-fase">FASES 2 Y 3 · SESIONES</p>
          <h1 className="talleres-titulo">{isAdmin ? 'Talleres' : 'Mis talleres'}</h1>
          <p className="talleres-sub">
            Toma asistencia y valora en los talleres en curso; revisa los resultados de los finalizados.
          </p>
        </div>
        <Link to={`${base}/planeacion`} className="btn-publicar btn-publicar--sm talleres-link-btn">
          Planeación{porEstado.planned.length > 0 ? ` (${porEstado.planned.length})` : ''}
        </Link>
      </header>

      <div className="talleres-tabs" role="tablist" aria-label="Estado del taller">
        {PESTANAS.map(p => (
          <button
            key={p.id} type="button" role="tab" aria-selected={pestana === p.id}
            className={`talleres-tab${pestana === p.id ? ' talleres-tab--activa' : ''}`}
            onClick={() => { setPestana(p.id); setConfirmar(null); setErrorAccion('') }}
          >
            {p.label} <span className="talleres-tab__n">{porEstado[p.id].length}</span>
          </button>
        ))}
      </div>

      {cargando && <p className="talleres-estado">Cargando talleres…</p>}
      {errorCarga && (
        <p className="talleres-estado talleres-estado--error" role="alert">
          {errorCarga} <button type="button" className="btn-volver" onClick={cargar}>Reintentar</button>
        </p>
      )}
      {errorAccion && <p className="talleres-estado talleres-estado--error" role="alert">{errorAccion}</p>}

      {!cargando && !errorCarga && visibles.length === 0 && (
        <p className="talleres-estado">
          {pestana === 'active'
            ? <>No hay talleres en curso. Activa uno desde <Link to={`${base}/planeacion`}>Planeación</Link>.</>
            : 'Aún no hay talleres finalizados.'}
        </p>
      )}

      {!cargando && !errorCarga && visibles.length > 0 && (
        <ul className="talleres-lista" role="list">
          {visibles.map(t => {
            const key = String(t.id)
            const ss = sesionesPorTaller[key]
            const cargandoSS = Boolean(cargandoSesiones[key])
            const enCurso = ss ? sesionEnCurso(ss) : null
            const siguiente = ss ? siguienteProgramada(ss) : null
            const programadas = ss ? ss.filter(s => s.status === 'planned').length : 0
            const todasFinalizadas = Boolean(ss) && ss.length > 0 && ss.every(s => s.status === 'finished')
            const errSS = errorSesion[key]

            return (
              <li key={key} className="taller-item taller-item--col">
                <div className="taller-item__fila">
                  <div className="taller-item__info">
                    <h3 className="taller-item__nombre">{t.name}</h3>
                    <span className={`taller-badge taller-badge--${t.status}`}>{WORKSHOP_STATUS_LABEL[t.status] ?? t.status}</span>
                    <span className="taller-item__fechas">
                      {formatFecha(t.startsAt)}{t.endsAt ? ` → ${formatFecha(t.endsAt)}` : ''}
                    </span>
                  </div>
                  <div className="taller-item__acciones">
                    {t.status === 'active' && (
                      <>
                        <button type="button" className="btn-volver btn-nueva-sesion"
                          onClick={() => setAbierto({ taller: t, sesion: null, modo: 'nueva' })}>
                          + Nueva sesión
                        </button>
                        {enCurso ? (
                          <button type="button" className="btn-publicar btn-publicar--sm"
                            onClick={() => setAbierto({ taller: t, sesion: enCurso, modo: 'iniciar' })}>
                            Continuar sesión en curso
                          </button>
                        ) : (
                          <button type="button" className="btn-publicar btn-publicar--sm"
                            disabled={!siguiente}
                            title={siguiente
                              ? `Siguiente: «${siguiente.topic}» · ${formatFecha(siguiente.startsAt)} ${formatHora(siguiente.startsAt)}`
                              : 'No hay sesiones programadas: crea una con «Nueva sesión»'}
                            onClick={() => setAbierto({ taller: t, sesion: siguiente, modo: 'iniciar' })}>
                            Iniciar sesión
                          </button>
                        )}
                        <button type="button" className="btn-volver"
                          onClick={() => { setConfirmar({ id: key, accion: 'cancelar' }); setErrorAccion('') }}>
                          Cancelar taller
                        </button>
                        {todasFinalizadas && (
                          <button type="button" className="btn-publicar btn-publicar--sm taller-btn-finalizar"
                            onClick={() => { setConfirmar({ id: key, accion: 'finalizar' }); setErrorAccion('') }}>
                            Finalizar taller
                          </button>
                        )}
                      </>
                    )}
                    {t.status === 'finished' && (
                      <button type="button" className="btn-publicar btn-publicar--sm"
                        onClick={() => setAbierto({ taller: t, modo: 'resultados' })}>
                        Ver resultados
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de sesiones */}
                {t.status === 'active' && ss && ss.length > 0 && (
                  <ul className="taller-sesiones" role="list" aria-label="Sesiones del taller">
                    {ss.map(s => {
                      const sid = String(s.id)
                      const esSiguiente = !enCurso && siguiente && String(siguiente.id) === sid
                      return (
                        <li key={sid} className={`taller-sesion-row${esSiguiente ? ' taller-sesion-row--siguiente' : ''}`}>
                          <span className={`taller-sesion-badge taller-sesion-badge--${s.status}`}>
                            {SESSION_STATUS_LABEL[s.status] ?? s.status}
                          </span>
                          <span className="taller-sesion-tema">
                            {s.topic}
                            {esSiguiente && <small className="taller-sesion-siguiente">Siguiente</small>}
                          </span>
                          <span className="taller-sesion-horario">
                            {toBogotaDateInput(s.startsAt)} · {formatHora(s.startsAt)}
                          </span>
                          {s.status !== 'finished' && (
                            <span className="taller-sesion-acciones">
                              <button type="button" className="btn-volver taller-sesion-editar"
                                onClick={() => setAbierto({ taller: t, sesion: s, modo: 'editar' })}>
                                Editar
                              </button>
                              {s.status === 'planned' && (
                                <button type="button" className="btn-volver taller-sesion-eliminar"
                                  onClick={() => { setBorrarSesion(sid); setErrorSesion(e => ({ ...e, [key]: '' })) }}>
                                  Eliminar
                                </button>
                              )}
                            </span>
                          )}
                          {borrarSesion === sid && (
                            <div className="taller-sesion-confirmar" role="alertdialog" aria-label="Confirmar eliminación">
                              <p>¿Eliminar la sesión «{s.topic}»? Úsalo para las sesiones que no se van a dictar.</p>
                              <span className="taller-sesion-acciones">
                                <button type="button" className="btn-publicar btn-publicar--sm taller-btn-peligro"
                                  disabled={borrando} onClick={() => eliminarSesion(t, s)}>
                                  {borrando ? 'Eliminando…' : 'Sí, eliminar'}
                                </button>
                                <button type="button" className="btn-volver" disabled={borrando}
                                  onClick={() => setBorrarSesion(null)}>
                                  Volver
                                </button>
                              </span>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {t.status === 'active' && ss && ss.length === 0 && (
                  <p className="talleres-estado talleres-estado--izq">Este taller aún no tiene sesiones. Crea una con «Nueva sesión».</p>
                )}
                {t.status === 'active' && !todasFinalizadas && programadas > 0 && !enCurso && ss?.some(s => s.status === 'finished') && (
                  <p className="talleres-estado talleres-estado--izq talleres-estado--nota">
                    Para finalizar el taller, todas sus sesiones deben estar finalizadas: elimina las programadas que no se van a dictar.
                  </p>
                )}
                {t.status === 'active' && cargandoSS && !ss && (
                  <p className="talleres-estado talleres-estado--izq">Cargando sesiones…</p>
                )}
                {errSS && <p className="talleres-estado talleres-estado--error" role="alert">{errSS}</p>}

                {confirmar?.id === key && (
                  <div className="taller-confirmar" role="alertdialog" aria-label="Confirmar acción">
                    <p>
                      {confirmar.accion === 'cancelar' && 'El taller quedará cancelado y no se podrá reabrir. Las asistencias ya registradas se conservan.'}
                      {confirmar.accion === 'finalizar' && 'Al finalizar el taller se registra la fecha de fin y ya no se podrán tomar asistencias ni valorar.'}
                    </p>
                    <div className="taller-item__acciones">
                      <button type="button"
                        className={`btn-publicar btn-publicar--sm ${confirmar.accion === 'cancelar' ? 'taller-btn-peligro' : ''}`}
                        disabled={accionando}
                        onClick={() => ejecutarAccion(t, confirmar.accion)}>
                        {accionando ? 'Procesando…' : confirmar.accion === 'cancelar' ? 'Sí, cancelar' : 'Sí, finalizar'}
                      </button>
                      <button type="button" className="btn-volver" onClick={() => setConfirmar(null)}>Volver</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Talleres
