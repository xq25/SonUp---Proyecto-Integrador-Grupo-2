import { useEffect, useMemo, useState } from 'react'
import { getChildren } from '../../../services/children.js'
import { getWorkshopSkills } from '../../../services/workshops.js'
import { getSkills, getSkillCategories } from '../../../services/skills.js'
import { createAttendance, updateAttendance, deleteAttendance } from '../../../services/attendances.js'
import { createSession, updateSession, startSession, finishSession, getSessionAttendances } from '../../../services/sessions.js'
import { createEvaluation, deleteEvaluation, getEvaluationScales, getAttendanceEvaluations } from '../../../services/evaluations.js'
import { createEvidence } from '../../../services/evidences.js'
import { isEvidenceType, guessEvidenceType } from '../../../utils/evidenceType.js'
import {
  toBogotaDateInput, toBogotaTimeInput, todayBogota, nombreDe, bogotaToISO, formatFecha, formatHora,
  stepsToText, textToSteps, materialsToText, textToMaterials,
} from '../../../utils/workshops.js'
import { isYoutubeUrl, toYoutubeEmbed } from '../../../utils/youtube.js'
import EvidenceTypeField from '../../../components/EvidenceTypeField/EvidenceTypeField.jsx'
import CompartirModal from '../../../components/CompartirModal/CompartirModal.jsx'
import { createShareDocument } from '../../../utils/share-document.js'
import './Talleres.css'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const FASES = [
  { n: 1, label: 'Datos de la sesión'        },
  { n: 2, label: 'Toma de asistencia'        },
  { n: 3, label: 'Valoraciones y evidencias' },
]

const TITULOS = {
  1: { h: 'Datos de la sesión',        sub: 'Define el tema, la fecha y hora de inicio, el objetivo y los materiales de la sesión.' },
  2: { h: 'Toma de asistencia',        sub: 'Registra quiénes participaron en la sesión.' },
  3: { h: 'Valoraciones y evidencias', sub: 'Valora los logros y adjunta evidencias de la actividad.' },
}

const Stepper = ({ fase }) => (
  <div className="stepper" role="list">
    {FASES.map(f => {
      const done   = fase > f.n
      const active = fase === f.n
      return (
        <div key={f.n} role="listitem"
          className={['stepper__paso', active ? 'stepper__paso--activo' : '', done ? 'stepper__paso--done' : ''].filter(Boolean).join(' ')}>
          <div className="stepper__circulo">{done ? <CheckIcon /> : f.n}</div>
          <div className="stepper__info">
            <span className="stepper__fase">PASO {f.n}</span>
            <span className="stepper__nombre">{f.label}</span>
          </div>
        </div>
      )
    })}
  </div>
)

const iniciales = (nombre) =>
  nombre.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()

/**
 * Taller activo: datos de la sesión (paso 1) → asistencia (paso 2) → valoraciones (paso 3) → finalizar sesión.
 * Props:
 *   session: WorkshopSession | null
 *     - null          → sesión nueva: formulario en blanco
 *     - 'planned'     → sesión por iniciar: se muestran sus datos para revisarlos y luego iniciarla
 *     - 'in_progress' → continuar: va directo al paso 2 (o al paso 1 con `modoEditar`)
 *   modoEditar: abre el paso 1 para corregir los datos de una sesión programada o en curso
 *   otraEnCurso: sesión del taller que ya está en curso (si es otra): impide iniciar esta
 *   onSesionFinalizada(): llamado tras finalizar la sesión (vuelve a la lista y recarga sesiones)
 */
