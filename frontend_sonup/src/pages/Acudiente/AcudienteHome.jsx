import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getChild } from '../../services/children.js'
import { getStudentAttendances } from '../../services/attendances.js'
import { getWorkshops, completeWorkshopsFromAttendances } from '../../services/workshops.js'
import { getStudentCredentials } from '../../services/credentials.js'
import { getSesionesDelJoven } from '../../services/studentSessions.js'
import ProximasSesiones from '../../components/ProximasSesiones/ProximasSesiones.jsx'
import { toBogotaDateInput, formatHora, textToMaterials } from '../../utils/workshops.js'
import './AcudienteHome.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const LayersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const CAL_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES_ES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_ABR  = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

const formatFechaLarga = (d) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)

/** Tipos de actividad que se muestran al pasar el cursor por un día del calendario. */
const TIPO_ACTIVIDAD = {
  asistio:    'Asistió',
  en_curso:   'En curso',
  programada: 'Programada',
}

/** «2026-11-18» → { year, month } (month de 1 a 12) */
const mesDe = (yyyyMmDd) => ({ year: Number(yyyyMmDd.slice(0, 4)), month: Number(yyyyMmDd.slice(5, 7)) })

const claveDia = (year, month, dia) =>
  `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

/** Fecha larga de un día del calendario (se arma a mediodía para no cambiar de día por zona horaria). */
const fechaDeClave = (clave) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${clave}T12:00:00`))

const getColombiaCurrentTime = () =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date())

/* ─── Component ──────────────────────────────────────────────────────────── */

