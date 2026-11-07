import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorkshops, getWorkshopSkills } from '../../../services/workshops.js'
import { getChildren }                      from '../../../services/children.js'
import { createAttendance }                 from '../../../services/attendances.js'
import { createEvaluation, getEvaluationScales } from '../../../services/evaluations.js'
import { getSkills, getSkillCategories }    from '../../../services/skills.js'
import CompartirModal                       from '../../../components/CompartirModal/CompartirModal.jsx'
import { createShareDocument }              from '../../../utils/share-document.js'
import './Talleres.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const FASES = [
  { n: 1, label: 'Publicación del taller'    },
  { n: 2, label: 'Toma de asistencia'        },
  { n: 3, label: 'Valoraciones y evidencias' },
]

const TITULOS = {
  1: { h: 'Publicación del taller',     sub: 'Define el tema, los objetivos y la actividad que desarrollarás.' },
  2: { h: 'Toma de asistencia',         sub: 'Registra quiénes participaron en la sesión publicada.' },
  3: { h: 'Valoraciones y evidencias',  sub: 'Valora los logros y adjunta evidencias de la actividad.' },
}

const toBogotaDateInput = (value) => {
  if (!value) return ''
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(value)).map(part => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

const toBogotaTimeInput = (value) => {
  if (!value) return ''
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(value)).map(part => [part.type, part.value])
  )
  return `${parts.hour}:${parts.minute}`
}

/* ─── Component ──────────────────────────────────────────────────────────── */

