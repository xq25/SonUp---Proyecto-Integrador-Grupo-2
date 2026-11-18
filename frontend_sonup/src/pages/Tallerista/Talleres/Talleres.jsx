import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkshops, cancelWorkshop, finishWorkshop } from '../../../services/workshops.js'
import { getWorkshopSessions } from '../../../services/sessions.js'
import { WORKSHOP_STATUS_LABEL, formatFecha, toBogotaDateInput } from '../../../utils/workshops.js'
import SesionTaller from './SesionTaller.jsx'
import ResultadosTaller from './ResultadosTaller.jsx'
import './Talleres.css'

/**
 * FASES 2 y 3 · SESIONES.
 *   - active   → listar sesiones, iniciar/continuar sesión, finalizar taller cuando todas terminaron
 *   - finished → resultados de solo lectura
 */
const SESSION_LABEL = { planned: 'Programada', in_progress: 'En curso', finished: 'Finalizada' }

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
  const [abierto, setAbierto]         = useState(null)   // { taller, sesion?, modo: 'sesion'|'resultados' }
  const [confirmar, setConfirmar]     = useState(null)   // { id, accion: 'cancelar'|'finalizar' }
  const [accionando, setAccionando]   = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  // Sesiones por taller (cargadas al expandir)
  const [sesionesPorTaller, setSesionesPorTaller] = useState({})   // workshopId → session[]
  const [cargandoSesiones, setCargandoSesiones]   = useState({})   // workshopId → true
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
    } catch { /* silencioso: no bloqueamos la vista */ }
    finally { setCargandoSesiones(c => ({ ...c, [key]: false })) }
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

  /* ── Determinar qué sesión abrir ── */
  const sesionParaAbrir = (ss) => {
    if (!ss) return null
    const enCurso = ss.find(s => s.status === 'in_progress')
    if (enCurso) return enCurso
    const ahora = new Date()
    const planificadaHoy = ss.find(s =>
      s.status === 'planned' && toBogotaDateInput(s.startsAt) <= toBogotaDateInput(ahora),
    )
    return planificadaHoy ?? null
  }

  const labelIniciar = (ss) => {
    if (!ss) return null
    if (ss.some(s => s.status === 'in_progress')) return 'Continuar sesión en curso'
    const ahora = new Date()
    if (ss.some(s => s.status === 'planned' && toBogotaDateInput(s.startsAt) <= toBogotaDateInput(ahora)))
      return 'Iniciar sesión'
    return null
  }

  /* ── Acciones ── */
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

  /* ── Después de finalizar una sesión: recargar sesiones y volver a la lista ── */
  const onSesionFinalizada = async (workshopId) => {
    setAbierto(null)
    await cargarSesiones(workshopId)
  }

  /* ── Detalle de un taller ── */
  if (abierto?.modo === 'sesion') {
    return (
      <SesionTaller
        taller={abierto.taller}
        session={abierto.sesion ?? null}
        modoEditar={abierto.modoEditar ?? false}
        onVolver={() => setAbierto(null)}
        onSesionFinalizada={() => onSesionFinalizada(abierto.taller.id)}
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
            const sesionAccionable = ss ? sesionParaAbrir(ss) : null
            const labelBtn = labelIniciar(ss)
            const todasFinalizadas = ss && ss.length > 0 && ss.every(s => s.status === 'finished')

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
                        {labelBtn && (
                          <button type="button" className="btn-publicar btn-publicar--sm"
                            onClick={() => setAbierto({ taller: t, sesion: sesionAccionable, modo: 'sesion' })}>
                            {labelBtn}
                          </button>
                        )}
                        <button type="button" className="btn-volver"
                          onClick={() => setAbierto({ taller: t, sesion: null, modo: 'sesion' })}>
                          Nueva sesión
                        </button>
                        <button type="button" className="btn-volver"
                          onClick={() => { setConfirmar({ id: key, accion: 'cancelar' }); setErrorAccion('') }}>
                          Cancelar taller
                        </button>
                        {todasFinalizadas && (
                          <button type="button" className="btn-publicar btn-publicar--sm"
                            style={{ background: 'var(--color-accent)' }}
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
                    {ss.map(s => (
                      <li key={String(s.id)} className="taller-sesion-row">
                        <span className={`taller-sesion-badge taller-sesion-badge--${s.status}`}>
                          {SESSION_LABEL[s.status] ?? s.status}
                        </span>
                        <span className="taller-sesion-tema">{s.topic}</span>
                        <span className="taller-sesion-horario">
                          {toBogotaDateInput(s.startsAt)} · {new Date(s.startsAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
                        </span>
                        {s.status !== 'finished' && (
                          <button type="button" className="btn-volver taller-sesion-editar"
                            onClick={() => setAbierto({ taller: t, sesion: s, modo: 'sesion', modoEditar: true })}>
                            Editar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {t.status === 'active' && cargandoSS && (
                  <p className="talleres-estado" style={{ padding: '0.4rem 0', textAlign: 'left' }}>Cargando sesiones…</p>
                )}

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
