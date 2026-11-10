import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getSkillCategories, getSkills, createSkillCategory, createSkill } from '../../../services/skills.js'
import { createWorkshop, addWorkshopSkill } from '../../../services/workshops.js'
import { getProfessionals } from '../../../services/professionals.js'
import { startOfBogotaDay } from '../../../utils/workshops.js'
import './Habilidades.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const LayersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const RouteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
)
const TrendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const TallerSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const JuegoSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Static UI data ─────────────────────────────────────────────────────── */

const MODULOS = ['Música', 'Artes', 'Panadería', 'Educación física', 'Teatro', 'Danza']
const GRUPOS  = ['Jóvenes · Grupo A', 'Jóvenes · Grupo B', 'Adultos · Grupo A']

const PASOS = [
  { n: 1, titulo: 'Actividad',   sub: 'Define el módulo y el origen'    },
  { n: 2, titulo: 'Habilidades', sub: 'Selecciona qué se trabaja'        },
  { n: 3, titulo: 'Medición',    sub: 'Configura escala o ponderación'   },
  { n: 4, titulo: 'Resumen',     sub: 'Revisa y publica la configuración' },
]

const ORIGENES = [
  { id: 'sonup',  titulo: 'Taller Son-Up',  desc: 'El tallerista registra asistencia, evidencia y valoración.', icon: <TallerSvg /> },
  { id: 'aulaup', titulo: 'Juego Aula-Up',  desc: 'Aula-Up envía finalización y progreso ponderado.',          icon: <JuegoSvg /> },
]