const SesionTaller = ({ taller, session = null, modoEditar = false, otraEnCurso = null, onVolver, onSesionFinalizada }) => {
  const workshopId   = String(taller.id)

  const [sessionActual, setSessionActual] = useState(session)
  // Se deriva de la sesión guardada (no de la prop): tras iniciarla, el horario queda fijo
  const estaEnCurso  = sessionActual?.status === 'in_progress'
  const esNueva      = !sessionActual?.id
  const [fase, setFase]                   = useState(session?.status === 'in_progress' && !modoEditar ? 2 : 1)

  /* ── Datos cargados ── */
  const [estudiantes, setEstudiantes] = useState([])
  const [habilidades, setHabilidades] = useState([])
  const [escalas, setEscalas]         = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [cargando, setCargando]       = useState(true)
  const [errorCarga, setErrorCarga]   = useState('')

  /* ── Paso 1 ── */
  const [sesion, setSesion] = useState(() => {
    const hoy = todayBogota()
    if (session) {
      return {
        fecha:      toBogotaDateInput(session.startsAt) || hoy,
        horaInicio: session.startsAt ? toBogotaTimeInput(new Date(session.startsAt)) : toBogotaTimeInput(new Date()),
        tema:       session.topic     || '',
        objetivo:   session.objective || '',
        pasos:      textToSteps(session.steps),
        materiales: textToMaterials(session.materials),
      }
    }
    // Sesión nueva: todo en blanco; solo se sugiere la fecha (hoy, o el inicio del taller si es futuro)
    const inicio = toBogotaDateInput(taller.startsAt)
    return {
      fecha:      inicio && inicio > hoy ? inicio : hoy,
      horaInicio: '',
      tema:       '',
      objetivo:   '',
      pasos:      [],
      materiales: [],
    }
  })
  const [nuevoPaso, setNuevoPaso]           = useState('')
  const [nuevoMaterial, setNuevoMaterial]   = useState('')
  const [continuando, setContinuando]       = useState(false)
  const [errorContinuar, setErrorContinuar] = useState('')

  /* ── Paso 2 ── */
  const [asistenciaLocal, setAsistenciaLocal]   = useState({})    // childId → bool override
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)
  const [erroresAsistencia, setErroresAsistencia]     = useState([])

  /* ── Paso 3: valoraciones ── */
  const [participanteActivo, setParticipanteActivo] = useState(null)
  const [vals, setVals]           = useState({})
  const [originales, setOriginales] = useState({})
  const [evalCargadas, setEvalCargadas] = useState({})
  const [guardandoVal, setGuardandoVal] = useState(false)
  const [resultadoVal, setResultadoVal] = useState(null)
  const [observacion, setObservacion]           = useState('')
  const [observacionGuardada, setObservacionGuardada] = useState('')

  /* ── Evidencias ── */
  const [evi, setEvi]           = useState({ url: '', title: '', type: '' })
  const [tipoManual, setTipoManual] = useState(false)
  const [eviEstudiantes, setEviEstudiantes] = useState({})
  const [subiendoEvi, setSubiendoEvi]       = useState(false)
  const [errorEvi, setErrorEvi]             = useState('')
  const [erroresCampoEvi, setErroresCampoEvi] = useState({})
  const [eviSubidas, setEviSubidas]         = useState([])

  /* ── Finalizar sesión ── */
  const [confirmandoFin, setConfirmandoFin] = useState(false)
  const [finalizando, setFinalizando]       = useState(false)
  const [errorFin, setErrorFin]             = useState('')
  const [fin, setFin]                       = useState({ fecha: '', hora: '' })   // hora real de fin (Bogotá)
  const [mostrarCompartir, setMostrarCompartir] = useState(false)
  const [archivoResumen, setArchivoResumen] = useState(null)

  /* ── Carga inicial ── */
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const promises = [
          getChildren(), getWorkshopSkills(workshopId),
          getSkills(), getSkillCategories(), getEvaluationScales(),
        ]
        if (estaEnCurso && session?.id) promises.push(getSessionAttendances(session.id))
        const results = await Promise.all(promises)
        const [kids, wSkills, allSkills, cats, escs] = results
        const atts = results[5] ?? []
        if (!vivo) return
        setHabilidades(wSkills.map(ws => {
          const skill = allSkills.find(s => String(s.id) === String(ws.skillId))
          const cat   = cats.find(c => String(c.id) === String(skill?.skillCategoryId))
          return {
            ...ws, id: String(ws.id),
            skillNombre: skill?.name ?? `Habilidad ${ws.skillId}`,
            catId: String(cat?.id ?? 'sin-cat'), catNombre: cat?.name ?? 'Habilidades',
          }
        }))
        setEscalas([...escs].sort((a, b) => a.numValue - b.numValue))
        setEstudiantes(kids.map(k => ({ ...k, childId: String(k.id ?? k.childId) })))
        setAsistencias(atts.map(a => ({ ...a, id: String(a.id), studentId: String(a.studentId) })))
      } catch (err) {
        if (vivo) setErrorCarga(`No se pudieron cargar los datos: ${err.message}`)
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [workshopId])   // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Mapa studentId → attendance ── */
  const attendanceByStudent = useMemo(() => {
    const m = {}
    asistencias.forEach(a => { m[String(a.studentId)] = a })
    return m
  }, [asistencias])

  const isPresente = (childId) =>
    asistenciaLocal[childId] !== undefined ? asistenciaLocal[childId] : Boolean(attendanceByStudent[String(childId)])

  const presentesLista    = estudiantes.filter(e => isPresente(e.childId))
  const totalPresentes    = presentesLista.length
  const total             = estudiantes.length
  const pct               = total > 0 ? Math.round((totalPresentes / total) * 100) : 0
  const porRegistrar      = estudiantes.filter(e =>  isPresente(e.childId) && !attendanceByStudent[String(e.childId)])
  const porEliminar       = estudiantes.filter(e => !isPresente(e.childId) &&  attendanceByStudent[String(e.childId)])
  const hayPendientesAsis = porRegistrar.length > 0 || porEliminar.length > 0

  /* ── Paso 1 ── */
  const agregarPaso     = () => { if (nuevoPaso.trim()) { setSesion(s => ({ ...s, pasos: [...s.pasos, nuevoPaso.trim()] })); setNuevoPaso('') } }
  const agregarMaterial = () => { if (nuevoMaterial.trim()) { setSesion(s => ({ ...s, materiales: [...s.materiales, nuevoMaterial.trim()] })); setNuevoMaterial('') } }

  const inicioISO = bogotaToISO(sesion.fecha, sesion.horaInicio)
  const esFuturo  = inicioISO ? new Date(inicioISO) > new Date() : false
  const fechaMin  = toBogotaDateInput(taller.startsAt) || undefined
  const temaValido = sesion.tema.trim().length >= 2

  /** Pone fecha y hora actuales (para dictar ya una sesión programada para más tarde). */
  const usarAhora = () => {
    const ahora = new Date()
    setSesion(s => ({ ...s, fecha: toBogotaDateInput(ahora), horaInicio: toBogotaTimeInput(ahora) }))
    setErrorContinuar('')
  }

  /** Por qué no se puede iniciar ahora (null si sí se puede). */
  const motivoNoIniciar = estaEnCurso ? null
    : otraEnCurso ? `Ya hay una sesión en curso en este taller («${otraEnCurso.topic}»). Finalízala primero.`
    : esFuturo ? `La hora de inicio todavía no llega (${formatFecha(inicioISO)}, ${formatHora(inicioISO)}). Si la sesión se dicta ahora, usa la fecha y hora actuales.`
    : null

  /** Cuerpo de la sesión para la API. Incluye el paso o material escrito y aún no agregado. */
  const cuerpoSesion = () => {
    const pasos      = [...sesion.pasos, nuevoPaso.trim()].filter(Boolean)
    const materiales = [...sesion.materiales, nuevoMaterial.trim()].filter(Boolean)
    if (nuevoPaso.trim() || nuevoMaterial.trim()) {
      setSesion(s => ({ ...s, pasos, materiales }))
      setNuevoPaso(''); setNuevoMaterial('')
    }
    // Vacío se envía como "": la API lo guarda como null (así también se borra un campo)
    return {
      topic:     sesion.tema.trim(),
      objective: sesion.objetivo.trim(),
      steps:     stepsToText(pasos),
      materials: materialsToText(materiales),
    }
  }

  const cargarAsistenciasDe = async (sessId) => {
    const atts = await getSessionAttendances(sessId)
    setAsistencias(atts.map(a => ({ ...a, id: String(a.id), studentId: String(a.studentId) })))
  }

  /**
   * Guarda la sesión y, si `iniciar`, la inicia y pasa a la asistencia.
   * Sin `iniciar` solo la deja programada y vuelve a la lista.
   */
  const continuar = async (iniciar) => {
    if (!temaValido) {
      setErrorContinuar('El tema es obligatorio (mínimo 2 caracteres).')
      return
    }
    if (!estaEnCurso && !inicioISO) {
      setErrorContinuar('Completa la fecha y la hora de inicio.')
      return
    }
    if (iniciar && motivoNoIniciar) {
      setErrorContinuar(motivoNoIniciar)
      return
    }
    setContinuando(true)
    setErrorContinuar('')
    try {
      const body = cuerpoSesion()

      let sess = sessionActual
      if (estaEnCurso) {
        // En curso: solo el contenido (la hora de inicio ya es fija; enviarla daría 409)
        sess = await updateSession(sess.id, body)
        setSessionActual(sess)
        await cargarAsistenciasDe(sess.id)
        setFase(2)
        return
      }

      body.startsAt = inicioISO
      sess = sess?.id ? await updateSession(sess.id, body) : await createSession(workshopId, body)
      // Se guarda ya: si iniciar falla (409), el reintento edita esta misma sesión en vez de crear otra
      setSessionActual(sess)

      if (!iniciar) {
        onVolver()
        return
      }

      sess = await startSession(sess.id)
      setSessionActual(sess)
      await cargarAsistenciasDe(sess.id)
      setFase(2)
    } catch (err) {
      setErrorContinuar(err.message)
    } finally {
      setContinuando(false)
    }
  }

  /* ── Paso 2 ── */
  const guardarAsistencia = async () => {
    setGuardandoAsistencia(true)
    setErroresAsistencia([])
    const sessId = String(sessionActual.id)
    const res = await Promise.allSettled([
      ...porRegistrar.map(e => createAttendance({ sessionId: sessId, studentId: e.childId })),
      ...porEliminar.map(e => deleteAttendance(attendanceByStudent[String(e.childId)].id)),
    ])
    const nuevas = []
    const eliminadasIds = new Set()
    const fallos = []

    porRegistrar.forEach((e, i) => {
      const r = res[i]
      if (r.status === 'fulfilled') {
        nuevas.push({ ...r.value, id: String(r.value.id), studentId: String(r.value.studentId ?? e.childId) })
      } else {
        fallos.push({ nombre: nombreDe(e, `Estudiante ${e.childId}`), mensaje: r.reason?.message || 'Error' })
      }
    })
    porEliminar.forEach((e, i) => {
      const r = res[porRegistrar.length + i]
      if (r.status === 'fulfilled') {
        eliminadasIds.add(attendanceByStudent[String(e.childId)].id)
      } else {
        fallos.push({ nombre: nombreDe(e, `Estudiante ${e.childId}`), mensaje: r.reason?.message || 'Error al desmarcar' })
      }
    })

    const asistenciasActualizadas = [
      ...asistencias.filter(a => !eliminadasIds.has(a.id)),
      ...nuevas,
    ]
    setAsistencias(asistenciasActualizadas)
    setAsistenciaLocal({})
    setErroresAsistencia(fallos)
    setGuardandoAsistencia(false)
    if (fallos.length === 0) await irAValoraciones(asistenciasActualizadas)
  }

  const irAValoraciones = async (todasAtts = null) => {
    const atts = todasAtts ?? Object.values(attendanceByStudent)
    const sinCargar = atts.filter(a => !evalCargadas[a.id])
    const res = await Promise.allSettled(sinCargar.map(a => getAttendanceEvaluations(a.id)))
    const guardadas = {}
    const cargadas  = {}
    res.forEach((r, i) => {
      cargadas[sinCargar[i].id] = true
      if (r.status !== 'fulfilled') return
      r.value.forEach(ev => {
        guardadas[clave(sinCargar[i].studentId, ev.workshopSkillId)] = String(ev.evaluationScaleId)
      })
    })
    setEvalCargadas(prev => ({ ...prev, ...cargadas }))
    setOriginales(prev => ({ ...prev, ...guardadas }))
    setVals(prev => ({ ...guardadas, ...prev }))
    const obs = [...new Set(atts.map(a => a.observation).filter(Boolean))]
    if (obs.length === 1 && !observacion) { setObservacion(obs[0]); setObservacionGuardada(obs[0]) }
    setFase(3)
  }

  /* ── Paso 3: valoraciones ── */
  const clave  = (childId, wsId) => `${childId}|${wsId}`
  const getVal = (childId, wsId) => vals[clave(childId, wsId)] ?? null
  const setVal = (childId, wsId, v) => setVals(prev => ({ ...prev, [clave(childId, wsId)]: v }))

  const activoId = presentesLista.some(e => e.childId === participanteActivo)
    ? participanteActivo
    : presentesLista[0]?.childId ?? null

  const estadoParticipante = (childId) => {
    const n = habilidades.filter(ws => getVal(childId, ws.id)).length
    if (n === 0) return 'Sin empezar'
    if (n === habilidades.length) return 'Completo'
    return `${n} de ${habilidades.length} valoradas`
  }

  const pendientesDeGuardar = Object.entries(vals).filter(([k, v]) => v && originales[k] !== v)
  const obsPendiente = observacion.trim() !== '' && observacion.trim() !== observacionGuardada

  const dimensiones = useMemo(() => {
    const grupos = {}
    habilidades.forEach(ws => {
      if (!grupos[ws.catId]) grupos[ws.catId] = { nombre: ws.catNombre, habilidades: [] }
      grupos[ws.catId].habilidades.push({ id: ws.id, nombre: ws.skillNombre })
    })
    return Object.values(grupos)
  }, [habilidades])

  const nombreEstudiante = (childId) => nombreDe(estudiantes.find(e => e.childId === childId), `Estudiante ${childId}`)
  const nombreHabilidad  = (wsId)   => habilidades.find(h => h.id === String(wsId))?.skillNombre ?? `Habilidad ${wsId}`

  const quitarValoracion = async (childId, wsId) => {
    const att = attendanceByStudent[String(childId)]
    if (!att) return
    setResultadoVal(null)
    try {
      await deleteEvaluation(att.id, wsId)
      const k = clave(childId, wsId)
      setVals(prev     => { const n = { ...prev }; delete n[k]; return n })
      setOriginales(prev => { const n = { ...prev }; delete n[k]; return n })
    } catch (err) {
      setResultadoVal({ ok: 0, errores: [`${nombreEstudiante(childId)} · ${nombreHabilidad(wsId)}: ${err.message}`] })
    }
  }

  const guardarValoraciones = async () => {
    setGuardandoVal(true)
    setResultadoVal(null)
    const errores = []
    let ok = 0
    const res = await Promise.allSettled(pendientesDeGuardar.map(([k, scaleId]) => {
      const [childId, wsId] = k.split('|')
      const att = attendanceByStudent[String(childId)]
      if (!att) return Promise.reject(new Error('Este estudiante no tiene asistencia registrada.'))
      return createEvaluation({ workshopAttendanceId: att.id, workshopSkillId: wsId, evaluationScaleId: String(scaleId) })
    }))
    const guardadas = {}
    res.forEach((r, i) => {
      const [k, scaleId] = pendientesDeGuardar[i]
      const [childId, wsId] = k.split('|')
      if (r.status === 'fulfilled') { ok += 1; guardadas[k] = scaleId }
      else errores.push(`${nombreEstudiante(childId)} · ${nombreHabilidad(wsId)}: ${r.reason?.message || 'Error'}`)
    })
    setOriginales(prev => ({ ...prev, ...guardadas }))

    if (obsPendiente) {
      const texto = observacion.trim()
      const objetivo = Object.values(attendanceByStudent).filter(a => !a.observation || a.observation === observacionGuardada)
      const rObs = await Promise.allSettled(objetivo.map(a => updateAttendance(a.id, { observation: texto })))
      const actualizadas = new Set()
      rObs.forEach((r, i) => {
        if (r.status === 'fulfilled') actualizadas.add(objetivo[i].id)
        else errores.push(`Observación de ${nombreEstudiante(objetivo[i].studentId)}: ${r.reason?.message || 'Error'}`)
      })
      if (actualizadas.size) {
        setAsistencias(prev => prev.map(a => (actualizadas.has(a.id) ? { ...a, observation: texto } : a)))
        setObservacionGuardada(texto)
      }
    }
    setResultadoVal({ ok, errores })
    setGuardandoVal(false)
  }

  /* ── Evidencias ── */
  const cambiarUrl = (url) =>
    setEvi(e => ({ ...e, url, type: !tipoManual && guessEvidenceType(url) ? guessEvidenceType(url) : e.type }))
  const sugerido = guessEvidenceType(evi.url)

  const subirEvidencia = async (e) => {
    e.preventDefault()
    const errs = {}
    let https = false
    try { https = new URL(evi.url.trim()).protocol === 'https:' } catch { /* inválida */ }
    if (!https) errs.url = 'Escribe una dirección que empiece por https://'
    const t = evi.title.trim()
    if (t.length < 2 || t.length > 150) errs.title = 'El título debe tener entre 2 y 150 caracteres.'
    if (!isEvidenceType(evi.type)) errs.type = 'Elige si es una imagen o un video.'
    const ids = presentesLista.filter(p => eviEstudiantes[p.childId] ?? true).map(p => p.childId)
    if (ids.length === 0) errs.students = 'Selecciona al menos un participante.'
    if (ids.length > 50) errs.students = 'Máximo 50 participantes por evidencia.'
    setErroresCampoEvi(errs)
    if (Object.keys(errs).length) return
    setSubiendoEvi(true)
    setErrorEvi('')
    try {
      await createEvidence({ url: evi.url.trim(), title: t, type: evi.type, studentIds: ids })
      setEviSubidas(l => [...l, { title: t, type: evi.type, n: ids.length }])
      setEvi({ url: '', title: '', type: '' })
      setTipoManual(false)
    } catch (err) {
      setErrorEvi(err.message)
    } finally {
      setSubiendoEvi(false)
    }
  }

  /* ── Finalizar sesión ── */
  const abrirFinalizar = () => {
    const ahora = new Date()
    setFin({ fecha: toBogotaDateInput(ahora), hora: toBogotaTimeInput(ahora) })
    setErrorFin('')
    setConfirmandoFin(true)
  }

  const finISO = bogotaToISO(fin.fecha, fin.hora)
  /** Mismas reglas que el backend: posterior al inicio y no futuro. */
  const errorHoraFin = !finISO ? 'Indica la fecha y la hora real de fin.'
    : sessionActual?.startsAt && new Date(finISO) <= new Date(sessionActual.startsAt)
      ? `El fin debe ser posterior al inicio (${formatFecha(sessionActual.startsAt)}, ${formatHora(sessionActual.startsAt)}).`
    : new Date(finISO) > new Date() ? 'El fin real no puede ser una hora futura.'
    : ''

  const finalizarSesion = async () => {
    if (errorHoraFin) { setErrorFin(errorHoraFin); return }
    setFinalizando(true)
    setErrorFin('')
    try {
      await finishSession(sessionActual.id, finISO)
      onSesionFinalizada?.()
    } catch (err) {
      setErrorFin(err.message)
      setFinalizando(false)
    }
  }

  /* ── Compartir ── */
  const fechaDisplay = sesion.fecha
    ? new Date(`${sesion.fecha}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const familyRecipients = presentesLista.map(s => ({ id: s.childId, name: nombreDe(s, `Estudiante ${s.childId}`) }))

  const abrirCompartir = () => {
    setArchivoResumen(createShareDocument({
      title: `Resumen de clase: ${sesion.tema || taller.name}`,
      subtitle: `${taller.name} · ${fechaDisplay}`,
      sections: [
        { title: 'Datos de la sesión', rows: [['Taller', taller.name], ['Fecha', fechaDisplay], ['Tema', sesion.tema || 'Sin tema']], paragraphs: [sesion.objetivo || 'Sin objetivo'] },
        { title: 'Actividades realizadas', items: sesion.pasos },
        { title: 'Materiales', items: sesion.materiales },
      ],
    }))
    setMostrarCompartir(true)
  }

  /* ─────────────────── Render ─────────────────── */
  return (
    <div className="talleres-page">
      <header className="talleres-header">
        <div>
          <button type="button" className="btn-volver btn-volver--header" onClick={onVolver}>← Volver a mis talleres</button>
          <p className="talleres-fase">{taller.name.toUpperCase()}</p>
          <h1 className="talleres-titulo">{TITULOS[fase].h}</h1>
          <p className="talleres-sub">{TITULOS[fase].sub}</p>
        </div>
        {fase === 3 && (
          <div className="talleres-header__acciones">
            <button type="button" className="btn-finalizar" onClick={abrirCompartir}>Compartir con familias</button>
          </div>
        )}
      </header>

      {errorCarga && <p className="talleres-estado talleres-estado--error" role="alert">{errorCarga}</p>}

      <Stepper fase={fase} />

      <div className={`talleres-body${fase === 3 ? ' talleres-body--val' : ''}`}>

        {/* ═══════════ PASO 1 ═══════════ */}
        {fase === 1 && (
          <>
            <div className="sesion-form">
              <div className="sesion-form__head">
                <div>
                  <h2 className="sesion-form__titulo">Datos de la sesión</h2>
                  <p className="sesion-form__sub">
                    {estaEnCurso
                      ? 'Sesión en curso · la hora de inicio está fija. Solo puedes editar el contenido.'
                      : !esNueva
                        ? 'Sesión programada · revisa sus datos, guárdalos o inicia la sesión.'
                        : 'Nueva sesión · completa los datos para programarla o iniciarla ya.'}
                  </p>
                </div>
                <span className={`sesion-modo sesion-modo--${estaEnCurso ? 'curso' : esNueva ? 'nueva' : 'programada'}`}>
                  {estaEnCurso ? 'En curso' : esNueva ? 'Nueva' : 'Programada'}
                </span>
              </div>

              <div className="form-fila-4">
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-taller">Taller</label>
                  <input id="ses-taller" className="form-input" value={taller.name} readOnly />
                </div>
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-fecha">Fecha *</label>
                  <input id="ses-fecha" type="date" className="form-input" value={sesion.fecha}
                    min={fechaMin}
                    disabled={estaEnCurso}
                    onChange={e => { setSesion(s => ({ ...s, fecha: e.target.value })); setErrorContinuar('') }} />
                </div>
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-hi">Hora inicio *</label>
                  <input id="ses-hi" type="time" className="form-input" value={sesion.horaInicio}
                    disabled={estaEnCurso}
                    onChange={e => { setSesion(s => ({ ...s, horaInicio: e.target.value })); setErrorContinuar('') }} />
                </div>
              </div>
              {!estaEnCurso && (
                <button type="button" className="btn-ahora" onClick={usarAhora}>
                  Usar fecha y hora actuales
                </button>
              )}

              <div className="form-campo">
                <label className="form-label" htmlFor="ses-tema">Tema de la sesión *</label>
                <input id="ses-tema" type="text" className="form-input" value={sesion.tema}
                  maxLength={150} placeholder="Ej: Ritmo con palmas y tambor"
                  onChange={e => setSesion(s => ({ ...s, tema: e.target.value }))} />
              </div>

              <div className="form-campo">
                <label className="form-label" htmlFor="ses-obj">Objetivo</label>
                <textarea id="ses-obj" className="form-textarea" rows={3} maxLength={1000} value={sesion.objetivo}
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
                      <button type="button" className="actividad__del" aria-label={`Eliminar paso ${i + 1}`}
                        onClick={() => setSesion(s => ({ ...s, pasos: s.pasos.filter((_, idx) => idx !== i) }))}>×</button>
                    </li>
                  ))}
                </ol>
                <div className="actividad__nuevo">
                  <input className="form-input" placeholder="Escribir nuevo paso..." aria-label="Nuevo paso"
                    value={nuevoPaso} onChange={e => setNuevoPaso(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregarPaso()} />
                  <button type="button" className="btn-agregar-paso" onClick={agregarPaso}>+ Agregar paso</button>
                </div>
              </div>

              <div className="materiales">
                <span className="form-label">Materiales</span>
                <div className="materiales__chips">
                  {sesion.materiales.map((m, i) => (
                    <span key={i} className="chip">{m}
                      <button type="button" className="chip__del" aria-label={`Quitar ${m}`}
                        onClick={() => setSesion(s => ({ ...s, materiales: s.materiales.filter((_, idx) => idx !== i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <input className="form-input form-input--sm" placeholder="Agregar material y presionar Enter..."
                  aria-label="Nuevo material" value={nuevoMaterial}
                  onChange={e => setNuevoMaterial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarMaterial()} />
              </div>

              {errorContinuar && <p className="talleres-estado talleres-estado--error" role="alert">{errorContinuar}</p>}
              {!errorContinuar && motivoNoIniciar && inicioISO && (
                <p className="talleres-estado talleres-estado--aviso sesion-aviso" role="status">{motivoNoIniciar}</p>
              )}

              {estaEnCurso ? (
                <button type="button" className="btn-publicar" onClick={() => continuar(true)}
                  disabled={continuando || !temaValido}>
                  {continuando ? 'Guardando…' : 'Guardar y continuar'}
                </button>
              ) : (
                <div className="sesion-acciones">
                  <button type="button" className="btn-volver sesion-acciones__sec" onClick={() => continuar(false)}
                    disabled={continuando || !temaValido || !inicioISO}>
                    {continuando ? 'Guardando…' : esNueva ? 'Guardar como programada' : 'Guardar cambios'}
                  </button>
                  <button type="button" className="btn-publicar sesion-acciones__pri" onClick={() => continuar(true)}
                    disabled={continuando || !temaValido || !inicioISO || Boolean(motivoNoIniciar)}
                    title={motivoNoIniciar ?? undefined}>
                    {continuando ? 'Guardando…' : 'Guardar e iniciar sesión'}
                  </button>
                </div>
              )}
            </div>

            <aside className="vista-previa">
              <p className="vista-previa__tag">VISTA PREVIA</p>
              <h3 className="vista-previa__titulo">{sesion.tema || 'Sin título'}</h3>
              <p className="vista-previa__taller">{taller.name}</p>
              <hr className="vista-previa__sep" />
              <div className="vista-previa__datos">
                <div className="vp-fila"><span className="vp-label">Fecha</span><span className="vp-valor">{fechaDisplay}</span></div>
                <div className="vp-fila">
                  <span className="vp-label">Horario</span>
                  <span className="vp-valor vp-valor--teal">{inicioISO ? formatHora(inicioISO) : '—'}</span>
                </div>
                <div className="vp-fila"><span className="vp-label">Participantes</span><span className="vp-valor vp-valor--teal">{total} inscritos</span></div>
                <div className="vp-fila"><span className="vp-label">Pasos</span><span className="vp-valor">{sesion.pasos.length}</span></div>
              </div>
              {sesion.materiales.length > 0 && (
                <>
                  <hr className="vista-previa__sep" />
                  <p className="vp-label">Materiales que deben llevar</p>
                  <ul className="vp-materiales" role="list">
                    {sesion.materiales.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </>
              )}
            </aside>
          </>
        )}

        {/* ═══════════ PASO 2 ═══════════ */}
        {fase === 2 && (
          <>
            <div className="asistencia-card">
              <div className="asistencia-card__head">
                <div>
                  <h2 className="asistencia-card__titulo">Lista del grupo</h2>
                  <p className="asistencia-card__sub">{taller.name} · {sessionActual?.topic || sesion.tema || 'Sesión'}</p>
                </div>
                <span className="asistencia-card__contador">{totalPresentes} de {total} presentes</span>
              </div>
              <ul className="asistencia-lista" role="list">
                {cargando ? (
                  <li className="asistencia-cargando">Cargando participantes…</li>
                ) : estudiantes.length === 0 ? (
                  <li className="asistencia-cargando">No hay participantes disponibles.</li>
                ) : estudiantes.map(p => {
                  const nombre   = nombreDe(p, `Estudiante ${p.childId}`)
                  const presente = isPresente(p.childId)
                  return (
                    <li key={p.childId} className="asistencia-item">
                      <div className="asistencia-avatar">{iniciales(nombre)}</div>
                      <span className="asistencia-nombre">{nombre}</span>
                      <div className="asistencia-toggle" role="group" aria-label={`Asistencia de ${nombre}`}>
                        <button type="button" aria-pressed={presente}
                          className={`toggle-btn${presente ? ' toggle-btn--asistio' : ''}`}
                          onClick={() => setAsistenciaLocal(a => ({ ...a, [p.childId]: true }))}>
                          Asistió
                        </button>
                        <button type="button" aria-pressed={!presente}
                          className={`toggle-btn${!presente ? ' toggle-btn--ausente' : ''}`}
                          onClick={() => setAsistenciaLocal(a => ({ ...a, [p.childId]: false }))}>
                          No asistió
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {erroresAsistencia.length > 0 && (
                <div className="talleres-estado talleres-estado--error talleres-errores" role="alert">
                  <strong>No se pudo registrar la asistencia de {erroresAsistencia.length} {erroresAsistencia.length === 1 ? 'persona' : 'personas'}:</strong>
                  <ul>{erroresAsistencia.map((er, i) => <li key={i}>{er.nombre}: {er.mensaje}</li>)}</ul>
                </div>
              )}
            </div>

            <aside className="resumen">
              <div className="resumen__circulo">{totalPresentes}</div>
              <p className="resumen__titulo">Participantes presentes</p>
              <p className="resumen__sub">{total - totalPresentes} {total - totalPresentes === 1 ? 'ausente' : 'ausentes'} · {pct}% de asistencia</p>
              <button type="button" className="btn-publicar" onClick={guardarAsistencia}
                disabled={guardandoAsistencia || cargando}>
                {guardandoAsistencia ? 'Registrando…'
                  : hayPendientesAsis ? 'Guardar cambios y continuar' : 'Continuar a valoraciones'}
              </button>
              {erroresAsistencia.length > 0 && asistencias.length > 0 && (
                <button type="button" className="btn-volver" onClick={() => irAValoraciones()}>Continuar con los registrados</button>
              )}
              <button type="button" className="btn-volver" onClick={() => setFase(1)}>
                {estaEnCurso ? 'Editar datos de la sesión' : 'Volver a datos'}
              </button>
            </aside>
          </>
        )}

        {/* ═══════════ PASO 3 ═══════════ */}
        {fase === 3 && (
          <>
            <aside className="val-sidebar">
              <p className="val-sidebar__titulo">PARTICIPANTES · {presentesLista.length}</p>
              <ul className="val-sidebar__lista" role="list">
                {presentesLista.map(p => {
                  const nombre = nombreDe(p, `Estudiante ${p.childId}`)
                  const act    = p.childId === activoId
                  return (
                    <li key={p.childId}>
                      <button type="button"
                        className={`val-participante${act ? ' val-participante--activo' : ''}`}
                        onClick={() => setParticipanteActivo(p.childId)}>
                        <div className={`val-participante__avatar${act ? ' val-participante__avatar--activo' : ''}`}>{iniciales(nombre)}</div>
                        <div className="val-participante__info">
                          <p className="val-participante__nombre">{nombre}</p>
                          <p className="val-participante__estado">{estadoParticipante(p.childId)}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>

            <div className="val-contenido">
              <div className="val-header">
                <h2 className="val-header__nombre">{activoId ? nombreEstudiante(activoId) : ''}</h2>
                <div className="val-leyenda">
                  {escalas.map(esc => <span key={esc.id} className="val-ley">{esc.code} · {esc.name.toUpperCase()}</span>)}
                </div>
              </div>

              {presentesLista.length === 0 && (
                <p className="talleres-estado">Nadie tiene asistencia registrada. Vuelve al paso 2.</p>
              )}
              {activoId && dimensiones.length === 0 && (
                <p className="talleres-estado talleres-estado--aviso">Este taller no tiene habilidades configuradas.</p>
              )}

              {activoId && dimensiones.map((dim, di) => {
                const valoradas = dim.habilidades.filter(h => getVal(activoId, h.id)).length
                return (
                  <div key={di} className="val-dimension">
                    <div className="val-dimension__header">
                      <h3 className="val-dimension__titulo">{dim.nombre}</h3>
                      <span className="val-dimension__logrados">{valoradas} de {dim.habilidades.length} valoradas</span>
                    </div>
                    {dim.habilidades.map(h => {
                      const v       = getVal(activoId, h.id)
                      const guardada = originales[clave(activoId, h.id)] === v && v
                      return (
                        <div key={h.id} className="val-indicador">
                          <p className="val-indicador__texto">
                            {h.nombre}{guardada ? <span className="val-guardada"> · guardada</span> : null}
                          </p>
                          <div className="val-botones">
                            {escalas.map(esc => {
                              const sel = v === String(esc.id)
                              return (
                                <button key={esc.id} type="button" aria-label={esc.name} aria-pressed={sel}
                                  className={`val-btn val-btn--${String(esc.code).toLowerCase()}${sel ? ' val-btn--sel' : ''}`}
                                  onClick={() => sel && guardada
                                    ? quitarValoracion(activoId, h.id)
                                    : setVal(activoId, h.id, sel ? null : String(esc.id))}>
                                  {esc.code}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              <div className="val-observacion">
                <h3 className="val-observacion__titulo">Observación del grupo</h3>
                <p className="val-observacion__label">¿Cómo le fue al grupo? Se guarda en la asistencia de quienes aún no tienen una observación propia.</p>
                <textarea className="form-textarea" rows={4} maxLength={1000} value={observacion}
                  aria-label="Observación del grupo"
                  onChange={e => setObservacion(e.target.value)}
                  placeholder="Describe cómo fue la sesión para el grupo..." />
              </div>

              <div className="val-guardar">
                <button type="button" className="btn-publicar" onClick={guardarValoraciones}
                  disabled={guardandoVal || (pendientesDeGuardar.length === 0 && !obsPendiente)}>
                  {guardandoVal ? 'Guardando…' : `Guardar valoraciones${pendientesDeGuardar.length ? ` (${pendientesDeGuardar.length})` : ''}`}
                </button>
                {resultadoVal && resultadoVal.errores.length === 0 && (
                  <p className="talleres-estado talleres-estado--ok" role="status">Todo guardado correctamente.</p>
                )}
                {resultadoVal && resultadoVal.errores.length > 0 && (
                  <div className="talleres-estado talleres-estado--error talleres-errores" role="alert">
                    <strong>{resultadoVal.ok > 0 ? `Se guardaron ${resultadoVal.ok}, pero fallaron:` : 'No se pudo guardar:'}</strong>
                    <ul>{resultadoVal.errores.map((er, i) => <li key={i}>{er}</li>)}</ul>
                  </div>
                )}
              </div>

              {/* Evidencias */}
              <form className="val-evidencias" onSubmit={subirEvidencia} noValidate>
                <div className="val-evidencias__header">
                  <h3 className="val-evidencias__titulo">Evidencias de la actividad</h3>
                  <span className="badge-opcional">Opcional</span>
                </div>
                <p className="val-evidencias__aviso">Agrega el enlace (https) de una foto o un video y elige su tipo.</p>

                <div className="form-fila-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <div className="form-campo">
                    <label className="form-label" htmlFor="evi-url">Enlace</label>
                    <input id="evi-url" className="form-input" inputMode="url" placeholder="https://…" value={evi.url}
                      onChange={e => cambiarUrl(e.target.value)} />
                    {erroresCampoEvi.url && <small className="campo-error" role="alert">{erroresCampoEvi.url}</small>}
                    {isYoutubeUrl(evi.url) && (
                      <>
                        <iframe className="evi-youtube" src={toYoutubeEmbed(evi.url)} allowFullScreen title="Vista previa del video"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                        <small className="evi-youtube__nota">Se guardará como {toYoutubeEmbed(evi.url)}</small>
                      </>
                    )}
                  </div>
                  <div className="form-campo">
                    <label className="form-label" htmlFor="evi-titulo">Título</label>
                    <input id="evi-titulo" className="form-input" maxLength={150} value={evi.title}
                      onChange={e => setEvi(v => ({ ...v, title: e.target.value }))} />
                    {erroresCampoEvi.title && <small className="campo-error" role="alert">{erroresCampoEvi.title}</small>}
                  </div>
                </div>

                <EvidenceTypeField idBase="sesion-evi-type" value={evi.type} sugerido={sugerido}
                  onChange={t => { setTipoManual(true); setEvi(v => ({ ...v, type: t })) }}
                  error={erroresCampoEvi.type} />

                <fieldset className="evi-quienes">
                  <legend className="form-label">¿Quiénes aparecen? (no marques a quien no tenga autorización de imagen)</legend>
                  <div className="evi-quienes__lista">
                    {presentesLista.map(p => (
                      <label key={p.childId} className="evi-quienes__item">
                        <input type="checkbox" checked={eviEstudiantes[p.childId] ?? true}
                          onChange={e => setEviEstudiantes(m => ({ ...m, [p.childId]: e.target.checked }))} />
                        {nombreDe(p, `Estudiante ${p.childId}`)}
                      </label>
                    ))}
                  </div>
                  {erroresCampoEvi.students && <small className="campo-error" role="alert">{erroresCampoEvi.students}</small>}
                </fieldset>

                {errorEvi && <p className="talleres-estado talleres-estado--error" role="alert">{errorEvi}</p>}
                <button type="submit" className="btn-publicar btn-publicar--sm"
                  disabled={subiendoEvi || presentesLista.length === 0}>
                  {subiendoEvi ? 'Guardando…' : 'Agregar evidencia'}
                </button>

                {eviSubidas.length > 0 && (
                  <ul className="evidencias-lista">
                    {eviSubidas.map((ev, i) => (
                      <li key={i} className="evidencia-item">
                        <span className="evidencia-nombre">{ev.type === 'VIDEO' ? '🎬' : '🖼️'} {ev.title} · {ev.n} {ev.n === 1 ? 'participante' : 'participantes'}</span>
                        <span className="evidencia-ok">Guardada</span>
                      </li>
                    ))}
                  </ul>
                )}
              </form>

              {/* Footer */}
              <div className="val-footer">
                <button type="button" className="btn-volver" onClick={() => setFase(2)}>Volver a asistencia</button>
                <button type="button" className="btn-publicar taller-btn-cierre"
                  onClick={abrirFinalizar}>
                  Finalizar sesión
                </button>
              </div>

              {confirmandoFin && (
                <div className="taller-confirmar" role="alertdialog" aria-label="Confirmar finalización">
                  <p>
                    Al finalizar la sesión se calculan las calificaciones de los participantes.
                    <strong> Ya no se podrá tomar asistencia ni valorar en esta sesión.</strong>
                    {(pendientesDeGuardar.length > 0 || obsPendiente) && (
                      <> Tienes <strong>cambios sin guardar</strong>: guárdalos antes.</>
                    )}
                  </p>
                  <p className="fin-aviso">Las valoraciones se suman al progreso de cada joven al finalizar la sesión.</p>
                  <fieldset className="fin-hora">
                    <legend className="form-label">Hora real de fin</legend>
                    <div className="fin-hora__campos">
                      <label className="fin-hora__campo">
                        <span>Fecha</span>
                        <input type="date" className="form-input" value={fin.fecha}
                          min={toBogotaDateInput(sessionActual?.startsAt) || undefined} max={todayBogota()}
                          onChange={e => { setFin(f => ({ ...f, fecha: e.target.value })); setErrorFin('') }} />
                      </label>
                      <label className="fin-hora__campo">
                        <span>Hora</span>
                        <input type="time" className="form-input" value={fin.hora}
                          onChange={e => { setFin(f => ({ ...f, hora: e.target.value })); setErrorFin('') }} />
                      </label>
                      <button type="button" className="btn-ahora fin-hora__ahora" onClick={abrirFinalizar}>Ahora</button>
                    </div>
                    <small className="fin-hora__ayuda">
                      Inició {sessionActual?.startsAt ? `el ${formatFecha(sessionActual.startsAt)} a las ${formatHora(sessionActual.startsAt)}` : '—'} ·
                      Si terminó más tarde de lo previsto y pisa la siguiente sesión, esa tendrá que corregir su hora de inicio.
                    </small>
                  </fieldset>
                  {(errorFin || errorHoraFin) && (
                    <p className="talleres-estado talleres-estado--error" role="alert">{errorFin || errorHoraFin}</p>
                  )}
                  <div className="taller-item__acciones">
                    <button type="button" className="btn-publicar btn-publicar--sm" disabled={finalizando || Boolean(errorHoraFin)} onClick={finalizarSesion}>
                      {finalizando ? 'Finalizando…' : 'Sí, finalizar sesión'}
                    </button>
                    <button type="button" className="btn-volver" onClick={() => setConfirmandoFin(false)}>Volver</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <CompartirModal
        isOpen={mostrarCompartir}
        onClose={() => setMostrarCompartir(false)}
        title={`Resumen de clase: ${sesion.tema || taller.name}`}
        tag="TALLER · SON UP"
        childId={familyRecipients[0]?.id}
        studentName={familyRecipients[0]?.name}
        recipientOptions={familyRecipients}
        attachmentFile={archivoResumen}
        defaultSubject={`Resumen de la clase: ${sesion.tema || taller.name}`}
        defaultMessage={`Estimadas familias,\n\nCompartimos el resumen de la sesión del taller "${taller.name}" realizada el ${fechaDisplay}:\n\nTema: ${sesion.tema}\nObjetivo: ${sesion.objetivo}\nActividades desarrolladas:\n${sesion.pasos.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}\n\n¡Gracias por su constante apoyo al proceso formativo!\n\nEquipo Son Up · Fundación Asisco`}
      />
    </div>
  )
}

export default SesionTaller
