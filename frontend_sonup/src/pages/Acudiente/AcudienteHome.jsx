import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getChild } from '../../services/children.js'
import { getStudentAttendances } from '../../services/attendances.js'
import { getWorkshops } from '../../services/workshops.js'
import { getStudentCredentials } from '../../services/credentials.js'
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

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const CAL_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES_ES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_ABR  = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

const formatFechaLarga = (d) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)

const getColombiaCurrentTime = () =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date())

/* ─── Component ──────────────────────────────────────────────────────────── */

const AcudienteHome = () => {
  const navigate = useNavigate()

  const [niño,         setNiño]         = useState(null)
  const [asistencias,  setAsistencias]  = useState([])
  const [talleresMapa, setTalleresMapa] = useState({})
  const [credencial,   setCredencial]   = useState(null)
  const [cargando,     setCargando]     = useState(true)

  const [claseIndex,       setClaseIndex]       = useState(0)
  const [confirmado,       setConfirmado]        = useState(false)
  const [mostrarCalendario,setMostrarCalendario] = useState(false)
  const [horaColombia,     setHoraColombia]      = useState(getColombiaCurrentTime())

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
    const load = async () => {
      try {
        const [childRes, asistRes, wsRes, credRes] = await Promise.allSettled([
          getChild(studentId),
          getStudentAttendances(studentId),
          getWorkshops({}),
          getStudentCredentials(studentId),
        ])

        if (childRes.status === 'fulfilled') setNiño(childRes.value)

        const asist = asistRes.status === 'fulfilled' ? asistRes.value : []
        const sorted = [...asist].sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
        setAsistencias(sorted)

        const allWs = wsRes.status === 'fulfilled' ? wsRes.value : []
        const mapa = {}
        allWs.forEach(w => { mapa[String(w.id)] = w })
        setTalleresMapa(mapa)

        if (credRes.status === 'fulfilled') {
          const valida = credRes.value.find(c => c.status === 'valid') ?? null
          setCredencial(valida)
        }
      } catch {}
      finally { setCargando(false) }
    }
    load()
  }, [])

  /* Nombre e iniciales del estudiante */
  const nombre = niño ? (niño.firstName || 'Joven') : 'Joven'
  const apellido = niño?.lastName || ''
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

  /* Mes del calendario: mes de la asistencia más reciente */
  const { calYear, calMonth } = useMemo(() => {
    if (asistencias.length === 0) {
      const now = new Date()
      return { calYear: now.getFullYear(), calMonth: now.getMonth() + 1 }
    }
    const d = new Date(asistencias[0].attendedAt)
    return { calYear: d.getFullYear(), calMonth: d.getMonth() + 1 }
  }, [asistencias])

  const { calOffset, daysInMonth, attendedDays, totalAsistencias } = useMemo(() => {
    const firstDay = new Date(calYear, calMonth - 1, 1)
    const offset   = (firstDay.getDay() + 6) % 7   // Lu=0 … Do=6
    const total    = new Date(calYear, calMonth, 0).getDate()
    const attended = new Set()
    asistencias.forEach(a => {
      const d = new Date(a.attendedAt)
      if (d.getFullYear() === calYear && d.getMonth() + 1 === calMonth) {
        attended.add(d.getDate())
      }
    })
    return { calOffset: offset, daysInMonth: total, attendedDays: attended, totalAsistencias: attended.size }
  }, [asistencias, calYear, calMonth])

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

        {/* Calendario de asistencia */}
        <section className="acu-asistencia-card" aria-label="Asistencia">
          <div className="acu-asistencia-head">
            <h3 className="acu-card-titulo">
              Asistencia de {MESES_ES[calMonth - 1]}
            </h3>
            <span className="acu-asistencia-resumen">
              {totalAsistencias} {totalAsistencias === 1 ? 'clase' : 'clases'}
            </span>
          </div>
          <div className="acu-cal-grid" role="grid" aria-label={`Calendario de ${MESES_ES[calMonth - 1]}`}>
            {CAL_SEMANA.map(d => (
              <span key={d} className="acu-cal-head" role="columnheader">{d}</span>
            ))}
            {Array.from({ length: calOffset }).map((_, i) => (
              <span key={`e${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dia    = i + 1
              const asistio = attendedDays.has(dia)
              return (
                <span
                  key={dia}
                  className={`acu-cal-dia${asistio ? ' acu-cal-dia--vino' : ''}`}
                  role="gridcell"
                  aria-label={asistio ? `${dia}: asistió` : String(dia)}
                >
                  {dia}
                </span>
              )
            })}
          </div>
        </section>

        {/* Columna derecha */}
        <div className="acu-right-col">

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
        <button className="acu-logout" onClick={() => navigate('/login')}>
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default AcudienteHome