const ESCALA = [
  { id: 'I',  nombre: 'Iniciado',         desc: 'Se acerca a la habilidad con apoyo permanente.'      },
  { id: 'EP', nombre: 'En proceso',        desc: 'La realiza parcialmente o con apoyo ocasional.'      },
  { id: 'NR', nombre: 'Necesita refuerzo', desc: 'Requiere una estrategia o acompañamiento diferente.' },
  { id: 'L',  nombre: 'Logrado',           desc: 'La demuestra de manera consistente y autónoma.'      },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const catCode = (nombre) => (nombre ?? '').slice(0, 2).toUpperCase()

/* ─── Component ──────────────────────────────────────────────────────────── */

const Habilidades = ({ isAdmin = false, returnPath = '/tallerista/planeacion' }) => {
  const navigate = useNavigate()
  const { session } = useAuth()

  /* Stepper */
  const [fase, setFase] = useState(1)

  /* Fase 1 */
  const [modulo,       setModulo]       = useState('Música')
  const [grupo,        setGrupo]        = useState('Jóvenes · Grupo A')
  const [nombre,       setNombre]       = useState('')
  const [objetivo,     setObjetivo]     = useState('')
  const [fechaInicio,  setFechaInicio]  = useState('')
  const [origen,       setOrigen]       = useState('sonup')
  const [evaluadorSelec, setEvaluadorSelec] = useState('')

  /* Fase 2 — selección de habilidades (IDs reales) */
  const [seleccionadas, setSeleccionadas] = useState(new Set())

  /* Fase 3 */
  const [momentoVal,  setMomentoVal]  = useState('cierre')
  const [responsable, setResponsable] = useState('tallerista')
  const [regla,       setRegla]       = useState('reciente')

  /* Datos del backend */
  const [categorias,    setCategorias]    = useState([])
  const [habilidadesDB, setHabilidadesDB] = useState([])
  const [cargandoHabs,  setCargandoHabs]  = useState(true)
  const [profesionales, setProfesionales] = useState([])

  /* Estado de guardado */
  const [guardando,    setGuardando]    = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)
  const [tallerCreado,  setTallerCreado]  = useState(null)
  const [habsAgregadas, setHabsAgregadas] = useState(() => new Set())

  /* Gestión árbol de habilidades (solo admin) */
  const [arbolAbierto,  setArbolAbierto]  = useState(false)
  const [newCatNombre,  setNewCatNombre]  = useState('')
  const [newCatDesc,    setNewCatDesc]    = useState('')
  const [creandoCat,    setCreandoCat]    = useState(false)
  const [catError,      setCatError]      = useState('')
  const [newSkillCatId, setNewSkillCatId] = useState('')
  const [newSkillNombre,setNewSkillNombre]= useState('')
  const [creandoSkill,  setCreandoSkill]  = useState(false)
  const [skillError,    setSkillError]    = useState('')

  useEffect(() => {
    const queries = [getSkillCategories(), getSkills()]
    if (isAdmin) queries.push(getProfessionals())
    Promise.allSettled(queries).then(([cats, skills, profs]) => {
      if (cats.status   === 'fulfilled') setCategorias(cats.value)
      if (skills.status === 'fulfilled') setHabilidadesDB(skills.value)
      if (profs && profs.status === 'fulfilled') setProfesionales(profs.value)
      setCargandoHabs(false)
    })
  }, [isAdmin])

  const handleCrearCat = async () => {
    if (creandoCat) return
    setCreandoCat(true)
    setCatError('')
    try {
      const cat = await createSkillCategory({ name: newCatNombre.trim(), description: newCatDesc.trim() || undefined })
      setCategorias(prev => [...prev, cat])
      setNewCatNombre('')
      setNewCatDesc('')
    } catch {
      setCatError('No se pudo crear la categoría. Verifica que el nombre sea único.')
    } finally { setCreandoCat(false) }
  }

  const handleCrearSkill = async () => {
    if (creandoSkill) return
    setCreandoSkill(true)
    setSkillError('')
    try {
      const skill = await createSkill({ name: newSkillNombre.trim(), skillCategoryId: newSkillCatId })
      setHabilidadesDB(prev => [...prev, skill])
      setNewSkillNombre('')
      setNewSkillCatId('')
    } catch {
      setSkillError('No se pudo crear la habilidad. Verifica que el nombre sea único en esa categoría.')
    } finally { setCreandoSkill(false) }
  }

  /* Derivados */
  const dimensiones = useMemo(() =>
    categorias
      .map(cat => ({
        id:          String(cat.id),
        nombre:      cat.name,
        desc:        cat.description || '',
        habilidades: habilidadesDB
          .filter(s => String(s.skillCategoryId) === String(cat.id))
          .map(s => ({ id: String(s.id), nombre: s.name, desc: s.description || '' })),
      }))
      .filter(d => d.habilidades.length > 0),
    [categorias, habilidadesDB]
  )

  const dimMap = useMemo(() => {
    const m = {}
    dimensiones.forEach(d => d.habilidades.forEach(h => { m[h.id] = d.nombre }))
    return m
  }, [dimensiones])

  const habMap = useMemo(() => {
    const m = {}
    dimensiones.forEach(d => d.habilidades.forEach(h => { m[h.id] = h }))
    return m
  }, [dimensiones])

  const habsSel = [...seleccionadas].map(id => habMap[id]).filter(Boolean)

  const toggleHab = (id) => {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /* Crear taller en el backend. Queda en `planned`: se activa desde Planeación.
     Si falla al agregar alguna habilidad, el taller ya existe: al reintentar solo se completan las que faltan. */
  const crearTaller = async () => {
    if (guardando) return
    setGuardando(true)
    setErrorGuardar(null)
    try {
      let taller = tallerCreado
      if (!taller) {
        const evaluatorId = isAdmin ? evaluadorSelec : session?.saga?.professionalId
        if (!evaluatorId) throw new Error('No hay un tallerista responsable: tu cuenta aún no está enlazada con Saga.')
        const body = { evaluatorId: String(evaluatorId), name: nombre.trim() }
        // Inicio del día en Bogotá: así se puede tomar asistencia desde ese día
        if (fechaInicio) body.startsAt = startOfBogotaDay(fechaInicio)
        taller = await createWorkshop(body)
        setTallerCreado(taller)
      }
      const pendientes = [...seleccionadas].filter(id => !habsAgregadas.has(String(id)))
      const res = await Promise.allSettled(pendientes.map(skillId => addWorkshopSkill(taller.id, skillId)))
      const nuevas = new Set(habsAgregadas)
      const fallos = []
      res.forEach((r, i) => { if (r.status === 'fulfilled') nuevas.add(String(pendientes[i])); else fallos.push(r.reason?.message || 'Error') })
      setHabsAgregadas(nuevas)
      if (fallos.length) {
        throw new Error(`El taller «${taller.name}» se creó, pero no se pudieron agregar ${fallos.length} habilidad(es): ${fallos[0]}. Pulsa de nuevo para reintentar solo las que faltan.`)
      }
      navigate(returnPath)
    } catch (err) {
      setErrorGuardar(err.message || 'No se pudo crear el taller. Verifica los datos e intenta de nuevo.')
      setGuardando(false)
    }
  }

  const reiniciar = () => {
    setFase(1)
    setNombre('')
    setObjetivo('')
    setFechaInicio('')
    setOrigen('sonup')
    setSeleccionadas(new Set())
    setTallerCreado(null)
    setHabsAgregadas(new Set())
    setMomentoVal('cierre')
    setResponsable('tallerista')
    setRegla('reciente')
    setErrorGuardar(null)
  }

  const fase1Valida = nombre.trim().length >= 3 && (!isAdmin || evaluadorSelec !== '')

  return (
    <div className="hab-page">

      {/* ── Header ── */}
      <header className="hab-header">
        <div>
          <h1 className="hab-header__titulo">Habilidades, actividades y juegos</h1>
          <p className="hab-header__sub">Configura qué se trabaja, cómo se mide y cómo se integra con Aula-Up.</p>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="hab-stats">
        {[
          { icon: <LayersIcon />, valor: cargandoHabs ? '…' : String(categorias.length), label: 'Categorías de habilidades' },
          { icon: <StarIcon />,   valor: cargandoHabs ? '…' : String(habilidadesDB.length), label: 'Habilidades disponibles' },
          { icon: <RouteIcon />,  valor: '2',          label: 'Orígenes de evaluación' },
          { icon: <TrendIcon />,  valor: 'Individual', label: 'Historial por joven'    },
        ].map((s, i) => (
          <div key={i} className="hab-stat">
            <div className="hab-stat__icono">{s.icon}</div>
            <div>
              <p className="hab-stat__valor">{s.valor}</p>
              <p className="hab-stat__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gestión del árbol de habilidades (solo admin) ── */}
      {isAdmin && (
        <section className="hab-arbol">
          <button
            className="hab-arbol__header"
            onClick={() => setArbolAbierto(a => !a)}
            aria-expanded={arbolAbierto}
          >
            <div>
              <h2 className="hab-arbol__titulo">Gestionar árbol de habilidades</h2>
              <p className="hab-arbol__sub">Agrega nuevas categorías o habilidades al sistema</p>
            </div>
            <span className={`hab-arbol__chevron${arbolAbierto ? ' hab-arbol__chevron--open' : ''}`}>▾</span>
          </button>

          {arbolAbierto && (
            <div className="hab-arbol__body">
              {/* Nueva categoría */}
              <div className="hab-arbol__form">
                <h3 className="hab-arbol__form-titulo">Nueva categoría</h3>
                <div className="hab-campo">
                  <label className="hab-label">Nombre <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                  <input
                    className="hab-input" value={newCatNombre}
                    onChange={e => setNewCatNombre(e.target.value)}
                    placeholder="Ej: Artística"
                  />
                </div>
                <div className="hab-campo">
                  <label className="hab-label">Descripción</label>
                  <input
                    className="hab-input" value={newCatDesc}
                    onChange={e => setNewCatDesc(e.target.value)}
                    placeholder="Descripción opcional…"
                  />
                </div>
                {catError && <p className="hab-hint-error">{catError}</p>}
                <button
                  className="btn-arbol-crear"
                  onClick={handleCrearCat}
                  disabled={creandoCat || newCatNombre.trim().length < 2}
                >
                  {creandoCat ? 'Creando…' : 'Crear categoría'}
                </button>
              </div>

              {/* Nueva habilidad */}
              <div className="hab-arbol__form">
                <h3 className="hab-arbol__form-titulo">Nueva habilidad</h3>
                <div className="hab-campo">
                  <label className="hab-label">Categoría <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                  <select
                    className="hab-select" value={newSkillCatId}
                    onChange={e => setNewSkillCatId(e.target.value)}
                  >
                    <option value="">— Selecciona una categoría —</option>
                    {categorias.map(c => (
                      <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="hab-campo">
                  <label className="hab-label">Nombre <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                  <input
                    className="hab-input" value={newSkillNombre}
                    onChange={e => setNewSkillNombre(e.target.value)}
                    placeholder="Ej: Ritmo y coordinación"
                  />
                </div>
                {skillError && <p className="hab-hint-error">{skillError}</p>}
                <button
                  className="btn-arbol-crear"
                  onClick={handleCrearSkill}
                  disabled={creandoSkill || !newSkillCatId || newSkillNombre.trim().length < 2}
                >
                  {creandoSkill ? 'Creando…' : 'Crear habilidad'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Stepper ── */}
      <div className="hab-stepper" role="list">
        {PASOS.map(p => {
          const done   = fase > p.n
          const activo = fase === p.n
          return (
            <div
              key={p.n}
              className={['hab-paso', activo ? 'hab-paso--activo' : '', done ? 'hab-paso--done' : ''].filter(Boolean).join(' ')}
              role="listitem"
            >
              <div className={['hab-paso__circulo', activo ? '' : done ? 'hab-paso__circulo--done' : 'hab-paso__circulo--inactivo'].filter(Boolean).join(' ')}>
                {done ? <CheckIcon /> : p.n}
              </div>
              <div className="hab-paso__info">
                <span className={`hab-paso__titulo${(!activo && !done) ? ' hab-paso__titulo--inactivo' : ''}`}>{p.titulo}</span>
                <span className={`hab-paso__sub${(!activo && !done) ? ' hab-paso__sub--inactivo' : ''}`}>{p.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Fase 1: Actividad ── */}
      {fase === 1 && (
        <div className="hab-body">
          <div className="hab-form">
            <div className="hab-form__head">
              <h2 className="hab-form__titulo">Datos de la actividad</h2>
              <p className="hab-form__sub">
                Este registro podrá convertirse en{' '}
                <span className="hab-enlace">taller de Son-Up</span> o{' '}
                <span className="hab-enlace">configuración para Aula-Up</span>.
              </p>
            </div>

            {isAdmin && (
              <div className="hab-campo">
                <label className="hab-label">Tallerista responsable <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                <select
                  className="hab-select"
                  value={evaluadorSelec}
                  onChange={e => setEvaluadorSelec(e.target.value)}
                >
                  <option value="">— Selecciona un tallerista —</option>
                  {profesionales.map(p => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {(p.fullName ?? [p.firstName, p.lastName].filter(Boolean).join(' ')) || `Tallerista ${p.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="hab-fila-2">
              <div className="hab-campo">
                <label className="hab-label">Módulo formativo</label>
                <select className="hab-select" value={modulo} onChange={e => setModulo(e.target.value)}>
                  {MODULOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="hab-campo">
                <label className="hab-label">Grupo</label>
                <select className="hab-select" value={grupo} onChange={e => setGrupo(e.target.value)}>
                  {GRUPOS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="hab-campo">
              <label className="hab-label">Nombre de la actividad o juego <span style={{ color: 'var(--color-primary)' }}>*</span></label>
              <input
                type="text" className="hab-input" value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Secuencias de ritmo y memoria"
              />
              {nombre.trim().length > 0 && nombre.trim().length < 3 && (
                <p className="hab-hint-error">Mínimo 3 caracteres.</p>
              )}
            </div>

            <div className="hab-campo">
              <label className="hab-label">Fecha de inicio</label>
              <input
                type="date" className="hab-input"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="hab-campo">
              <label className="hab-label">Objetivo general</label>
              <textarea
                className="hab-textarea" value={objetivo} rows={4}
                onChange={e => setObjetivo(e.target.value)}
                placeholder="Describe el objetivo de la actividad..."
              />
            </div>

            <div className="hab-campo">
              <label className="hab-label">Origen del resultado</label>
              <div className="origen-grid">
                {ORIGENES.map(o => (
                  <button
                    key={o.id} type="button"
                    className={`origen-card${origen === o.id ? ' origen-card--sel' : ''}`}
                    onClick={() => setOrigen(o.id)}
                  >
                    <div className="origen-card__icono">{o.icon}</div>
                    <div className="origen-card__info">
                      <p className="origen-card__titulo">{o.titulo}</p>
                      <p className="origen-card__desc">{o.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="hab-aside">
            <p className="hab-aside__tag">RESPONSABILIDADES</p>
            <h3 className="hab-aside__titulo">Un criterio común, dos flujos distintos</h3>
            <hr className="hab-aside__sep" />
            <div className="hab-resp">
              <div className="hab-resp__item">
                <p className="hab-resp__titulo">Son-Up define</p>
                <p className="hab-resp__desc">Árbol de habilidades, escalas, ponderaciones e historial individual.</p>
              </div>
              <div className="hab-resp__item">
                <p className="hab-resp__titulo">Cada módulo define</p>
                <p className="hab-resp__desc">Su recorrido de evaluación y la forma de presentar sus actividades.</p>
              </div>
              <div className="hab-resp__item">
                <p className="hab-resp__titulo">Aula-Up entrega</p>
                <p className="hab-resp__desc">Actividad completada, porcentaje de progreso y resultado por habilidad.</p>
              </div>
            </div>
            <button
              className="btn-continuar-hab"
              disabled={!fase1Valida}
              onClick={() => setFase(2)}
            >
              Continuar a habilidades
            </button>
          </aside>
        </div>
      )}

      {/* ── Fase 2: Habilidades ── */}
      {fase === 2 && (
        <div className="hab-body">
          {cargandoHabs ? (
            <p style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
              Cargando habilidades…
            </p>
          ) : (
            <div className="dims-grid">
              {dimensiones.map(dim => (
                <div key={dim.id} className="dim-card">
                  <div className="dim-card__head">
                    <div className="dim-badge">{catCode(dim.nombre)}</div>
                    <div>
                      <p className="dim-card__nombre">{dim.nombre}</p>
                      {dim.desc && <p className="dim-card__desc">{dim.desc}</p>}
                    </div>
                  </div>
                  <ul className="dim-skills" role="list">
                    {dim.habilidades.map((h, idx) => {
                      const sel = seleccionadas.has(h.id)
                      return (
                        <li key={h.id} className={`dim-skill${idx < dim.habilidades.length - 1 ? ' dim-skill--sep' : ''}`}>
                          <button
                            type="button"
                            className={`dim-skill__check${sel ? ' dim-skill__check--sel' : ''}`}
                            onClick={() => toggleHab(h.id)}
                            aria-pressed={sel}
                            aria-label={`${sel ? 'Quitar' : 'Seleccionar'} ${h.nombre}`}
                          >
                            {sel && <CheckIcon />}
                          </button>
                          <div className="dim-skill__info">
                            <p className="dim-skill__nombre">{h.nombre}</p>
                            {h.desc && <p className="dim-skill__subdesc">{h.desc}</p>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
              {dimensiones.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
                  No hay habilidades registradas en el sistema.
                </p>
              )}
            </div>
          )}

          <aside className="hab-aside">
            <p className="hab-aside__tag">SELECCIÓN ACTUAL</p>
            <h3 className="hab-aside__titulo">
              {seleccionadas.size} habilidad{seleccionadas.size !== 1 ? 'es' : ''}
            </h3>
            <p className="hab-aside__hint">Estas habilidades serán visibles para el taller o juego.</p>
            <hr className="hab-aside__sep" />
            {habsSel.length === 0 ? (
              <p className="hab-aside__vacío">Ninguna habilidad seleccionada.</p>
            ) : (
              <ul className="sel-tags" role="list">
                {habsSel.map(h => (
                  <li key={h.id} className="sel-tag">
                    <span className="sel-tag__codigo">{catCode(dimMap[h.id] ?? '')}</span>
                    <span className="sel-tag__nombre">{h.nombre}</span>
                    <button type="button" className="sel-tag__quitar" onClick={() => toggleHab(h.id)} aria-label={`Quitar ${h.nombre}`}>×</button>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="btn-continuar-hab"
              disabled={seleccionadas.size === 0}
              onClick={() => setFase(3)}
            >
              Configurar medición
            </button>
          </aside>
        </div>
      )}

      {/* ── Fase 3: Medición ── */}
      {fase === 3 && (
        <div className="hab-body">
          <div className="med-card">
            <div className="med-card__head">
              <div>
                <h2 className="med-card__titulo">Escala para talleres</h2>
                <p className="med-card__sub">El tallerista conserva su flujo de evaluación por módulo.</p>
              </div>
              <span className="med-badge-sonup">Son-Up</span>
            </div>
            <div className="escala-grid">
              {ESCALA.map(e => (
                <div key={e.id} className="escala-item">
                  <span className={`escala-item__badge escala-item__badge--${e.id.toLowerCase()}`}>{e.id}</span>
                  <p className="escala-item__nombre">{e.nombre}</p>
                  <p className="escala-item__desc">{e.desc}</p>
                </div>
              ))}
            </div>
            <div className="hab-fila-2">
              <div className="hab-campo">
                <label className="hab-label">Momento de valoración</label>
                <select className="hab-select" value={momentoVal} onChange={e => setMomentoVal(e.target.value)}>
                  <option value="cierre">Al cierre de cada sesión</option>
                  <option value="inicio">Al inicio de la sesión</option>
                  <option value="actividad">Por actividad</option>
                </select>
              </div>
              <div className="hab-campo">
                <label className="hab-label">Responsable</label>
                <select className="hab-select" value={responsable} onChange={e => setResponsable(e.target.value)}>
                  <option value="tallerista">Tallerista del módulo</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="ambos">Tallerista y coordinador</option>
                </select>
              </div>
            </div>
            <div className="hab-campo">
              <label className="hab-label">Regla de actualización</label>
              <select className="hab-select" value={regla} onChange={e => setRegla(e.target.value)}>
                <option value="reciente">La valoración más reciente actualiza el estado</option>
                <option value="promedio">El promedio de sesiones actualiza el estado</option>
                <option value="mejor">La mejor valoración registrada se mantiene</option>
              </select>
            </div>
          </div>

          <aside className="hab-aside">
            <p className="hab-aside__tag">CONTRATO VISUAL · AULA-UP</p>
            <h3 className="hab-aside__titulo">Resultado esperado</h3>
            <p className="hab-aside__hint">Aula-Up define su experiencia, pero devuelve estos criterios comunes.</p>
            <div className="contrato-code">
              <div className="contrato-row">
                <span className="contrato-key">origin</span>
                <span className="contrato-val contrato-val--accent">{origen === 'sonup' ? 'son-up' : 'aula-up'}</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">workshop</span>
                <span className="contrato-val">{nombre || '—'}</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">skills</span>
                <span className="contrato-val contrato-val--accent">{seleccionadas.size} seleccionadas</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">moment</span>
                <span className="contrato-val contrato-val--teal">{momentoVal}</span>
              </div>
            </div>
            <button className="btn-continuar-hab" onClick={() => setFase(4)}>
              Ver resumen
            </button>
          </aside>
        </div>
      )}

      {/* ── Fase 4: Resumen ── */}
      {fase === 4 && (
        <div className="hab-body">
          <div className="resumen-card">
            <div className="resumen-card__head">
              <p className="resumen-card__tag">RESUMEN Y PUBLICACIÓN</p>
              <div className="resumen-card__title-row">
                <h2 className="resumen-card__titulo">{nombre}</h2>
                <span className="resumen-badge-origen">{origen === 'sonup' ? 'Taller Son-Up' : 'Juego Aula-Up'}</span>
              </div>
            </div>

            <div className="resumen-info-grid">
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Módulo</p>
                <p className="resumen-info-item__valor">{modulo}</p>
              </div>
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Grupo</p>
                <p className="resumen-info-item__valor">{grupo}</p>
              </div>
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Habilidades</p>
                <p className="resumen-info-item__valor">{seleccionadas.size} seleccionadas</p>
              </div>
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Fecha inicio</p>
                <p className="resumen-info-item__valor">{fechaInicio || 'Por definir'}</p>
              </div>
            </div>

            <div className="resumen-habs-section">
              <p className="resumen-habs-titulo">Habilidades que se trabajarán</p>
              <ul className="resumen-hab-list" role="list">
                {habsSel.map(h => (
                  <li key={h.id} className="resumen-hab-item">
                    <span className="resumen-hab-item__badge">{catCode(dimMap[h.id] ?? '')}</span>
                    <div className="resumen-hab-item__info">
                      <p className="resumen-hab-item__nombre">{h.nombre}</p>
                      {dimMap[h.id] && <p className="resumen-hab-item__sub">{dimMap[h.id]}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="resumen-footer">
              <TrendIcon />
              <p className="resumen-footer__texto">
                Esta configuración quedará disponible para registrar sesiones y seguimiento individual.
              </p>
            </div>
          </div>

          <aside className="hab-aside">
            <p className="hab-aside__tag">LISTO PARA CONTINUAR</p>
            <h3 className="hab-aside__titulo">Crear el taller</h3>
            <p className="hab-aside__hint">Revisa que todo esté en orden antes de publicar esta configuración.</p>
            <ul className="resumen-checks" role="list">
              <li className="resumen-check-item">
                <span className="resumen-check-item__icono"><CheckIcon /></span>
                <span className="resumen-check-item__texto">Datos de la actividad</span>
              </li>
              <li className="resumen-check-item">
                <span className="resumen-check-item__icono"><CheckIcon /></span>
                <span className="resumen-check-item__texto">{seleccionadas.size} habilidad{seleccionadas.size !== 1 ? 'es' : ''} seleccionada{seleccionadas.size !== 1 ? 's' : ''}</span>
              </li>
              <li className="resumen-check-item">
                <span className="resumen-check-item__icono"><CheckIcon /></span>
                <span className="resumen-check-item__texto">Medición configurada</span>
              </li>
            </ul>

            {errorGuardar && (
              <p className="hab-error">{errorGuardar}</p>
            )}

            <button
              className="btn-continuar-hab"
              onClick={crearTaller}
              disabled={guardando}
            >
              {guardando ? 'Creando taller…' : 'Crear taller con esta configuración'}
            </button>
            <button className="btn-rec-nueva" onClick={reiniciar} disabled={guardando}>
              Configurar otra actividad
            </button>
          </aside>
        </div>
      )}

    </div>
  )
}

export default Habilidades
