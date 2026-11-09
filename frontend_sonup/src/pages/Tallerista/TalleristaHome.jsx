import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getWorkshops }             from '../../services/workshops.js'
import { getWorkshopAttendances }   from '../../services/attendances.js'
import { getStudentCategoryAverages } from '../../services/skills.js'
import { getStudentCredentials }    from '../../services/credentials.js'
import { getStudentEvidences }      from '../../services/evidences.js'
import './TalleristaHome.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const StarSmIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const MedalSmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)
const VideoSmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const DownloadSmIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const ChevronRightSmIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function getCurrentDate() {
  const raw = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const formatFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

/* ─── Component ──────────────────────────────────────────────────────────── */

const TalleristaHome = () => {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [talleres,     setTalleres]     = useState([])
  const [tallerMapa,   setTallerMapa]   = useState({})
  const [asistencias,  setAsistencias]  = useState([])
  const [catAverages,  setCatAverages]  = useState([])
  const [credenciales, setCredenciales] = useState([])
  const [evidencias,   setEvidencias]   = useState([])
  const [cargando,     setCargando]     = useState(true)

  useEffect(() => {
    const evaluatorId = session?.saga?.professionalId
    const load = async () => {
      try {
        /* 1 — Talleres del evaluador */
        const ws = await getWorkshops(evaluatorId ? { evaluatorId } : {})
        setTalleres(ws)
        const mapa = {}
        ws.forEach(t => { mapa[String(t.id)] = t.name })
        setTallerMapa(mapa)

        /* 2 — Asistencias de todos los talleres → set de studentIds */
        const asistRes = await Promise.allSettled(ws.map(t => getWorkshopAttendances(t.id)))
        const todasAsist = []
        const studentIdSet = new Set()
        asistRes.forEach(r => {
          if (r.status === 'fulfilled') r.value.forEach(a => {
            todasAsist.push(a)
            studentIdSet.add(String(a.studentId))
          })
        })
        setAsistencias(todasAsist)

        /* 3 — Datos por estudiante en paralelo */
        const ids = [...studentIdSet]
        const [catRes, credRes, evidRes] = await Promise.all([
          Promise.allSettled(ids.map(id => getStudentCategoryAverages(id))),
          Promise.allSettled(ids.map(id => getStudentCredentials(id))),
          Promise.allSettled(ids.map(id => getStudentEvidences(id))),
        ])

        const allCats = []
        catRes.forEach(r => { if (r.status === 'fulfilled') allCats.push(...r.value) })
        setCatAverages(allCats)

        const credMap = new Map()
        credRes.forEach(r => { if (r.status === 'fulfilled') r.value.forEach(c => credMap.set(String(c.id), c)) })
        setCredenciales([...credMap.values()])

        const evidMap = new Map()
        evidRes.forEach(r => { if (r.status === 'fulfilled') r.value.forEach(e => evidMap.set(String(e.id), e)) })
        setEvidencias([...evidMap.values()])

      } catch { /* silencioso — datos parciales */ }
      finally  { setCargando(false) }
    }
    load()
  }, [session?.saga?.professionalId])

  /* ── Derivados ── */

  const talleresActivos = useMemo(() =>
    talleres.filter(t => t.status === 'active'), [talleres])

  const primerTaller = talleresActivos[0] ?? null

  const estudiantesPorTaller = useMemo(() => {
    const m = {}
    asistencias.forEach(a => {
      const id = String(a.workshopId)
      if (!m[id]) m[id] = new Set()
      m[id].add(String(a.studentId))
    })
    return m
  }, [asistencias])

  const totalEstudiantes = useMemo(() =>
    new Set(asistencias.map(a => String(a.studentId))).size,
    [asistencias]
  )

  const asistMes = useMemo(() => {
    const now = new Date()
    return asistencias.filter(a => {
      const d = new Date(a.attendedAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [asistencias])

  const groupProgress = useMemo(() => {
    if (!catAverages.length) return 0
    const avg = catAverages.reduce((s, c) => s + c.average, 0) / catAverages.length
    return Math.round((avg / 5) * 100)
  }, [catAverages])

  const totalSkillsEvaluated = useMemo(() =>
    catAverages.reduce((s, c) => s + c.skillCount, 0), [catAverages])

  const ultimaSesion = useMemo(() => {
    if (!asistencias.length) return null
    return [...asistencias].sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))[0]
  }, [asistencias])

  const seguimiento = useMemo(() =>
    [...asistencias]
      .filter(a => a.observation)
      .sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
      .slice(0, 3)
      .map(a => ({
        fecha: formatFechaCorta(a.attendedAt),
        desc:  a.observation,
        meta:  tallerMapa[String(a.workshopId)] ?? `Taller ${a.workshopId}`,
      })),
    [asistencias, tallerMapa]
  )

  const recursos = useMemo(() => [
    ...credenciales.slice(0, 1).map(c => ({
      tipo: 'cert', titulo: c.organizationName,
      meta: `Certificado · ${c.createdAt ? formatFechaCorta(c.createdAt) : '—'}`,
      ruta: '/tallerista/certificados',
    })),
    ...evidencias.slice(0, 1).map(e => ({
      tipo: 'video', titulo: e.title,
      meta: `Evidencia · ${e.createdAt ? formatFechaCorta(e.createdAt) : '—'}`,
      ruta: '/tallerista/evidencias',
    })),
  ], [credenciales, evidencias])

  return (
    <div className="tl-home">

      {/* Header */}
      <header className="tl-header">
        <div>
          <h1 className="tl-header__greeting">{getGreeting()}, {session?.user?.username?.split(' ')?.[0] || 'Tallerista'}</h1>
          <p className="tl-header__sub">Aquí tienes lo más importante para hoy.</p>
        </div>
      </header>

      {cargando ? (
        <p style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
          Cargando…
        </p>
      ) : (
        <>
          {/* Hero — taller activo */}
          <section className="tl-hero-card" aria-label="Taller activo">
            <div className="tl-hero-card__deco" aria-hidden="true">
              <span className="tl-hero-deco tl-hero-deco--lg" />
              <span className="tl-hero-deco tl-hero-deco--sm" />
            </div>
            <div className="tl-hero-card__content">
              <p className="tl-hero-card__tag">
                {primerTaller ? 'TALLER ACTIVO' : 'SIN TALLERES ACTIVOS'}
              </p>
              <h2 className="tl-hero-card__title">
                {primerTaller ? primerTaller.name : 'No hay talleres activos'}
              </h2>
              {primerTaller && (
                <p className="tl-hero-card__sub">
                  {estudiantesPorTaller[String(primerTaller.id)]?.size ?? 0} participantes
                  {primerTaller.startsAt
                    ? ` · desde ${formatFechaCorta(primerTaller.startsAt)}`
                    : ''
                  }
                </p>
              )}
            </div>
            {primerTaller && (
              <button
                className="tl-hero-card__btn"
                aria-label="Registrar sesión de clase"
                onClick={() => navigate('/tallerista/talleres')}
              >
                Registrar sesión
              </button>
            )}
          </section>

          {/* Stats */}
          <div className="tl-stats-grid" role="region" aria-label="Estadísticas">
            <div className="tl-stat-card">
              <p className="tl-stat-card__label">Asistencias este mes</p>
              <p className="tl-stat-card__value">{asistMes.length}</p>
              <p className="tl-stat-card__detail">{totalEstudiantes} participantes en total</p>
            </div>
            <div className="tl-stat-card">
              <p className="tl-stat-card__label">Habilidades valoradas</p>
              <p className="tl-stat-card__value tl-stat-card__value--orange">{totalSkillsEvaluated}</p>
              <p className="tl-stat-card__detail">Acumulado todos los talleres</p>
            </div>
          </div>

          {/* Fila 1: Jornada + Progreso */}
          <div className="tl-bottom-grid">

            <section className="tl-jornada-card" aria-label="Talleres activos">
              <div className="tl-jornada-card__header">
                <h3 className="tl-jornada-card__title">Tu jornada</h3>
                <p className="tl-jornada-card__date">{getCurrentDate()}</p>
              </div>
              {talleresActivos.length === 0 ? (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>
                  Sin talleres activos programados.
                </p>
              ) : (
                <ul className="tl-jornada-list" role="list">
                  {talleresActivos.slice(0, 3).map((t, i) => (
                    <li key={String(t.id)} className="tl-jornada-item">
                      <span className="tl-jornada-item__time">{String(i + 1).padStart(2, '0')}</span>
                      <span
                        className={`tl-jornada-item__dot tl-jornada-item__dot--${i === 0 ? 'teal' : 'orange'}`}
                        aria-hidden="true"
                      />
                      <div className="tl-jornada-item__info">
                        <p className="tl-jornada-item__name">{t.name}</p>
                        <p className="tl-jornada-item__meta">
                          {estudiantesPorTaller[String(t.id)]?.size ?? 0} participantes
                        </p>
                      </div>
                      <button
                        className="tl-jornada-item__btn"
                        aria-label={`Abrir ${t.name}`}
                        onClick={() => navigate('/tallerista/talleres')}
                      >Abrir</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tl-progreso-card" aria-label="Progreso del grupo">
              <h3 className="tl-progreso-card__title">Progreso del grupo</h3>
              <p className="tl-progreso-card__sub">
                {primerTaller ? primerTaller.name : 'Todos los talleres'} · general
              </p>
              <div
                className="tl-progreso-row"
                role="progressbar"
                aria-valuenow={groupProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso ${groupProgress}%`}
              >
                <div className="tl-progreso-bar">
                  <div className="tl-progreso-bar__fill" style={{ width: `${groupProgress}%` }} />
                </div>
                <span className="tl-progreso-bar__pct">{groupProgress}%</span>
              </div>
              <p className="tl-progreso-card__detail">{totalSkillsEvaluated} indicadores valorados</p>
              <div className="tl-progreso-highlights">
                {ultimaSesion && (
                  <div className="tl-progreso-highlight">
                    <ClockIcon />
                    <span>Última sesión: {formatFechaCorta(ultimaSesion.attendedAt)}</span>
                  </div>
                )}
                <div className="tl-progreso-highlight">
                  <StarSmIcon /><span>Indicadores al día: {totalSkillsEvaluated}</span>
                </div>
              </div>
            </section>

          </div>

          {/* Fila 2: Seguimiento + Recursos */}
          <div className="tl-bottom-grid">

            <section className="tl-seg-card" aria-label="Seguimiento reciente">
              <h3 className="tl-seg-card__titulo">Seguimiento reciente</h3>
              {seguimiento.length === 0 ? (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>
                  Sin observaciones registradas aún.
                </p>
              ) : (
                <ul className="tl-seg-list" role="list">
                  {seguimiento.map((s, i) => (
                    <li key={i} className="tl-seg-item">
                      <span className="tl-seg-item__fecha">{s.fecha}</span>
                      <div className="tl-seg-item__content">
                        <p className="tl-seg-item__desc">{s.desc}</p>
                        <p className="tl-seg-item__meta">{s.meta}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tl-certs-card" aria-label="Certificados y apoyo gráfico">
              <div className="tl-certs-head">
                <h3 className="tl-certs-head__titulo">Certificados y apoyo gráfico</h3>
                <button className="tl-ver-todo" onClick={() => navigate('/tallerista/certificados')}>
                  Ver todo
                </button>
              </div>
              <p className="tl-certs-sub">Recursos recientes</p>
              {recursos.length === 0 ? (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
                  Sin recursos aún.
                </p>
              ) : (
                <div className="tl-recursos-list">
                  {recursos.map((r, i) => (
                    <div key={i} className="tl-rec-item">
                      <div className="tl-rec-item__icono">
                        {r.tipo === 'cert' ? <MedalSmIcon /> : <VideoSmIcon />}
                      </div>
                      <div className="tl-rec-item__info">
                        <p className="tl-rec-item__titulo">{r.titulo}</p>
                        <p className="tl-rec-item__meta">{r.meta}</p>
                      </div>
                      <button
                        className="tl-rec-item__btn"
                        onClick={() => navigate(r.ruta)}
                        aria-label={r.tipo === 'cert' ? 'Ver certificado' : 'Ver evidencia'}
                      >
                        {r.tipo === 'cert' ? <DownloadSmIcon /> : <ChevronRightSmIcon />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </>
      )}

    </div>
  )
}

export default TalleristaHome
