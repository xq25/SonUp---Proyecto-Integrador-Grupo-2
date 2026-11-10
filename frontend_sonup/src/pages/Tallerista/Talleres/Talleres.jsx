import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkshops, cancelWorkshop } from '../../../services/workshops.js'
import { WORKSHOP_STATUS_LABEL, formatFecha } from '../../../utils/workshops.js'
import SesionTaller from './SesionTaller.jsx'
import ResultadosTaller from './ResultadosTaller.jsx'
import './Talleres.css'

/**
 * FASES 2 y 3 · SESIONES. Aquí solo viven los talleres que ya se activaron:
 *   - active   → se toma asistencia, se valora y se puede finalizar (fase 2 y 3 del flujo)
 *   - finished → resultados de solo lectura
 * Lo que está en `planned` se prepara en «Planeación» (fase 1).
 */
const PESTANAS = [
  { id: 'active',   label: 'En curso'    },
  { id: 'finished', label: 'Finalizados' },
]

const Talleres = ({ isAdmin = false }) => {
  const base = isAdmin ? '/administrador' : '/tallerista'

  const [talleres, setTalleres]     = useState([])
  const [cargando, setCargando]     = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [pestana, setPestana]       = useState('active')
  const [abierto, setAbierto]       = useState(null)      // { taller, modo: 'sesion' | 'resultados' }
  const [confirmar, setConfirmar]   = useState(null)      // id del taller a cancelar
  const [cancelando, setCancelando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      // El backend devuelve solo los talleres del tallerista (ADMIN: todos)
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

  const cancelar = async (t) => {
    setCancelando(true)
    setErrorAccion('')
    try {
      reemplazar(await cancelWorkshop(t.id))
      setConfirmar(null)
    } catch (err) {
      setErrorAccion(err.message)
    } finally {
      setCancelando(false)
    }
  }

  /* ── Detalle de un taller ── */
  if (abierto?.modo === 'sesion') {
    return (
      <SesionTaller
        taller={abierto.taller}
        onVolver={() => setAbierto(null)}
        onTallerActualizado={reemplazar}
        onFinalizado={(t) => { reemplazar(t); setPestana('finished'); setAbierto({ taller: t, modo: 'resultados' }) }}
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
          {visibles.map(t => (
            <li key={String(t.id)} className="taller-item taller-item--col">
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
                      <button type="button" className="btn-publicar btn-publicar--sm" onClick={() => setAbierto({ taller: t, modo: 'sesion' })}>
                        Registrar sesión
                      </button>
                      <button type="button" className="btn-volver" onClick={() => { setConfirmar(t.id); setErrorAccion('') }}>
                        Cancelar taller
                      </button>
                    </>
                  )}
                  {t.status === 'finished' && (
                    <button type="button" className="btn-publicar btn-publicar--sm" onClick={() => setAbierto({ taller: t, modo: 'resultados' })}>
                      Ver resultados
                    </button>
                  )}
                </div>
              </div>
              {confirmar === t.id && (
                <div className="taller-confirmar" role="alertdialog" aria-label="Confirmar cancelación">
                  <p>El taller quedará cancelado y no se podrá reabrir. Las asistencias ya registradas se conservan.</p>
                  <div className="taller-item__acciones">
                    <button type="button" className="btn-publicar btn-publicar--sm taller-btn-peligro" disabled={cancelando} onClick={() => cancelar(t)}>
                      {cancelando ? 'Cancelando…' : 'Sí, cancelar taller'}
                    </button>
                    <button type="button" className="btn-volver" onClick={() => setConfirmar(null)}>Volver</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Talleres
