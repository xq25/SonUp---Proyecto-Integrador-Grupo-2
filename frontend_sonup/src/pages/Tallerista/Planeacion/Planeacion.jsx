import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  getWorkshops, createWorkshop, updateWorkshop, getWorkshopSkills,
  addWorkshopSkill, removeWorkshopSkill, activateWorkshop, cancelWorkshop, deleteWorkshop,
} from '../../../services/workshops.js'
import { getSkills, getSkillCategories } from '../../../services/skills.js'
import { getProfessionals } from '../../../services/professionals.js'
import { startOfBogotaDay, toBogotaDateInput, todayBogota, formatFecha, nombreDe } from '../../../utils/workshops.js'
import './Planeacion.css'

/**
 * FASE 1 · PLANEACIÓN (talleres `planned`).
 * Aquí se crea el taller, se editan sus datos, se le agregan las habilidades que se van a
 * evaluar y se activa. Tomar asistencia, evaluar y finalizar es de las fases 2 y 3
 * (pantalla «Sesiones»): la API rechaza esas acciones mientras el taller no esté `active`.
 */
const Planeacion = ({ isAdmin = false, crearPath }) => {
  const navigate = useNavigate()
  const { saga } = useAuth()
  const sesionesPath = isAdmin ? '/administrador/talleres' : '/tallerista/talleres'

  const [talleres, setTalleres]     = useState([])
  const [habilidades, setHabilidades] = useState({})   // workshopId → [{ id, skillId }]
  const [catalogo, setCatalogo]     = useState([])     // skills
  const [categorias, setCategorias] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [cargando, setCargando]     = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [abierto, setAbierto]       = useState(null)   // id del taller con el panel abierto
  const [borrador, setBorrador]     = useState({})     // id → { name, date, evaluatorId }
  const [ocupado, setOcupado]       = useState({})     // id → true mientras hay una petición
  const [mensaje, setMensaje]       = useState({})     // id → { tipo: 'error' | 'ok', texto }
  const [confirmar, setConfirmar]   = useState(null)   // { id, accion: 'cancelar' | 'eliminar' | 'activar' }
  const [activado, setActivado]     = useState(null)   // taller recién activado (aviso con enlace a Sesiones)

  const [nuevoAbierto, setNuevoAbierto] = useState(false)
  const [nuevo, setNuevo]           = useState({ name: '', date: '', evaluatorId: '' })
  const [creando, setCreando]       = useState(false)
  const [errorCrear, setErrorCrear] = useState('')

  const skillPorId = useMemo(() => new Map(catalogo.map(s => [String(s.id), s])), [catalogo])
  const categoriaPorId = useMemo(() => new Map(categorias.map(c => [String(c.id), c])), [categorias])
  const profesionalPorId = useMemo(() => new Map(profesionales.map(p => [String(p.id), p])), [profesionales])

  const marcar = (id, value) => setOcupado(o => ({ ...o, [id]: value }))
  const avisar = (id, tipo, texto) => setMensaje(m => ({ ...m, [id]: texto ? { tipo, texto } : undefined }))

  /* ── Carga ── */
  const cargarHabilidadesDe = useCallback(async (lista) => {
    const res = await Promise.allSettled(lista.map(t => getWorkshopSkills(t.id)))
    setHabilidades(prev => {
      const next = { ...prev }
      res.forEach((r, i) => { if (r.status === 'fulfilled') next[String(lista[i].id)] = r.value })
      return next
    })
  }, [])

  const cargar = useCallback(async () => {
    // El backend ya filtra: un tallerista solo recibe sus talleres; ADMIN recibe todos.
    const lista = await getWorkshops({ status: 'planned' })
    setTalleres(lista)
    await cargarHabilidadesDe(lista)
    return lista
  }, [cargarHabilidadesDe])

  useEffect(() => {
    let vivo = true
    const base = [getSkills(), getSkillCategories()]
    if (isAdmin) base.push(getProfessionals())
    Promise.allSettled([cargar(), ...base]).then(([lista, skills, cats, profs]) => {
      if (!vivo) return
      if (lista.status === 'rejected') setErrorCarga(lista.reason?.message || 'No se pudieron cargar los talleres.')
      if (skills.status === 'fulfilled') setCatalogo(skills.value)
      if (cats.status === 'fulfilled') setCategorias(cats.value)
      if (profs?.status === 'fulfilled') setProfesionales(profs.value)
      setCargando(false)
    })
    return () => { vivo = false }
  }, [cargar, isAdmin])

  /* ── Crear ── */
  const evaluadorNuevo = isAdmin ? nuevo.evaluatorId : saga?.professionalId
  const puedeCrear = nuevo.name.trim().length >= 3 && Boolean(evaluadorNuevo) && !creando

  const crear = async (e) => {
    e.preventDefault()
    if (!puedeCrear) return
    setCreando(true)
    setErrorCrear('')
    try {
      const body = { evaluatorId: String(evaluadorNuevo), name: nuevo.name.trim() }
      if (nuevo.date) body.startsAt = startOfBogotaDay(nuevo.date)
      const creado = await createWorkshop(body)
      setNuevo({ name: '', date: '', evaluatorId: '' })
      setNuevoAbierto(false)
      await cargar()
      abrir(creado)
    } catch (err) {
      setErrorCrear(err.message)
    } finally {
      setCreando(false)
    }
  }

  /* ── Panel de edición ── */
  const abrir = (t) => {
    const id = String(t.id)
    setAbierto(prev => (prev === id ? null : id))
    setBorrador(b => ({
      ...b,
      [id]: { name: t.name, date: toBogotaDateInput(t.startsAt), evaluatorId: String(t.evaluatorId) },
    }))
    avisar(id, 'ok', '')
    setConfirmar(null)
  }

  const editar = (id, campo, valor) =>
    setBorrador(b => ({ ...b, [id]: { ...b[id], [campo]: valor } }))

  const guardarDatos = async (t) => {
    const id = String(t.id)
    const d = borrador[id]
    const body = {}
    if (d.name.trim() !== t.name) body.name = d.name.trim()
    if (d.date !== toBogotaDateInput(t.startsAt)) body.startsAt = d.date ? startOfBogotaDay(d.date) : null
    if (isAdmin && d.evaluatorId !== String(t.evaluatorId)) body.evaluatorId = d.evaluatorId
    if (Object.keys(body).length === 0) { avisar(id, 'ok', 'No hay cambios por guardar.'); return }
    marcar(id, true); avisar(id, 'ok', '')
    try {
      const actualizado = await updateWorkshop(t.id, body)
      setTalleres(lista => lista.map(x => (String(x.id) === id ? actualizado : x)))
      avisar(id, 'ok', 'Datos guardados.')
    } catch (err) { avisar(id, 'error', err.message) }
    finally { marcar(id, false) }
  }

  const agregarHabilidad = async (t, skillId) => {
    if (!skillId) return
    const id = String(t.id)
    marcar(id, true); avisar(id, 'ok', '')
    try {
      await addWorkshopSkill(t.id, skillId)
      await cargarHabilidadesDe([t])
    } catch (err) { avisar(id, 'error', err.message) }
    finally { marcar(id, false) }
  }

  const quitarHabilidad = async (t, skillId) => {
    const id = String(t.id)
    marcar(id, true); avisar(id, 'ok', '')
    try {
      await removeWorkshopSkill(t.id, skillId)
      await cargarHabilidadesDe([t])
    } catch (err) { avisar(id, 'error', err.message) }
    finally { marcar(id, false) }
  }

  /* ── Transiciones ── */
  const ejecutar = async (t, accion) => {
    const id = String(t.id)
    marcar(id, true); avisar(id, 'ok', '')
    try {
      if (accion === 'activar')  await activateWorkshop(t.id)
      if (accion === 'cancelar') await cancelWorkshop(t.id)
      if (accion === 'eliminar') await deleteWorkshop(t.id)
      setTalleres(lista => lista.filter(x => String(x.id) !== id))
      setConfirmar(null)
      if (abierto === id) setAbierto(null)
      if (accion === 'activar') setActivado(t)
    } catch (err) {
      avisar(id, 'error', err.message)
      setConfirmar(null)
    } finally { marcar(id, false) }
  }

  const disponibles = (id) => {
    const ya = new Set((habilidades[id] ?? []).map(h => String(h.skillId)))
    return catalogo.filter(s => !ya.has(String(s.id)))
  }

  return (
    <div className="plan-page">

      <header className="plan-header">
        <div>
          <p className="plan-fase">FASE 1 · PLANEACIÓN</p>
          <h1 className="plan-titulo">Planeación de talleres</h1>
          <p className="plan-sub">
            Crea el taller, define las habilidades que se van a evaluar y actívalo cuando esté listo.
            Después lo manejas en <Link to={sesionesPath}>Sesiones</Link>.
          </p>
        </div>
        <button type="button" className="plan-btn plan-btn--primario" onClick={() => { setNuevoAbierto(v => !v); setErrorCrear('') }}>
          {nuevoAbierto ? 'Cancelar' : '+ Nuevo taller'}
        </button>
      </header>

      {activado && (
        <div className="plan-aviso" role="status">
          <span><strong>{activado.name}</strong> ya está en curso. Ya puedes tomar asistencia y evaluar.</span>
          <span className="plan-aviso__acciones">
            <button type="button" className="plan-btn plan-btn--primario plan-btn--sm" onClick={() => navigate(sesionesPath)}>Ir a Sesiones</button>
            <button type="button" className="plan-btn plan-btn--link" onClick={() => setActivado(null)}>Cerrar</button>
          </span>
        </div>
      )}

      {nuevoAbierto && (
        <form className="plan-card plan-nuevo" onSubmit={crear} noValidate>
          <div className="plan-campos">
            <div className="plan-campo plan-campo--ancho">
              <label htmlFor="plan-nuevo-nombre">Nombre del taller</label>
              <input id="plan-nuevo-nombre" value={nuevo.name} placeholder="Ej: Ritmo y percusión"
                onChange={e => setNuevo(n => ({ ...n, name: e.target.value }))} />
              {nuevo.name.length > 0 && nuevo.name.trim().length < 3 && <small className="plan-hint plan-hint--error">Mínimo 3 caracteres.</small>}
            </div>
            <div className="plan-campo">
              <label htmlFor="plan-nuevo-fecha">Fecha de inicio</label>
              <input id="plan-nuevo-fecha" type="date" value={nuevo.date}
                onChange={e => setNuevo(n => ({ ...n, date: e.target.value }))} />
            </div>
            {isAdmin && (
              <div className="plan-campo">
                <label htmlFor="plan-nuevo-evaluador">Tallerista responsable</label>
                <select id="plan-nuevo-evaluador" value={nuevo.evaluatorId}
                  onChange={e => setNuevo(n => ({ ...n, evaluatorId: e.target.value }))}>
                  <option value="">— Selecciona —</option>
                  {profesionales.map(p => (
                    <option key={String(p.id)} value={String(p.id)}>{nombreDe(p, `Tallerista ${p.id}`)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {!isAdmin && !saga?.professionalId && (
            <p className="plan-msg plan-msg--error" role="alert">
              Tu cuenta no tiene un registro de tallerista enlazado en Saga. Usa «Completar registro» en el menú.
            </p>
          )}
          {errorCrear && <p className="plan-msg plan-msg--error" role="alert">{errorCrear}</p>}
          <div className="plan-fila-acciones">
            <button type="submit" className="plan-btn plan-btn--primario" disabled={!puedeCrear}>
              {creando ? 'Creando…' : 'Crear taller'}
            </button>
            {crearPath && (
              <Link className="plan-btn plan-btn--link" to={crearPath}>
                Prefiero el asistente con habilidades, paso a paso →
              </Link>
            )}
          </div>
        </form>
      )}

      {cargando && <p className="plan-estado">Cargando talleres…</p>}
      {errorCarga && <p className="plan-estado plan-estado--error" role="alert">{errorCarga}</p>}
      {!cargando && !errorCarga && talleres.length === 0 && (
        <div className="plan-vacio">
          <p><strong>No hay talleres en planeación.</strong></p>
          <p>Crea uno con «+ Nuevo taller». Los que ya activaste están en <Link to={sesionesPath}>Sesiones</Link>.</p>
        </div>
      )}

      <ul className="plan-lista" role="list">
        {talleres.map(t => {
          const id = String(t.id)
          const hs = habilidades[id]
          const cuantas = hs?.length ?? 0
          const tieneFecha = Boolean(t.startsAt)
          const listo = cuantas > 0 && tieneFecha
          const futuro = tieneFecha && new Date(t.startsAt) > new Date()
          const d = borrador[id]
          const msg = mensaje[id]
          const busy = Boolean(ocupado[id])
          const estaAbierto = abierto === id
          const responsable = profesionalPorId.get(String(t.evaluatorId))
          const quedan = estaAbierto ? disponibles(id) : []
          const dirty = estaAbierto && d && (
            d.name.trim() !== t.name || d.date !== toBogotaDateInput(t.startsAt) ||
            (isAdmin && d.evaluatorId !== String(t.evaluatorId)))

          return (
            <li key={id} className="plan-card">
              <div className="plan-card__top">
                <div className="plan-card__info">
                  <h2 className="plan-card__nombre">{t.name}</h2>
                  <p className="plan-card__meta">
                    Inicio: {formatFecha(t.startsAt)}
                    {isAdmin && responsable && <> · {nombreDe(responsable)}</>}
                  </p>
                  <ul className="plan-checks" role="list" aria-label="Requisitos para activar">
                    <li className={cuantas > 0 ? 'plan-check plan-check--ok' : 'plan-check'}>
                      {hs === undefined ? 'Habilidades…' : cuantas > 0 ? `${cuantas} habilidad${cuantas === 1 ? '' : 'es'}` : 'Falta agregar habilidades'}
                    </li>
                    <li className={tieneFecha ? 'plan-check plan-check--ok' : 'plan-check'}>
                      {tieneFecha ? 'Con fecha de inicio' : 'Falta la fecha de inicio'}
                    </li>
                  </ul>
                </div>
                <div className="plan-card__acciones">
                  <button type="button" className="plan-btn plan-btn--sec" onClick={() => abrir(t)} aria-expanded={estaAbierto}>
                    {estaAbierto ? 'Cerrar' : 'Editar'}
                  </button>
                  <button
                    type="button" className="plan-btn plan-btn--primario"
                    disabled={!listo || busy}
                    title={listo ? 'Pasa el taller a «En curso»' : 'Necesita al menos una habilidad y fecha de inicio'}
                    onClick={() => setConfirmar({ id, accion: 'activar' })}
                  >
                    Activar taller
                  </button>
                </div>
              </div>

              {confirmar?.id === id && (
                <div className="plan-confirmar" role="alertdialog" aria-label="Confirmar acción">
                  <p>
                    {confirmar.accion === 'activar' && <>Al activarlo ya no podrás cambiar su nombre, fechas ni tallerista, y se podrá tomar asistencia y evaluar.{futuro && <> <strong>Empieza el {formatFecha(t.startsAt)}</strong>: no se podrá tomar asistencia antes de ese día.</>}</>}
                    {confirmar.accion === 'cancelar' && 'El taller quedará cancelado y no se podrá reabrir.'}
                    {confirmar.accion === 'eliminar' && 'El taller se eliminará. Solo es posible si no tiene asistencias.'}
                  </p>
                  <div className="plan-fila-acciones">
                    <button type="button" className={`plan-btn ${confirmar.accion === 'activar' ? 'plan-btn--primario' : 'plan-btn--peligro'}`}
                      disabled={busy} onClick={() => ejecutar(t, confirmar.accion)}>
                      {busy ? 'Procesando…' : confirmar.accion === 'activar' ? 'Sí, activar' : confirmar.accion === 'cancelar' ? 'Sí, cancelar taller' : 'Sí, eliminar'}
                    </button>
                    <button type="button" className="plan-btn plan-btn--link" onClick={() => setConfirmar(null)}>Volver</button>
                  </div>
                </div>
              )}

              {msg && <p className={`plan-msg plan-msg--${msg.tipo}`} role={msg.tipo === 'error' ? 'alert' : 'status'}>{msg.texto}</p>}

              {estaAbierto && d && (
                <div className="plan-panel">
                  <div className="plan-campos">
                    <div className="plan-campo plan-campo--ancho">
                      <label htmlFor={`plan-n-${id}`}>Nombre</label>
                      <input id={`plan-n-${id}`} value={d.name} onChange={e => editar(id, 'name', e.target.value)} />
                    </div>
                    <div className="plan-campo">
                      <label htmlFor={`plan-f-${id}`}>Fecha de inicio</label>
                      <input id={`plan-f-${id}`} type="date" value={d.date} min={undefined}
                        onChange={e => editar(id, 'date', e.target.value)} />
                      {d.date && d.date < todayBogota() && <small className="plan-hint">Fecha pasada: sirve para registrar sesiones atrasadas.</small>}
                    </div>
                    {isAdmin && (
                      <div className="plan-campo">
                        <label htmlFor={`plan-e-${id}`}>Tallerista responsable</label>
                        <select id={`plan-e-${id}`} value={d.evaluatorId} onChange={e => editar(id, 'evaluatorId', e.target.value)}>
                          {profesionales.map(p => (
                            <option key={String(p.id)} value={String(p.id)}>{nombreDe(p, `Tallerista ${p.id}`)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="plan-fila-acciones">
                    <button type="button" className="plan-btn plan-btn--primario" disabled={busy || !dirty || d.name.trim().length < 3}
                      onClick={() => guardarDatos(t)}>
                      {busy ? 'Guardando…' : 'Guardar datos'}
                    </button>
                  </div>

                  <div className="plan-habs">
                    <h3 className="plan-habs__titulo">Habilidades que se evaluarán</h3>
                    {cuantas === 0 ? (
                      <p className="plan-hint">Aún no hay habilidades. Agrega al menos una para poder activar el taller.</p>
                    ) : (
                      <ul className="plan-chips" role="list">
                        {hs.map(h => {
                          const sk = skillPorId.get(String(h.skillId))
                          const cat = categoriaPorId.get(String(sk?.skillCategoryId))
                          return (
                            <li key={String(h.id)} className="plan-chip">
                              <span>{sk?.name ?? `Habilidad ${h.skillId}`}</span>
                              {cat && <small>{cat.name}</small>}
                              <button type="button" aria-label={`Quitar ${sk?.name ?? 'habilidad'}`} disabled={busy}
                                onClick={() => quitarHabilidad(t, h.skillId)}>×</button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    <div className="plan-campo plan-campo--inline">
                      <label htmlFor={`plan-h-${id}`}>Agregar habilidad</label>
                      <select id={`plan-h-${id}`} value="" disabled={busy || quedan.length === 0}
                        onChange={e => agregarHabilidad(t, e.target.value)}>
                        <option value="">{quedan.length === 0 ? 'No quedan habilidades por agregar' : '— Selecciona una habilidad —'}</option>
                        {categorias.map(c => {
                          const delaCat = quedan.filter(s => String(s.skillCategoryId) === String(c.id))
                          if (delaCat.length === 0) return null
                          return (
                            <optgroup key={String(c.id)} label={c.name}>
                              {delaCat.map(s => <option key={String(s.id)} value={String(s.id)}>{s.name}</option>)}
                            </optgroup>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="plan-peligro">
                    <button type="button" className="plan-btn plan-btn--link plan-btn--rojo" disabled={busy}
                      onClick={() => setConfirmar({ id, accion: 'cancelar' })}>Cancelar taller</button>
                    <button type="button" className="plan-btn plan-btn--link plan-btn--rojo" disabled={busy}
                      onClick={() => setConfirmar({ id, accion: 'eliminar' })}>Eliminar taller</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Planeacion