const Talleres = () => {
  const navigate = useNavigate()
  const [fase, setFase] = useState(1)
  const [guardando, setGuardando] = useState(false)

  /* Vista */
  const [vista, setVista]           = useState('lista')
  const [talleres, setTalleres]     = useState([])
  const [cargando, setCargando]     = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [tallerActivo, setTallerActivo] = useState(null)

  /* Fase 1 */
  const [sesion, setSesion] = useState({
    taller: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    tema: '',
    objetivo: '',
    pasos: [],
    materiales: [],
  })

  /* Datos reales */
  const [estudiantes,        setEstudiantes]        = useState([])
  const [habilidadesTaller,  setHabilidadesTaller]  = useState([])
  const [escalas,            setEscalas]            = useState([])
  const [asistenciasIds,     setAsistenciasIds]     = useState({})
  const [cargandoDatos,      setCargandoDatos]      = useState(false)
  const [errorDatosTaller,   setErrorDatosTaller]   = useState('')
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)
  const [mostrarCompartirSesion, setMostrarCompartirSesion] = useState(false)
  const [archivoResumenSesion, setArchivoResumenSesion] = useState(null)

  /* Fase 2 */
  const [asistencia, setAsistencia] = useState({})

  /* Fase 3 */
  const [participanteActivo, setParticipanteActivo] = useState(null)
  const [valoraciones,       setValoraciones]       = useState({})
  const [observacion,        setObservacion]        = useState('')
  const [evidencias,         setEvidencias]         = useState([])
  const inputEvidencias = useRef(null)

  useEffect(() => {
    const evaluatorId = import.meta.env.VITE_EVALUATOR_ID
    getWorkshops(evaluatorId ? { evaluatorId } : {})
      .then(setTalleres)
      .catch(() => setErrorCarga(true))
      .finally(() => setCargando(false))
  }, [])

  const cargarDatosTaller = async (taller) => {
    setTallerActivo(taller)
    setSesion({
      taller: taller.name,
      fecha: toBogotaDateInput(taller.startsAt),
      horaInicio: toBogotaTimeInput(taller.startsAt),
      horaFin: toBogotaTimeInput(taller.endsAt),
      tema: '',
      objetivo: '',
      pasos: [],
      materiales: [],
    })
    setVista('form')
    setCargandoDatos(true)
    setErrorDatosTaller('')
    try {
      const [kids, workshopSkills, allSkills, categorias, escs] = await Promise.all([
        getChildren(),
        getWorkshopSkills(taller.id),
        getSkills(),
        getSkillCategories(),
        getEvaluationScales(),
      ])
      // Enriquecer workshop_skills con nombre de habilidad y categoría
      const habs = workshopSkills.map(ws => {
        const skill = allSkills.find(s => s.id === ws.skillId)
        const cat   = categorias.find(c => c.id === skill?.skillCategoryId)
        return { ...ws, skillNombre: skill?.name ?? `Habilidad ${ws.skillId}`, catId: cat?.id ?? 'sin-cat', catNombre: cat?.name ?? 'Habilidades' }
      })
      setHabilidadesTaller(habs)
      setEscalas([...escs].sort((a, b) => a.numValue - b.numValue))
      const normalizedKids = kids.map(k => ({ ...k, childId: String(k.id ?? k.childId) }))
      setEstudiantes(normalizedKids)
      setAsistencia(Object.fromEntries(normalizedKids.map(k => [k.childId, true])))
      setParticipanteActivo(normalizedKids[0]?.childId ?? null)
    } catch (error) {
      setErrorDatosTaller(`No se pudieron cargar los datos del taller: ${error.message}`)
    } finally {
      setCargandoDatos(false)
    }
  }

  /* Fase 1 helpers */
  const [nuevoPaso,     setNuevoPaso]     = useState('')
  const [nuevoMaterial, setNuevoMaterial] = useState('')

  const agregarPaso = () => {
    if (!nuevoPaso.trim()) return
    setSesion(s => ({ ...s, pasos: [...s.pasos, nuevoPaso.trim()] }))
    setNuevoPaso('')
  }
  const eliminarPaso = i =>
    setSesion(s => ({ ...s, pasos: s.pasos.filter((_, idx) => idx !== i) }))
  const agregarMaterial = () => {
    if (!nuevoMaterial.trim()) return
    setSesion(s => ({ ...s, materiales: [...s.materiales, nuevoMaterial.trim()] }))
    setNuevoMaterial('')
  }
  const eliminarMaterial = i =>
    setSesion(s => ({ ...s, materiales: s.materiales.filter((_, idx) => idx !== i) }))

  /* Fase 2 helpers */
  const presentes     = Object.values(asistencia).filter(Boolean).length
  const total         = estudiantes.length
  const pctAsistencia = total > 0 ? Math.round((presentes / total) * 100) : 0

  const toggleAsistencia = (id, val) => setAsistencia(a => ({ ...a, [id]: val }))

  const guardarAsistencia = async () => {
    setGuardandoAsistencia(true)
    try {
      const attendedAt = sesion.fecha && sesion.horaInicio
        ? `${sesion.fecha}T${sesion.horaInicio}:00-05:00`
        : new Date().toISOString()
      const attending = Object.entries(asistencia).filter(([, asistio]) => asistio)
      const results = await Promise.allSettled(
        attending.map(([childId]) =>
          createAttendance({ studentId: childId, workshopId: tallerActivo.id, attendedAt })
        )
      )
      const ids = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') ids[attending[i][0]] = r.value.id
      })
      setAsistenciasIds(ids)
    } catch { /* continúa igual */ } finally {
      setGuardandoAsistencia(false)
      setFase(3)
    }
  }

  /* Fechas */
  const fechaDisplay = sesion.fecha
    ? new Date(sesion.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'
  const fechaCorta = sesion.fecha
    ? new Date(sesion.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long',
      })
    : '—'
  const [tallerNombre, tallerGrupo = ''] = sesion.taller.split(' · ')
  const familyRecipients = estudiantes
    .filter(student => asistenciasIds[student.childId])
    .map(student => ({
      id: student.childId,
      name: [student.firstName, student.lastName].filter(Boolean).join(' ') || `Estudiante ${student.childId}`,
    }))

  /* Fase 3 helpers */
  const dimensionesReales = (() => {
    const grupos = {}
    habilidadesTaller.forEach(ws => {
      if (!grupos[ws.catId]) grupos[ws.catId] = { nombre: ws.catNombre, habilidades: [] }
      grupos[ws.catId].habilidades.push({ id: ws.id, nombre: ws.skillNombre })
    })
    return Object.values(grupos)
  })()

  const getVal = (pId, wsId) => valoraciones[`${pId}-${wsId}`] ?? null
  const setVal = (pId, wsId, v) =>
    setValoraciones(prev => ({ ...prev, [`${pId}-${wsId}`]: v }))

  const statusParticipante = (pId) => {
    const valorados = habilidadesTaller.filter(ws => getVal(pId, ws.id)).length
    const total_hab = habilidadesTaller.length
    if (valorados === 0)        return 'Sin empezar'
    if (valorados === total_hab) return 'Completo'
    return `${valorados} de ${total_hab} valorados`
  }

  const guardarValoraciones = async () => {
    setGuardando(true)
    try {
      const promises = Object.entries(valoraciones)
        .filter(([, scaleId]) => scaleId)
        .map(([key, scaleId]) => {
          const [childId, workshopSkillId] = key.split('-')
          const attendanceId = asistenciasIds[childId]
          if (!attendanceId) return null
          return createEvaluation({
            workshopAttendanceId: attendanceId,
            workshopSkillId,
            evaluationScaleId: scaleId,
          })
        })
        .filter(Boolean)
      await Promise.allSettled(promises)
    } finally {
      setGuardando(false)
      navigate('/tallerista/inicio')
    }
  }

  const agregarEvidencias = (e) => {
    const files = Array.from(e.target.files)
    setEvidencias(prev => [...prev, ...files])
    e.target.value = ''
  }
  const quitarEvidencia = (i) => setEvidencias(prev => prev.filter((_, idx) => idx !== i))

  /* ── Stepper ── */
  const Stepper = () => (
    <div className="stepper" role="list">
      {FASES.map(f => {
        const done   = fase > f.n
        const active = fase === f.n
        return (
          <div
            key={f.n}
            className={[
              'stepper__paso',
              active ? 'stepper__paso--activo' : '',
              done   ? 'stepper__paso--done'   : '',
            ].filter(Boolean).join(' ')}
            role="listitem"
          >
            <div className="stepper__circulo">
              {done ? <CheckIcon /> : f.n}
            </div>
            <div className="stepper__info">
              <span className="stepper__fase">FASE {f.n}</span>
              <span className="stepper__nombre">{f.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  /* ─── Vista: lista de talleres ─── */
  if (vista === 'lista') {
    const STATUS_LABEL = { active: 'Activo', planned: 'Pendiente de iniciar', finished: 'Finalizado', cancelled: 'Cancelado' }
    return (
      <div className="talleres-page">
        <header className="talleres-header">
          <div>
            <h1 className="talleres-titulo">Mis talleres</h1>
            <p className="talleres-sub">Selecciona un taller activo para registrar una sesión.</p>
          </div>
        </header>

        {cargando && <p className="talleres-estado">Cargando talleres…</p>}
        {errorCarga && <p className="talleres-estado talleres-estado--error">No se pudieron cargar los talleres.</p>}
        {!cargando && !errorCarga && talleres.length === 0 && (
          <p className="talleres-estado">No tienes talleres asignados.</p>
        )}

        {!cargando && !errorCarga && talleres.length > 0 && (
          <ul className="talleres-lista" role="list">
            {talleres.map(t => {
              const activo = t.status === 'active'
              return (
                <li key={t.id} className={`taller-item${activo ? '' : ' taller-item--inactivo'}`}>
                  <div className="taller-item__info">
                    <h3 className="taller-item__nombre">{t.name}</h3>
                    <span className={`taller-badge taller-badge--${t.status}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>
                  {activo ? (
                    <button
                      className="btn-publicar btn-publicar--sm"
                      onClick={() => cargarDatosTaller(t)}
                    >
                      Registrar sesión
                    </button>
                  ) : (
                    <span className="taller-no-activo">
                      {t.status === 'planned' ? 'Pendiente de iniciar' : '—'}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  /* ─────────────────────────────────────────── RENDER ─── */
  return (
    <div className="talleres-page">

      {/* ── Header ── */}
      <header className="talleres-header">
        <div>
          <button className="btn-volver btn-volver--header" onClick={() => { setVista('lista'); setFase(1) }}>
            ← Volver a mis talleres
          </button>
          <h1 className="talleres-titulo">{TITULOS[fase].h}</h1>
          <p className="talleres-sub">{TITULOS[fase].sub}</p>
        </div>
        {fase === 3 && (
          <div className="talleres-header__acciones">
            <button
              className="btn-finalizar"
              onClick={() => {
                const titulo = `Resumen de clase: ${sesion.tema || tallerActivo?.name || 'Taller'}`
                setArchivoResumenSesion(createShareDocument({
                  title: titulo,
                  subtitle: `${tallerActivo?.name || sesion.taller} · ${fechaDisplay}`,
                  sections: [
                    {
                      title: 'Datos de la sesión',
                      rows: [
                        ['Taller', tallerActivo?.name || sesion.taller],
                        ['Fecha', fechaDisplay],
                        ['Tema', sesion.tema || 'Sin tema registrado'],
                      ],
                      paragraphs: [sesion.objetivo || 'Sin objetivo registrado'],
                    },
                    { title: 'Actividades realizadas', items: sesion.pasos },
                    { title: 'Materiales', items: sesion.materiales },
                  ],
                }))
                setMostrarCompartirSesion(true)
              }}
            >
              Compartir con familias
            </button>
          </div>
        )}
      </header>
      {errorDatosTaller && (
        <p className="talleres-estado talleres-estado--error" role="alert">{errorDatosTaller}</p>
      )}

      {/* ── Stepper ── */}
      <Stepper />

      {/* ── Body ── */}
      <div className={`talleres-body${fase === 3 ? ' talleres-body--val' : ''}`}>

        {/* ════════════════════ FASE 1 ════════════════════ */}
        {fase === 1 ? (
          <>
            <div className="sesion-form">
              <div className="sesion-form__head">
                <div>
                  <h2 className="sesion-form__titulo">Datos de la sesión</h2>
                  <p className="sesion-form__sub">Información que verá el equipo y las familias.</p>
                </div>
                <span className="tag-borrador">Borrador</span>
              </div>

              <div className="form-fila-4">
                <div className="form-campo">
                  <label className="form-label">Taller</label>
                  <input className="form-input" value={tallerActivo?.name || sesion.taller} readOnly />
                </div>
                <div className="form-campo">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-input" value={sesion.fecha}
                    onChange={e => setSesion(s => ({ ...s, fecha: e.target.value }))} />
                </div>
                <div className="form-campo">
                  <label className="form-label">Hora de inicio</label>
                  <input type="time" className="form-input" value={sesion.horaInicio}
                    onChange={e => setSesion(s => ({ ...s, horaInicio: e.target.value }))} />
                </div>
                <div className="form-campo">
                  <label className="form-label">Hora de fin</label>
                  <input type="time" className="form-input" value={sesion.horaFin}
                    onChange={e => setSesion(s => ({ ...s, horaFin: e.target.value }))} />
                </div>
              </div>

              <div className="form-campo">
                <label className="form-label">Tema de la clase</label>
                <input type="text" className="form-input" value={sesion.tema}
                  onChange={e => setSesion(s => ({ ...s, tema: e.target.value }))}
                  placeholder="Ej: Ritmo con palmas y tambor" />
              </div>

              <div className="form-campo">
                <label className="form-label">Objetivo</label>
                <textarea className="form-textarea" value={sesion.objetivo} rows={3}
                  onChange={e => setSesion(s => ({ ...s, objetivo: e.target.value }))} />
              </div>

              <div className="actividad">
                <div className="actividad__head">
                  <span className="actividad__titulo">Actividad desarrollada</span>
                  <span className="actividad__sub">En el orden en que se hizo</span>
                </div>
                <ol className="actividad__lista" role="list">
                  {sesion.pasos.map((paso, i) => (
                    <li key={i} className="actividad__item">
                      <span className="actividad__num">{i + 1}</span>
                      <span className="actividad__texto">{paso}</span>
                      <button className="actividad__del" onClick={() => eliminarPaso(i)}
                        aria-label={`Eliminar paso ${i + 1}`}>×</button>
                    </li>
                  ))}
                </ol>
                <div className="actividad__nuevo">
                  <input className="form-input" placeholder="Escribir nuevo paso..."
                    value={nuevoPaso} onChange={e => setNuevoPaso(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregarPaso()} />
                  <button className="btn-agregar-paso" onClick={agregarPaso}>+ Agregar paso</button>
                </div>
              </div>

              <div className="materiales">
                <span className="form-label">Materiales</span>
                <div className="materiales__chips">
                  {sesion.materiales.map((m, i) => (
                    <span key={i} className="chip">
                      {m}
                      <button className="chip__del" onClick={() => eliminarMaterial(i)}
                        aria-label={`Quitar ${m}`}>×</button>
                    </span>
                  ))}
                </div>
                <input className="form-input form-input--sm"
                  placeholder="Agregar material y presionar Enter..."
                  value={nuevoMaterial} onChange={e => setNuevoMaterial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarMaterial()} />
              </div>
            </div>

            <aside className="vista-previa">
              <p className="vista-previa__tag">VISTA PREVIA</p>
              <h3 className="vista-previa__titulo">{sesion.tema || 'Sin título'}</h3>
              <p className="vista-previa__taller">{sesion.taller}</p>
              <hr className="vista-previa__sep" />
              <div className="vista-previa__datos">
                <div className="vp-fila">
                  <span className="vp-label">Fecha</span>
                  <span className="vp-valor">{fechaDisplay}</span>
                </div>
                <div className="vp-fila">
                  <span className="vp-label">Horario</span>
                  <span className="vp-valor vp-valor--teal">{sesion.horaInicio}–{sesion.horaFin}</span>
                </div>
                <div className="vp-fila">
                  <span className="vp-label">Participantes</span>
                  <span className="vp-valor vp-valor--teal">{total} inscritos</span>
                </div>
              </div>
              <button className="btn-publicar" onClick={() => setFase(2)}>
                Publicar y continuar a asistencia
              </button>
            </aside>
          </>

        /* ════════════════════ FASE 2 ════════════════════ */
        ) : fase === 2 ? (
          <>
            <div className="asistencia-card">
              <div className="asistencia-card__head">
                <div>
                  <h2 className="asistencia-card__titulo">Lista del grupo</h2>
                  <p className="asistencia-card__sub">
                    {tallerNombre} · Grupo {tallerGrupo.toLowerCase()} · {fechaCorta}
                  </p>
                </div>
                <span className="asistencia-card__contador">{presentes} de {total} presentes</span>
              </div>
              <ul className="asistencia-lista" role="list">
                {cargandoDatos ? (
                  <li className="asistencia-cargando">Cargando participantes…</li>
                ) : estudiantes.length === 0 ? (
                  <li className="asistencia-cargando">No hay participantes disponibles.</li>
                ) : estudiantes.map(p => {
                  const nombre   = [p.firstName, p.lastName].filter(Boolean).join(' ') || `Estudiante ${p.childId}`
                  const iniciales = nombre.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
                  return (
                    <li key={p.childId} className="asistencia-item">
                      <div className="asistencia-avatar">{iniciales}</div>
                      <span className="asistencia-nombre">{nombre}</span>
                      <div className="asistencia-toggle">
                        <button
                          className={`toggle-btn${asistencia[p.childId] ? ' toggle-btn--asistio' : ''}`}
                          onClick={() => toggleAsistencia(p.childId, true)}
                        >Asistió</button>
                        <button
                          className={`toggle-btn${!asistencia[p.childId] ? ' toggle-btn--ausente' : ''}`}
                          onClick={() => toggleAsistencia(p.childId, false)}
                        >No asistió</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <aside className="resumen">
              <div className="resumen__circulo">{presentes}</div>
              <p className="resumen__titulo">Participantes presentes</p>
              <p className="resumen__sub">
                {total - presentes} {total - presentes === 1 ? 'ausente' : 'ausentes'} · {pctAsistencia}% de asistencia
              </p>
              <button className="btn-publicar" onClick={guardarAsistencia} disabled={guardandoAsistencia}>
                {guardandoAsistencia ? 'Registrando…' : 'Guardar y continuar a valoraciones'}
              </button>
            </aside>
          </>

        /* ════════════════════ FASE 3 ════════════════════ */
        ) : (
          <>
            {/* Sidebar participantes */}
            <aside className="val-sidebar">
              <p className="val-sidebar__titulo">PARTICIPANTES · {estudiantes.length}</p>
              <ul className="val-sidebar__lista" role="list">
                {estudiantes.map(p => {
                  const nombre   = [p.firstName, p.lastName].filter(Boolean).join(' ') || `Estudiante ${p.childId}`
                  const iniciales = nombre.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
                  const activo = p.childId === participanteActivo
                  return (
                    <li key={p.childId}>
                      <button
                        className={`val-participante${activo ? ' val-participante--activo' : ''}`}
                        onClick={() => setParticipanteActivo(p.childId)}
                      >
                        <div className={`val-participante__avatar${activo ? ' val-participante__avatar--activo' : ''}`}>
                          {iniciales}
                        </div>
                        <div className="val-participante__info">
                          <p className="val-participante__nombre">{nombre}</p>
                          <p className="val-participante__estado">{statusParticipante(p.childId)}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>

            {/* Contenido valoraciones */}
            <div className="val-contenido">

              {/* Cabecera del participante activo */}
              <div className="val-header">
                <h2 className="val-header__nombre">
                  {(() => {
                    const p = estudiantes.find(e => e.childId === participanteActivo)
                    return p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : ''
                  })()}
                </h2>
                <div className="val-leyenda">
                  {escalas.map(esc => (
                    <span key={esc.id} className="val-ley">{esc.code} · {esc.name.toUpperCase()}</span>
                  ))}
                </div>
              </div>

              {/* Dimensiones */}
              {dimensionesReales.length === 0 ? (
                <p className="talleres-estado">Este taller no tiene habilidades configuradas.</p>
              ) : dimensionesReales.map((dim, di) => {
                const valoradas = dim.habilidades.filter(h => getVal(participanteActivo, h.id)).length
                return (
                  <div key={di} className="val-dimension">
                    <div className="val-dimension__header">
                      <h3 className="val-dimension__titulo">{dim.nombre}</h3>
                      <span className="val-dimension__logrados">
                        {valoradas} de {dim.habilidades.length} valoradas
                      </span>
                    </div>
                    {dim.habilidades.map(h => {
                      const v = getVal(participanteActivo, h.id)
                      return (
                        <div key={h.id} className="val-indicador">
                          <p className="val-indicador__texto">{h.nombre}</p>
                          <div className="val-botones">
                            {escalas.map(esc => (
                              <button
                                key={esc.id}
                                className={`val-btn${v === esc.id ? ' val-btn--sel' : ''}`}
                                onClick={() => setVal(participanteActivo, h.id, v === esc.id ? null : esc.id)}
                                aria-label={esc.name}
                                aria-pressed={v === esc.id}
                              >
                                {esc.code}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Observación del grupo */}
              <div className="val-observacion">
                <h3 className="val-observacion__titulo">Observación del grupo</h3>
                <p className="val-observacion__label">¿Cómo le fue al grupo?</p>
                <textarea
                  className="form-textarea"
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  rows={4}
                  placeholder="Describe cómo fue la sesión para el grupo..."
                />
              </div>

              {/* Evidencias */}
              <div className="val-evidencias">
                <div className="val-evidencias__header">
                  <h3 className="val-evidencias__titulo">Evidencias de la actividad</h3>
                  <span className="badge-opcional">Opcional</span>
                </div>
                <p className="val-evidencias__aviso">
                  Adjunta fotos, videos o documentos autorizados.
                </p>
                <label className="val-upload" htmlFor="evidencias-input">
                  <UploadIcon />
                  <span className="val-upload__btn">Subir evidencias</span>
                  <input
                    id="evidencias-input"
                    ref={inputEvidencias}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                    onChange={agregarEvidencias}
                    className="val-upload__input"
                  />
                </label>
                {evidencias.length > 0 && (
                  <ul className="evidencias-lista">
                    {evidencias.map((f, i) => (
                      <li key={i} className="evidencia-item">
                        <span className="evidencia-nombre">{f.name}</span>
                        <button
                          className="evidencia-del"
                          onClick={() => quitarEvidencia(i)}
                          aria-label={`Quitar ${f.name}`}
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="val-evidencias__nota">
                  La imagen de quienes no tienen autorización no se publicará.
                </p>
              </div>

              {/* Navegación */}
              <div className="val-footer">
                <button className="btn-volver" onClick={() => setFase(2)}>
                  Volver a asistencia
                </button>
                <button
                  className="btn-publicar"
                  onClick={guardarValoraciones}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar valoraciones'}
                </button>
              </div>

            </div>
          </>
        )}

      </div>

      {/* ── Modal compartir resumen con familias ── */}
      <CompartirModal
        isOpen={mostrarCompartirSesion}
        onClose={() => setMostrarCompartirSesion(false)}
        title={`Resumen de clase: ${sesion.tema || tallerActivo?.name}`}
        tag="TALLER · SON UP"
        childId={familyRecipients[0]?.id}
        studentName={familyRecipients[0]?.name}
        recipientOptions={familyRecipients}
        attachmentFile={archivoResumenSesion}
        defaultSubject={`Resumen de la clase: ${sesion.tema || tallerActivo?.name}`}
        defaultMessage={`Estimadas familias,\n\nCompartimos el resumen de la sesión del taller "${tallerActivo?.name || sesion.taller}" realizada el ${fechaDisplay}:\n\nTema: ${sesion.tema}\nObjetivo: ${sesion.objetivo}\nActividades desarrolladas:\n${sesion.pasos.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}\n\n¡Gracias por su constante apoyo al proceso formativo!\n\nEquipo Son Up · Fundación Asisco`}
      />

    </div>
  )
}

export default Talleres
