import { useCallback, useEffect, useMemo, useState } from 'react'
import { getChildren } from '../../../services/children.js'
import { getWorkshopSkills, finishWorkshop } from '../../../services/workshops.js'
import { getSkills, getSkillCategories } from '../../../services/skills.js'
import { createAttendance, updateAttendance, getWorkshopAttendances } from '../../../services/attendances.js'
import { createEvaluation, deleteEvaluation, getEvaluationScales, getAttendanceEvaluations } from '../../../services/evaluations.js'
import { createEvidence } from '../../../services/evidences.js'
import { isEvidenceType, guessEvidenceType } from '../../../utils/evidenceType.js'
import { toBogotaDateInput, toBogotaTimeInput, todayBogota, nombreDe, formatFecha } from '../../../utils/workshops.js'
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
  1: { h: 'Datos de la sesión',        sub: 'Define el tema, el objetivo y la actividad de la sesión de hoy.' },
  2: { h: 'Toma de asistencia',        sub: 'Registra quiénes participaron en la sesión.' },
  3: { h: 'Valoraciones y evidencias', sub: 'Valora los logros y adjunta evidencias de la actividad.' },
}

const Stepper = ({ fase }) => (
  <div className="stepper" role="list">
    {FASES.map(f => {
      const done = fase > f.n
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

const iniciales = (nombre) => nombre.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()

/**
 * Taller en curso (`active`): datos de la sesión → asistencia → valoraciones/evidencias → finalizar.
 * Todo lo que se guarda aquí lo exige el backend con el taller en `active`.
 */
const SesionTaller = ({ taller, onVolver, onTallerActualizado, onFinalizado }) => {
  const workshopId = String(taller.id)
  const [fase, setFase] = useState(1)

  /* Datos cargados */
  const [estudiantes, setEstudiantes]   = useState([])
  const [habilidades, setHabilidades]   = useState([])
  const [escalas, setEscalas]           = useState([])
  const [asistencias, setAsistencias]   = useState([])      // todas las del taller (varias sesiones)
  const [cargando, setCargando]         = useState(true)
  const [errorCarga, setErrorCarga]     = useState('')

  /* Paso 1 (solo para el resumen que se comparte: no existe en el backend) */
  const [sesion, setSesion] = useState(() => {
    const hoy = todayBogota()
    const inicio = toBogotaDateInput(taller.startsAt)
    return {
      fecha: inicio && inicio > hoy ? inicio : hoy,
      horaInicio: toBogotaTimeInput(new Date()),
      horaFin: '',
      tema: '', objetivo: '', pasos: [], materiales: [],
    }
  })
  const [nuevoPaso, setNuevoPaso]         = useState('')
  const [nuevoMaterial, setNuevoMaterial] = useState('')

  /* Paso 2 */
  const [asistencia, setAsistencia] = useState({})          // childId → bool (solo quien aún no tiene registro)
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)
  const [erroresAsistencia, setErroresAsistencia] = useState([])

  /* Paso 3 */
  const [participanteActivo, setParticipanteActivo] = useState(null)
  const [vals, setVals]           = useState({})            // `${dia}|${childId}|${wsId}` → scaleId
  const [originales, setOriginales] = useState({})          // lo ya guardado en el servidor
  const [evalCargadas, setEvalCargadas] = useState({})      // attendanceId → true
  const [guardandoVal, setGuardandoVal] = useState(false)
  const [resultadoVal, setResultadoVal] = useState(null)    // { ok, errores: [] }
  const [observacion, setObservacion] = useState('')
  const [observacionGuardada, setObservacionGuardada] = useState('')

  /* Evidencias */
  const [evi, setEvi] = useState({ url: '', title: '', type: '' })
  const [tipoManual, setTipoManual] = useState(false)
  const [eviEstudiantes, setEviEstudiantes] = useState({})  // childId → bool (default true)
  const [subiendoEvi, setSubiendoEvi] = useState(false)
  const [errorEvi, setErrorEvi] = useState('')
  const [erroresCampoEvi, setErroresCampoEvi] = useState({})
  const [eviSubidas, setEviSubidas] = useState([])

  /* Finalizar / compartir */
  const [confirmandoFin, setConfirmandoFin] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [errorFin, setErrorFin] = useState('')
  const [mostrarCompartir, setMostrarCompartir] = useState(false)
  const [archivoResumen, setArchivoResumen] = useState(null)

  /* ── Carga inicial ── */
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [kids, wSkills, allSkills, cats, escs, atts] = await Promise.all([
          getChildren(), getWorkshopSkills(workshopId), getSkills(), getSkillCategories(),
          getEvaluationScales(), getWorkshopAttendances(workshopId),
        ])
        if (!vivo) return
        setHabilidades(wSkills.map(ws => {
          const skill = allSkills.find(s => String(s.id) === String(ws.skillId))
          const cat = cats.find(c => String(c.id) === String(skill?.skillCategoryId))
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
        if (vivo) setErrorCarga(`No se pudieron cargar los datos del taller: ${err.message}`)
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [workshopId])

  /* ── Fecha efectiva de la asistencia ── */
  const iniciado = !taller.startsAt || new Date(taller.startsAt) <= new Date()

  /** Hora de la sesión; nunca futura (la API la rechaza) ni anterior al inicio del taller. */
  const calcularAttendedAt = useCallback(() => {
    // Margen de 1 min: si el reloj de este equipo adelanta al del servidor, «ahora» llegaría como fecha futura (400)
    const ahora = new Date(Date.now() - 60_000)
    let c = sesion.fecha && sesion.horaInicio ? new Date(`${sesion.fecha}T${sesion.horaInicio}:00-05:00`) : ahora
    if (Number.isNaN(c.getTime())) c = ahora
    if (c > ahora) c = ahora
    if (taller.startsAt && c < new Date(taller.startsAt)) c = new Date(taller.startsAt)
    return c
  }, [sesion.fecha, sesion.horaInicio, taller.startsAt])

  const dia = toBogotaDateInput(calcularAttendedAt())

  /** Asistencias de la sesión de ese día (la API permite una por estudiante y día). */
  const delDia = useMemo(() => {
    const m = {}
    asistencias.forEach(a => { if (toBogotaDateInput(a.attendedAt) === dia) m[a.studentId] = a })
    return m
  }, [asistencias, dia])

  const presentesLista = estudiantes.filter(e => delDia[e.childId])
  const marcado = (id) => Boolean(delDia[id]) || (asistencia[id] ?? true)
  const totalPresentes = estudiantes.filter(e => marcado(e.childId)).length
  const total = estudiantes.length
  const pct = total > 0 ? Math.round((totalPresentes / total) * 100) : 0
  const yaRegistrados = Object.keys(delDia).length
  const porRegistrar = estudiantes.filter(e => !delDia[e.childId] && marcado(e.childId))

  /* ── Paso 1 ── */
  const agregarPaso = () => { if (nuevoPaso.trim()) { setSesion(s => ({ ...s, pasos: [...s.pasos, nuevoPaso.trim()] })); setNuevoPaso('') } }
  const agregarMaterial = () => { if (nuevoMaterial.trim()) { setSesion(s => ({ ...s, materiales: [...s.materiales, nuevoMaterial.trim()] })); setNuevoMaterial('') } }

  /* ── Paso 2 ── */
  const guardarAsistencia = async () => {
    setGuardandoAsistencia(true)
    setErroresAsistencia([])
    const attendedAt = calcularAttendedAt().toISOString()
    const res = await Promise.allSettled(
      porRegistrar.map(e => createAttendance({ studentId: e.childId, workshopId, attendedAt })),
    )
    const nuevas = []
    const fallos = []
    res.forEach((r, i) => {
      if (r.status === 'fulfilled') nuevas.push({ ...r.value, id: String(r.value.id), studentId: String(r.value.studentId ?? porRegistrar[i].childId) })
      else fallos.push({ nombre: nombreDe(porRegistrar[i], `Estudiante ${porRegistrar[i].childId}`), mensaje: r.reason?.message || 'Error desconocido' })
    })
    if (nuevas.length) setAsistencias(prev => [...prev, ...nuevas])
    setErroresAsistencia(fallos)
    setGuardandoAsistencia(false)
    if (fallos.length === 0) await irAValoraciones(nuevas)
  }

  /** Entra al paso 3 trayendo las valoraciones ya guardadas de la sesión de ese día. */
  const irAValoraciones = async (recienCreadas = []) => {
    const existentes = Object.values(delDia).filter(a => !evalCargadas[a.id])
    const res = await Promise.allSettled(existentes.map(a => getAttendanceEvaluations(a.id)))
    const guardadas = {}
    const cargadas = {}
    res.forEach((r, i) => {
      if (r.status !== 'fulfilled') return
      cargadas[existentes[i].id] = true
      r.value.forEach(ev => { guardadas[`${dia}|${existentes[i].studentId}|${ev.workshopSkillId}`] = String(ev.evaluationScaleId) })
    })
    recienCreadas.forEach(a => { cargadas[a.id] = true })
    setEvalCargadas(prev => ({ ...prev, ...cargadas }))
    setOriginales(prev => ({ ...prev, ...guardadas }))
    setVals(prev => ({ ...guardadas, ...prev }))
    // Observación común ya guardada
    const obs = [...new Set([...Object.values(delDia), ...recienCreadas].map(a => a.observation).filter(Boolean))]
    if (obs.length === 1 && !observacion) { setObservacion(obs[0]); setObservacionGuardada(obs[0]) }
    setFase(3)
  }

  /* ── Paso 3: valoraciones ── */
  const clave = (childId, wsId) => `${dia}|${childId}|${wsId}`
  const getVal = (childId, wsId) => vals[clave(childId, wsId)] ?? null
  const setVal = (childId, wsId, v) => setVals(prev => ({ ...prev, [clave(childId, wsId)]: v }))

  const activoId = presentesLista.some(e => e.childId === participanteActivo) ? participanteActivo : presentesLista[0]?.childId ?? null

  const estadoParticipante = (childId) => {
    const n = habilidades.filter(ws => getVal(childId, ws.id)).length
    if (n === 0) return 'Sin empezar'
    if (n === habilidades.length) return 'Completo'
    return `${n} de ${habilidades.length} valoradas`
  }

  const pendientesDeGuardar = Object.entries(vals).filter(([k, v]) => v && originales[k] !== v && k.startsWith(`${dia}|`))
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
  const nombreHabilidad = (wsId) => habilidades.find(h => h.id === String(wsId))?.skillNombre ?? `Habilidad ${wsId}`

  /** Quitar una valoración ya guardada (el backend lo permite con el taller en curso). */
  const quitarValoracion = async (childId, wsId) => {
    const att = delDia[childId]
    if (!att) return
    setResultadoVal(null)
    try {
      await deleteEvaluation(att.id, wsId)
      const k = clave(childId, wsId)
      setVals(prev => { const n = { ...prev }; delete n[k]; return n })
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
      const [, childId, wsId] = k.split('|')
      const att = delDia[childId]
      if (!att) return Promise.reject(new Error('Este estudiante no tiene asistencia registrada.'))
      return createEvaluation({ workshopAttendanceId: att.id, workshopSkillId: wsId, evaluationScaleId: String(scaleId) })
    }))
    const guardadas = {}
    res.forEach((r, i) => {
      const [k, scaleId] = pendientesDeGuardar[i]
      const [, childId, wsId] = k.split('|')
      if (r.status === 'fulfilled') { ok += 1; guardadas[k] = scaleId }
      else errores.push(`${nombreEstudiante(childId)} · ${nombreHabilidad(wsId)}: ${r.reason?.message || 'Error'}`)
    })
    setOriginales(prev => ({ ...prev, ...guardadas }))

    // Observación del grupo → se guarda en la asistencia de cada presente que no tenga una propia
    if (obsPendiente) {
      const texto = observacion.trim()
      const objetivo = Object.values(delDia).filter(a => !a.observation || a.observation === observacionGuardada)
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
  const cambiarUrl = (url) => {
    setEvi(e => {
      const g = guessEvidenceType(url)
      return { ...e, url, type: !tipoManual && g ? g : e.type }
    })
  }
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

  /* ── Finalizar ── */
  const finalizar = async () => {
    setFinalizando(true)
    setErrorFin('')
    try {
      const actualizado = await finishWorkshop(taller.id)
      onTallerActualizado?.(actualizado)
      onFinalizado?.(actualizado)
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
        { title: 'Datos de la sesión', rows: [['Taller', taller.name], ['Fecha', fechaDisplay], ['Tema', sesion.tema || 'Sin tema registrado']], paragraphs: [sesion.objetivo || 'Sin objetivo registrado'] },
        { title: 'Actividades realizadas', items: sesion.pasos },
        { title: 'Materiales', items: sesion.materiales },
      ],
    }))
    setMostrarCompartir(true)
  }

  /* ─────────────────────────────── Render ─────────────────────────────── */
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
      {!iniciado && (
        <p className="talleres-estado talleres-estado--aviso" role="status">
          Este taller empieza el {formatFecha(taller.startsAt)}. Hasta entonces no se puede tomar asistencia.
        </p>
      )}

      <Stepper fase={fase} />

      <div className={`talleres-body${fase === 3 ? ' talleres-body--val' : ''}`}>

        {/* ═══════════ PASO 1 ═══════════ */}
        {fase === 1 && (
          <>
            <div className="sesion-form">
              <div className="sesion-form__head">
                <div>
                  <h2 className="sesion-form__titulo">Datos de la sesión</h2>
                  <p className="sesion-form__sub">Sirven para el resumen que compartes con las familias; no se guardan en el sistema.</p>
                </div>
                <span className="tag-borrador">Para el resumen</span>
              </div>

              <div className="form-fila-4">
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-taller">Taller</label>
                  <input id="ses-taller" className="form-input" value={taller.name} readOnly />
                </div>
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-fecha">Fecha</label>
                  <input id="ses-fecha" type="date" className="form-input" value={sesion.fecha}
                    min={toBogotaDateInput(taller.startsAt) || undefined} max={todayBogota()}
                    onChange={e => setSesion(s => ({ ...s, fecha: e.target.value }))} />
                </div>
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-hi">Hora de inicio</label>
                  <input id="ses-hi" type="time" className="form-input" value={sesion.horaInicio}
                    onChange={e => setSesion(s => ({ ...s, horaInicio: e.target.value }))} />
                </div>
                <div className="form-campo">
                  <label className="form-label" htmlFor="ses-hf">Hora de fin</label>
                  <input id="ses-hf" type="time" className="form-input" value={sesion.horaFin}
                    onChange={e => setSesion(s => ({ ...s, horaFin: e.target.value }))} />
                </div>
              </div>

              <div className="form-campo">
                <label className="form-label" htmlFor="ses-tema">Tema de la clase</label>
                <input id="ses-tema" type="text" className="form-input" value={sesion.tema} placeholder="Ej: Ritmo con palmas y tambor"
                  onChange={e => setSesion(s => ({ ...s, tema: e.target.value }))} />
              </div>

              <div className="form-campo">
                <label className="form-label" htmlFor="ses-obj">Objetivo</label>
                <textarea id="ses-obj" className="form-textarea" rows={3} value={sesion.objetivo}
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
                <input className="form-input form-input--sm" placeholder="Agregar material y presionar Enter..." aria-label="Nuevo material"
                  value={nuevoMaterial} onChange={e => setNuevoMaterial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarMaterial()} />
              </div>
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
                  <span className="vp-valor vp-valor--teal">{sesion.horaInicio || '—'}{sesion.horaFin ? `–${sesion.horaFin}` : ''}</span>
                </div>
                <div className="vp-fila"><span className="vp-label">Participantes</span><span className="vp-valor vp-valor--teal">{total} inscritos</span></div>
              </div>
              <button type="button" className="btn-publicar" onClick={() => setFase(2)} disabled={!sesion.fecha}>
                Continuar a asistencia
              </button>
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
                  <p className="asistencia-card__sub">{taller.name} · {fechaDisplay}</p>
                </div>
                <span className="asistencia-card__contador">{totalPresentes} de {total} presentes</span>
              </div>
              <ul className="asistencia-lista" role="list">
                {cargando ? (
                  <li className="asistencia-cargando">Cargando participantes…</li>
                ) : estudiantes.length === 0 ? (
                  <li className="asistencia-cargando">No hay participantes disponibles.</li>
                ) : estudiantes.map(p => {
                  const nombre = nombreDe(p, `Estudiante ${p.childId}`)
                  const registrado = Boolean(delDia[p.childId])
                  const presente = marcado(p.childId)
                  return (
                    <li key={p.childId} className="asistencia-item">
                      <div className="asistencia-avatar">{iniciales(nombre)}</div>
                      <span className="asistencia-nombre">{nombre}</span>
                      {registrado ? (
                        <span className="asistencia-registrada">✓ Ya registrado</span>
                      ) : (
                        <div className="asistencia-toggle" role="group" aria-label={`Asistencia de ${nombre}`}>
                          <button type="button" aria-pressed={presente} className={`toggle-btn${presente ? ' toggle-btn--asistio' : ''}`}
                            onClick={() => setAsistencia(a => ({ ...a, [p.childId]: true }))}>Asistió</button>
                          <button type="button" aria-pressed={!presente} className={`toggle-btn${!presente ? ' toggle-btn--ausente' : ''}`}
                            onClick={() => setAsistencia(a => ({ ...a, [p.childId]: false }))}>No asistió</button>
                        </div>
                      )}
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
                disabled={guardandoAsistencia || cargando || !iniciado || (porRegistrar.length === 0 && yaRegistrados === 0)}>
                {guardandoAsistencia ? 'Registrando…'
                  : porRegistrar.length > 0 ? `Guardar ${porRegistrar.length} y continuar` : 'Continuar a valoraciones'}
              </button>
              {erroresAsistencia.length > 0 && yaRegistrados > 0 && (
                <button type="button" className="btn-volver" onClick={() => irAValoraciones()}>Continuar con los registrados</button>
              )}
              <button type="button" className="btn-volver" onClick={() => setFase(1)}>Volver a datos</button>
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
                  const act = p.childId === activoId
                  return (
                    <li key={p.childId}>
                      <button type="button" className={`val-participante${act ? ' val-participante--activo' : ''}`} onClick={() => setParticipanteActivo(p.childId)}>
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

              {presentesLista.length === 0 && <p className="talleres-estado">Nadie tiene asistencia registrada en esta sesión. Vuelve al paso 2.</p>}

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
                      const v = getVal(activoId, h.id)
                      const guardada = originales[clave(activoId, h.id)] === v && v
                      return (
                        <div key={h.id} className="val-indicador">
                          <p className="val-indicador__texto">{h.nombre}{guardada ? <span className="val-guardada"> · guardada</span> : null}</p>
                          <div className="val-botones">
                            {escalas.map(esc => {
                              const sel = v === String(esc.id)
                              return (
                                <button key={esc.id} type="button" aria-label={esc.name} aria-pressed={sel}
                                  className={`val-btn val-btn--${String(esc.code).toLowerCase()}${sel ? ' val-btn--sel' : ''}`}
                                  onClick={() => (sel && guardada ? quitarValoracion(activoId, h.id) : setVal(activoId, h.id, sel ? null : String(esc.id)))}>
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
                <textarea className="form-textarea" rows={4} maxLength={1000} value={observacion} aria-label="Observación del grupo"
                  onChange={e => setObservacion(e.target.value)} placeholder="Describe cómo fue la sesión para el grupo..." />
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
                  </div>
                  <div className="form-campo">
                    <label className="form-label" htmlFor="evi-titulo">Título</label>
                    <input id="evi-titulo" className="form-input" maxLength={150} value={evi.title}
                      onChange={e => setEvi(v => ({ ...v, title: e.target.value }))} />
                    {erroresCampoEvi.title && <small className="campo-error" role="alert">{erroresCampoEvi.title}</small>}
                  </div>
                </div>

                <EvidenceTypeField idBase="sesion-evi-type" value={evi.type} sugerido={sugerido}
                  onChange={t => { setTipoManual(true); setEvi(v => ({ ...v, type: t })) }} error={erroresCampoEvi.type} />

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
                <button type="submit" className="btn-publicar btn-publicar--sm" disabled={subiendoEvi || presentesLista.length === 0}>
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

              {/* Navegación */}
              <div className="val-footer">
                <button type="button" className="btn-volver" onClick={() => setFase(2)}>Volver a asistencia</button>
                <button type="button" className="btn-publicar taller-btn-cierre" onClick={() => { setConfirmandoFin(true); setErrorFin('') }}>
                  Finalizar taller
                </button>
              </div>

              {confirmandoFin && (
                <div className="taller-confirmar" role="alertdialog" aria-label="Confirmar finalización">
                  <p>
                    Al finalizar el taller se registra la fecha de fin (ahora) y <strong>ya no se podrá tomar asistencia ni valorar</strong>.
                    Para seguir con otra sesión, no lo finalices.
                    {(pendientesDeGuardar.length > 0 || obsPendiente) && <> <strong>Tienes cambios sin guardar</strong>: guárdalos antes.</>}
                  </p>
                  {errorFin && <p className="talleres-estado talleres-estado--error" role="alert">{errorFin}</p>}
                  <div className="taller-item__acciones">
                    <button type="button" className="btn-publicar btn-publicar--sm" disabled={finalizando} onClick={finalizar}>
                      {finalizando ? 'Finalizando…' : 'Sí, finalizar taller'}
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
