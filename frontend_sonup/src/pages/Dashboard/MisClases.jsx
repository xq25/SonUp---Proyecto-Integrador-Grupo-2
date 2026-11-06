import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudentAttendances } from '../../services/attendances.js'
import { getWorkshops } from '../../services/workshops.js'
import Logo from '../../components/Logo/Logo'
import './MisClases.css'

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

const MusicIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function agruparPorMes(asistencias) {
  const grupos = {}
  asistencias.forEach(a => {
    const d = new Date(a.attendedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!grupos[key]) grupos[key] = { label: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`, items: [] }
    grupos[key].items.push(a)
  })
  return Object.values(grupos)
}

/* ─── Component ──────────────────────────────────────────────────────────── */

const MisClases = () => {
  const navigate = useNavigate()
  const [asistencias,  setAsistencias]  = useState([])
  const [talleresMapa, setTalleresMapa] = useState({})
  const [tallerActivo, setTallerActivo] = useState(null)
  const [cargando,     setCargando]     = useState(true)

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
    const load = async () => {
      try {
        const [asistRes, wsRes] = await Promise.allSettled([
          getStudentAttendances(studentId),
          getWorkshops({}),
        ])

        const asist = asistRes.status === 'fulfilled' ? asistRes.value : []
        const sorted = [...asist].sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
        setAsistencias(sorted)

        const allWs = wsRes.status === 'fulfilled' ? wsRes.value : []
        const mapa = {}
        allWs.forEach(w => { mapa[String(w.id)] = w })
        setTalleresMapa(mapa)

        const attendedIds = new Set(asist.map(a => String(a.workshopId)))
        const activo = allWs.find(w => w.status === 'active' && attendedIds.has(String(w.id)))
        const ultimo = allWs.find(w => attendedIds.has(String(w.id)))
        setTallerActivo(activo ?? ultimo ?? null)

      } catch {}
      finally { setCargando(false) }
    }
    load()
  }, [])

  const grupos = useMemo(() => agruparPorMes(asistencias), [asistencias])

  return (
    <div className="mc-page">

      {/* Top bar */}
      <header className="mc-topbar">
        <button className="mc-topbar__back" onClick={() => navigate('/dashboard')} aria-label="Volver al inicio">
          <ChevronLeftIcon />
        </button>
        <h1 className="mc-topbar__title">Mis clases</h1>
        <button className="mc-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Hero — taller activo */}
      {!cargando && tallerActivo && (
        <section className="mc-hero" aria-label="Próxima clase">
          <div className="mc-hero__icon-wrap" aria-hidden="true">
            <MusicIcon />
          </div>
          <div className="mc-hero__content">
            <p className="mc-hero__tag">PRÓXIMA CLASE</p>
            <p className="mc-hero__title">{tallerActivo.name}</p>
            {tallerActivo.startsAt && (
              <p className="mc-hero__sub">
                Desde {new Date(tallerActivo.startsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <span className="mc-hero__deco" aria-hidden="true" />
        </section>
      )}

      {/* Lista de clases */}
      {cargando ? (
        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
          Cargando clases…
        </p>
      ) : grupos.length === 0 ? (
        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
          Aún no hay clases registradas.
        </p>
      ) : grupos.map(grupo => (
        <section key={grupo.label} className="mc-section" aria-label={`Clases de ${grupo.label}`}>
          <h2 className="mc-section__month">{grupo.label}</h2>
          <ul className="mc-grid" role="list">
            {grupo.items.map(a => {
              const d    = new Date(a.attendedAt)
              const dia  = d.getDate()
              const mes  = MESES_ES[d.getMonth()].slice(0, 3).toUpperCase()
              const ws   = talleresMapa[String(a.workshopId)]
              const tema = a.observation || ws?.name || `Taller ${a.workshopId}`
              return (
                <li key={String(a.id)} className="mc-clase-card mc-clase-card--done">
                  <div className="mc-clase-card__fecha" aria-label={`${dia} de ${mes}`}>
                    <span className="mc-clase-card__dia">{dia}</span>
                    <span className="mc-clase-card__mes">{mes}</span>
                  </div>
                  <div className="mc-clase-card__info">
                    <p className="mc-clase-card__materia">{ws?.name ?? `Taller ${a.workshopId}`}</p>
                    <p className="mc-clase-card__tema">{tema}</p>
                  </div>
                  <div className="mc-clase-card__estado mc-clase-card__estado--done" aria-label="Asistida">
                    <CheckIcon />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {/* Footer */}
      <footer className="mc-footer">
        <button className="mc-logout" onClick={() => navigate('/login')} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default MisClases