const AcudienteHome = () => {
  const navigate = useNavigate()
  const { activeChildId, childIds, selectChild, logout } = useAuth()
  const cerrarSesion = () => { logout(); navigate('/login', { replace: true }) }

  const [niño,         setNiño]         = useState(null)
  const [todosNiños,   setTodosNiños]   = useState({})   // { [id]: childData } para el selector
  const [asistencias,  setAsistencias]  = useState([])
  const [talleresMapa, setTalleresMapa] = useState({})
  const [credencial,   setCredencial]   = useState(null)
  const [sesiones,     setSesiones]     = useState([])     // sesiones de los talleres del joven
  const [mesVista,     setMesVista]     = useState(null)   // { year, month } elegido con las flechas
  const [diaActivo,    setDiaActivo]    = useState(null)   // 'yyyy-mm-dd' con la ventanita abierta
  const calGridRef = useRef(null)
  const punteroRef = useRef('mouse')   // con mouse se abre al pasar el cursor; al tocar, con el toque
  const [cargando,     setCargando]     = useState(true)
  const loadedRef = useRef(new Set())

  const [errorCarga,       setErrorCarga]        = useState('')
  const [claseIndex,       setClaseIndex]       = useState(0)
  const [confirmado,       setConfirmado]        = useState(false)
  const [mostrarCalendario,setMostrarCalendario] = useState(false)
  const [horaColombia,     setHoraColombia]      = useState(getColombiaCurrentTime())

  /* Precarga nombres de todos los hijos para mostrar en el selector */
  useEffect(() => {
    childIds.forEach(id => {
      const key = String(id)
      if (loadedRef.current.has(key)) return
      loadedRef.current.add(key)
      getChild(id)
        .then(c => setTodosNiños(prev => ({ ...prev, [key]: c })))
        .catch(() => {})
    })
  }, [childIds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const studentId = activeChildId
    if (!studentId) { setCargando(false); return } // sin id todavía (Saga despertando o cuenta sin enlazar)
    const load = async () => {
      try {
        const [childRes, asistRes, wsRes, credRes] = await Promise.allSettled([
          getChild(studentId),
          getStudentAttendances(studentId),
          getWorkshops({}),
          getStudentCredentials(studentId),
        ])

        if (childRes.status === 'fulfilled') {
          setNiño(childRes.value)
          setTodosNiños(prev => ({ ...prev, [String(studentId)]: childRes.value }))
        }

        const asist = asistRes.status === 'fulfilled' ? asistRes.value : []
        const sorted = [...asist].sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
        setAsistencias(sorted)

        // Sesiones de los talleres disponibles y de aquellos a los que asistió: tema y hora de cada
        // clase en el calendario, y las próximas con sus materiales
        setSesiones(await getSesionesDelJoven(wsRes.status === 'fulfilled' ? wsRes.value : [], asist))

        const allWs = await completeWorkshopsFromAttendances(wsRes.status === 'fulfilled' ? wsRes.value : [], asist)
        const mapa = {}
        allWs.forEach(w => { mapa[String(w.id)] = w })
        setTalleresMapa(mapa)

        if (credRes.status === 'fulfilled') {
          const valida = credRes.value.find(c => c.status === 'valid') ?? null
          setCredencial(valida)
        }
      } catch (err) {
        setErrorCarga(err.message || 'No se pudo cargar la información del joven.')
      } finally { setCargando(false) }
    }
    load()
  }, [activeChildId])

  /* Nombre e iniciales del estudiante */
  const nombre = niño ? (niño.firstName || 'Joven') : 'Joven'
  const iniciales = [niño?.firstName, niño?.lastName]
    .filter(Boolean)
    .map(s => s[0].toUpperCase())
    .join('')
    || 'J'

  /* Talleres únicos del estudiante */
  const workshopNombres = useMemo(() => {
    const ids = [...new Set(asistencias.map(a => String(a.workshopId)))]
    return ids.map(id => talleresMapa[id]?.name).filter(Boolean)
  }, [asistencias, talleresMapa])

  /* Últimas 3 clases para la sección de actividades */
  const clasesRecientes = useMemo(() => asistencias.slice(0, 3), [asistencias])

  /* Clase seleccionada en la preview */
  const claseActual = clasesRecientes[claseIndex] ?? null

  /* Actividades por día (hora de Bogotá): clases a las que asistió y sesiones programadas o en curso */
  const actividadesPorDia = useMemo(() => {
    const sesionPorId = new Map(sesiones.map(s => [String(s.id), s]))
    const nombreTaller = (id) => talleresMapa[String(id)]?.name ?? `Taller ${id}`
    const mapa = {}
    const agregar = (clave, item) => { (mapa[clave] ??= []).push(item) }
    const sesionesConAsistencia = new Set()

    asistencias.forEach(a => {
      const s = sesionPorId.get(String(a.sessionId))
      if (a.sessionId) sesionesConAsistencia.add(String(a.sessionId))
      const inicio = s?.startsAt ?? a.attendedAt
      agregar(toBogotaDateInput(inicio), {
        id: `a-${a.id}`, tipo: 'asistio', taller: nombreTaller(a.workshopId),
        tema: s?.topic ?? '', hora: formatHora(inicio), inicio, materiales: [],
      })
    })
    sesiones.forEach(s => {
      if (s.status === 'finished' || sesionesConAsistencia.has(String(s.id))) return
      agregar(toBogotaDateInput(s.startsAt), {
        id: `s-${s.id}`, tipo: s.status === 'in_progress' ? 'en_curso' : 'programada',
        taller: nombreTaller(s.workshopId), tema: s.topic, hora: formatHora(s.startsAt),
        inicio: s.startsAt, materiales: textToMaterials(s.materials),
      })
    })
    Object.values(mapa).forEach(lista => lista.sort((x, y) => new Date(x.inicio) - new Date(y.inicio)))
    return mapa
  }, [asistencias, sesiones, talleresMapa])

  /* Mes del calendario: el elegido con las flechas o, por defecto, el de la asistencia más reciente */
  const mesPorDefecto = useMemo(
    () => mesDe(toBogotaDateInput(asistencias[0]?.attendedAt ?? new Date())),
    [asistencias],
  )
  const { year: calYear, month: calMonth } = mesVista ?? mesPorDefecto

  const moverMes = (delta) => {
    const base = new Date(calYear, calMonth - 1 + delta, 1)
    setMesVista({ year: base.getFullYear(), month: base.getMonth() + 1 })
    setDiaActivo(null)
  }

  const { calOffset, daysInMonth, totalAsistencias } = useMemo(() => {
    const offset = (new Date(calYear, calMonth - 1, 1).getDay() + 6) % 7   // Lu=0 … Do=6
    const total  = new Date(calYear, calMonth, 0).getDate()
    let asistidos = 0
    for (let dia = 1; dia <= total; dia += 1) {
      if (actividadesPorDia[claveDia(calYear, calMonth, dia)]?.some(it => it.tipo === 'asistio')) asistidos += 1
    }
    return { calOffset: offset, daysInMonth: total, totalAsistencias: asistidos }
  }, [actividadesPorDia, calYear, calMonth])

  /* Un toque fuera del calendario (o Escape) cierra la ventanita del día */
  useEffect(() => {
    if (!diaActivo) return
    const fuera = (e) => { if (!calGridRef.current?.contains(e.target)) setDiaActivo(null) }
    const tecla = (e) => { if (e.key === 'Escape') setDiaActivo(null) }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [diaActivo])

  /* Seguimiento: últimas 2 asistencias con observación */
  const seguimiento = useMemo(() =>
    asistencias
      .filter(a => a.observation)
      .slice(0, 2)
      .map(a => ({
        texto:  a.observation,
        taller: talleresMapa[String(a.workshopId)]?.name ?? `Taller ${a.workshopId}`,
        fecha:  new Date(a.attendedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
      })),
    [asistencias, talleresMapa]
  )

  return (
    <div className="acu-page">

      {/* Header */}
      <header className="acu-header">
        <div className="acu-header__perfil">
          <div className="acu-avatar" aria-hidden="true">{iniciales}</div>
          <div>
            <h1 className="acu-nombre">{nombre}</h1>
            <p className="acu-modulos">
              {workshopNombres.length > 0
                ? workshopNombres.join(', ')
                : 'Sin talleres aún'}
            </p>
          </div>
        </div>

        {/* Botón y popover del calendario */}
        <div className="acu-cal-wrap">
          <button
            className={`acu-cal-btn${mostrarCalendario ? ' acu-cal-btn--activo' : ''}`}
            onClick={() => { setHoraColombia(getColombiaCurrentTime()); setMostrarCalendario(v => !v) }}
            aria-label="Ver hora Colombia"
            aria-expanded={mostrarCalendario}
          >
            <CalendarIcon />
          </button>

          {mostrarCalendario && (
            <div className="acu-cal-popover" role="dialog" aria-modal="true" aria-label="Hora Colombia">
              <div className="acu-cal-popover__head">
                <div className="acu-cal-popover__tz">
                  <span className="acu-cal-popover__bandera" aria-hidden="true">🇨🇴</span>
                  <div>
                    <p className="acu-cal-popover__tz-title">Hora Colombia (UTC-5)</p>
                    <p className="acu-cal-popover__tz-time">{horaColombia}</p>
                  </div>
                </div>
                <button className="acu-cal-popover__close" onClick={() => setMostrarCalendario(false)} aria-label="Cerrar">✕</button>
              </div>
              <div className="acu-cal-popover__body">
                <p style={{ fontSize: '0.85rem', color: '#687974', margin: 0 }}>
                  Mostrando asistencias de <strong>{MESES_ES[calMonth - 1]} {calYear}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Selector de jóvenes (solo cuando hay más de uno) ── */}
      {childIds.length > 1 && (
        <div className="acu-selector" role="tablist" aria-label="Seleccionar joven">
          {childIds.map(id => {
            const c     = todosNiños[String(id)]
            const label = c?.firstName ?? `Joven ${id}`
            const inits = c
              ? [c.firstName, c.lastName].filter(Boolean).map(s => s[0].toUpperCase()).join('')
              : '?'
            const activo = String(activeChildId) === String(id)
            return (
              <button
                key={id}
                role="tab"
                aria-selected={activo}
                className={`acu-selector__btn${activo ? ' acu-selector__btn--activo' : ''}`}
                onClick={() => {
                  if (!activo) {
                    selectChild(id)
                    setClaseIndex(0)
                    setSesiones([])
                    setMesVista(null)
                    setDiaActivo(null)
                    setConfirmado(false)
                    setCargando(true)
                  }
                }}
              >
                <span className="acu-selector__avatar" aria-hidden="true">{inits}</span>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {errorCarga && (
        <p role="alert" style={{ padding: '0.75rem 1rem', margin: '0 0 1rem', background: '#FDF2F2', borderRadius: '8px', color: '#8C2B22', fontSize: '0.875rem' }}>
          {errorCarga}
        </p>
      )}

      {/* ── Clases recientes ── */}
      <section className="acu-actividades-card" aria-label="Clases recientes">

        <div className="acu-actividades-head">
          <div className="acu-actividades-title-group">
            <h2 className="acu-actividades-titulo">Clases recientes</h2>
            <p className="acu-actividades-sub">Toca una clase para ver el detalle.</p>
          </div>
          {claseActual && (
            <div className="acu-badge-tz">
              <span className="acu-badge-tz__icon" aria-hidden="true">📅</span>
              <span className="acu-badge-tz__text">
                <strong>{formatFechaLarga(new Date(claseActual.attendedAt))}</strong>
              </span>
            </div>
          )}
        </div>

        {cargando ? (
          <p style={{ padding: '0.5rem 0', color: 'var(--color-text-muted, #888)', fontSize: '0.875rem' }}>
            Cargando clases…
          </p>
        ) : clasesRecientes.length === 0 ? (
          <p style={{ padding: '0.5rem 0', color: 'var(--color-text-muted, #888)', fontSize: '0.875rem' }}>
            Aún no hay clases registradas.
          </p>
        ) : (
          <>
            <div className="acu-fechas">
              {clasesRecientes.map((a, idx) => {
                const d = new Date(a.attendedAt)
                return (
                  <button
                    key={String(a.id)}
                    className={`acu-fecha-btn${claseIndex === idx ? ' acu-fecha-btn--activo' : ''}`}
                    onClick={() => { setClaseIndex(idx); setConfirmado(false) }}
                  >
                    <span className="acu-fecha-mes">{MESES_ABR[d.getMonth()]}</span>
                    <span className="acu-fecha-dia">{d.getDate()}</span>
                    <span className="acu-fecha-modulo">
                      {talleresMapa[String(a.workshopId)]?.name ?? `Taller ${a.workshopId}`}
                    </span>
                  </button>
                )
              })}
            </div>

            {claseActual && (
              <div className="acu-preview">
                <p className="acu-preview__tag">DETALLE DE LA CLASE</p>
                <div className="acu-preview__fila">
                  <div className="acu-preview__icono"><LayersIcon /></div>
                  <div>
                    <p className="acu-preview__nombre">
                      {talleresMapa[String(claseActual.workshopId)]?.name ?? `Taller ${claseActual.workshopId}`}
                    </p>
                    <p className="acu-preview__meta">
                      {new Date(claseActual.attendedAt).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
                {claseActual.observation && (
                  <div className="acu-preview__dato">
                    <p className="acu-preview__dato-label">OBSERVACIÓN DEL TALLERISTA</p>
                    <p className="acu-preview__dato-valor">{claseActual.observation}</p>
                  </div>
                )}
                <button
                  className={`acu-confirmar-btn${confirmado ? ' acu-confirmar-btn--ok' : ''}`}
                  onClick={() => setConfirmado(v => !v)}
                >
                  {confirmado ? '✓  Confirmado' : 'Confirmar que lo vi'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Fila inferior ── */}
      <div className="acu-bottom-grid">

        {/* Calendario de asistencia y actividades */}
        <section className="acu-asistencia-card" aria-label="Asistencia y actividades">
          <div className="acu-asistencia-head">
            <div className="acu-cal-nav">
              <button type="button" className="acu-cal-nav__btn" onClick={() => moverMes(-1)} aria-label="Mes anterior">
                <ChevronLeftIcon />
              </button>
              <h3 className="acu-card-titulo">
                {MESES_ES[calMonth - 1]} {calYear}
              </h3>
              <button type="button" className="acu-cal-nav__btn" onClick={() => moverMes(1)} aria-label="Mes siguiente">
                <ChevronRightIcon />
              </button>
            </div>
            <span className="acu-asistencia-resumen">
              {totalAsistencias} {totalAsistencias === 1 ? 'clase' : 'clases'}
            </span>
          </div>
          <div className="acu-cal-grid" role="grid" aria-label={`Calendario de ${MESES_ES[calMonth - 1]} ${calYear}`} ref={calGridRef}>
            {CAL_SEMANA.map(d => (
              <span key={d} className="acu-cal-head" role="columnheader">{d}</span>
            ))}
            {Array.from({ length: calOffset }).map((_, i) => (
              <span key={`e${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dia     = i + 1
              const clave   = claveDia(calYear, calMonth, dia)
              const items   = actividadesPorDia[clave] ?? []
              const asistio = items.some(it => it.tipo === 'asistio')
              const proxima = items.some(it => it.tipo !== 'asistio')
              const abierto = diaActivo === clave && items.length > 0
              // Posición de la ventanita según la celda, para que no se salga de la tarjeta
              const celda   = calOffset + i
              const columna = celda % 7
              const fila    = Math.floor(celda / 7)
              const lado    = columna <= 1 ? 'izq' : columna >= 5 ? 'der' : 'centro'
              const vertical = fila <= 1 ? 'abajo' : 'arriba'
              const tipId   = `acu-dia-${clave}`
              const clases  = [
                'acu-cal-dia',
                asistio ? 'acu-cal-dia--vino' : '',
                proxima ? 'acu-cal-dia--prog' : '',
                items.length > 0 ? 'acu-cal-dia--con' : '',
                abierto ? 'acu-cal-dia--abierto' : '',
              ].filter(Boolean).join(' ')

              if (items.length === 0) {
                return <span key={dia} className={clases} role="gridcell" aria-label={String(dia)}>{dia}</span>
              }
              return (
                <span
                  key={dia}
                  className={clases}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={`${dia}: ${items.length} ${items.length === 1 ? 'actividad' : 'actividades'}`}
                  aria-describedby={abierto ? tipId : undefined}
                  aria-expanded={abierto}
                  onPointerEnter={e => { if (e.pointerType === 'mouse') setDiaActivo(clave) }}
                  onPointerLeave={e => { if (e.pointerType === 'mouse') setDiaActivo(a => (a === clave ? null : a)) }}
                  onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setDiaActivo(clave) }}
                  onBlur={() => setDiaActivo(a => (a === clave ? null : a))}
                  onPointerDown={e => { punteroRef.current = e.pointerType }}
                  onClick={() => setDiaActivo(a => (punteroRef.current !== 'mouse' && a === clave ? null : clave))}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDiaActivo(a => (a === clave ? null : clave)) } }}
                >
                  {dia}
                  {abierto && (
                    <span id={tipId} role="tooltip" className={`acu-cal-tip acu-cal-tip--${lado} acu-cal-tip--${vertical}`}>
                      <span className="acu-cal-tip__fecha">{fechaDeClave(clave)}</span>
                      {items.map(it => (
                        <span key={it.id} className={`acu-cal-tip__item acu-cal-tip__item--${it.tipo}`}>
                          <span className="acu-cal-tip__fila">
                            <span className="acu-cal-tip__tipo">{TIPO_ACTIVIDAD[it.tipo]}</span>
                            {it.hora && <span className="acu-cal-tip__hora">{it.hora}</span>}
                          </span>
                          <span className="acu-cal-tip__taller">{it.taller}</span>
                          {it.tema && <span className="acu-cal-tip__tema">{it.tema}</span>}
                          {it.materiales.length > 0 && (
                            <span className="acu-cal-tip__mat">Llevar: {it.materiales.join(', ')}</span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
          <div className="acu-cal-leyenda" aria-hidden="true">
            <span className="acu-cal-leyenda__item"><span className="acu-cal-leyenda__punto acu-cal-leyenda__punto--vino" />Asistió</span>
            <span className="acu-cal-leyenda__item"><span className="acu-cal-leyenda__punto acu-cal-leyenda__punto--prog" />Programada</span>
            <span className="acu-cal-leyenda__ayuda">Pasa el cursor o toca un día para ver sus actividades</span>
          </div>
        </section>

        {/* Columna derecha */}
        <div className="acu-right-col">

          {/* Próximas sesiones con los materiales que debe llevar */}
          <ProximasSesiones sesiones={sesiones} talleres={talleresMapa} cargando={cargando} />

          {/* Informe — solo si hay credencial válida */}
          {credencial && (
            <section className="acu-informe-card" aria-label="Informe del semestre">
              <div className="acu-informe-card__top">
                <FileIcon />
                <div>
                  <p className="acu-informe-titulo">Ya está el informe del semestre</p>
                  <p className="acu-informe-fecha">
                    {credencial.createdAt
                      ? `Firmado el ${new Date(credencial.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
                      : 'Disponible'}
                  </p>
                </div>
              </div>
              <button className="acu-btn-informe" onClick={() => navigate('/acudiente/informe')}>
                Ver informe
              </button>
            </section>
          )}

          {/* Lo que contaron sus profes */}
          <section className="acu-seg-card" aria-label="Notas de profes">
            <h3 className="acu-card-titulo">Lo que contaron sus profes</h3>
            {seguimiento.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', margin: 0 }}>
                Aún no hay observaciones registradas.
              </p>
            ) : (
              <ul className="acu-seg-list" role="list">
                {seguimiento.map((s, i) => (
                  <li key={i} className="acu-seg-item">
                    <span className="acu-seg-icono"><FileIcon /></span>
                    <div>
                      <p className="acu-seg-texto">{s.texto}</p>
                      <p className="acu-seg-meta">{s.taller} · {s.fecha}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>

      {/* Nota privacidad */}
      <p className="acu-privacidad">
        Solo ves la información de {nombre}. Las notas internas del equipo no aparecen aquí.
      </p>

      {/* Footer */}
      <footer className="acu-footer">
        <button className="acu-logout" onClick={cerrarSesion}>
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default AcudienteHome
