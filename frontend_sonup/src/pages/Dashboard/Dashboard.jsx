import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo/Logo'
import Icon from '../../components/Sidebar/icons.jsx'
import { getChild } from '../../services/children.js'
import { getStudentAttendances } from '../../services/attendances.js'
import { getStudentCategoryAverages } from '../../services/skills.js'
import { getWorkshops, completeWorkshopsFromAttendances } from '../../services/workshops.js'
import './Dashboard.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */


const MusicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

const StarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const VideoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const MedalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/* ─── Component ──────────────────────────────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate()
  const { activeChildId, logout } = useAuth()
  const cerrarSesion = () => { logout(); navigate('/login', { replace: true }) }

  const [niño,         setNiño]         = useState(null)
  const [proximaClase, setProximaClase] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [tallereNombre, setTallerNombre] = useState('')
  const [cargando,     setCargando]     = useState(true)
  const [errorCarga,   setErrorCarga]   = useState('')

  useEffect(() => {
    const studentId = activeChildId
    if (!studentId) { setCargando(false); return } // sin id todavía (Saga despertando o cuenta sin enlazar)
    const load = async () => {
      try {
        const [child, attendances, categoryAverages, workshopsActivos] = await Promise.all([
          getChild(studentId),
          getStudentAttendances(studentId),
          getStudentCategoryAverages(studentId),
          getWorkshops({}),
        ])

        setNiño(child)
        // Los talleres ya finalizados no vienen en el listado del joven: se completan por id
        const workshops = await completeWorkshopsFromAttendances(workshopsActivos, attendances)

        setCalificaciones(
          (categoryAverages ?? []).map(cat => ({
            name:      cat.categoryName ?? `Categoría ${cat.categoryId ?? ''}`,
            scaleName: cat.scale?.name  ?? (cat.average != null ? String(cat.average) : '—'),
          }))
        )

        const attendedIds = new Set(
          attendances.map(a => String(a.workshopId))
        )
        const activo = workshops.find(w => w.status === 'active' && attendedIds.has(String(w.id)))
        const cualquiera = activo ?? workshops.find(w => attendedIds.has(String(w.id))) ?? null
        setProximaClase(cualquiera)
        setTallerNombre(cualquiera?.name ?? '')

      } catch (error) {
        setErrorCarga(`No se pudo cargar el progreso del estudiante: ${error.message}`)
      }
      finally { setCargando(false) }
    }
    load()
  }, [activeChildId])

  const nombre = niño
    ? (niño.firstName || [niño.firstName, niño.lastName].filter(Boolean).join(' ') || 'Joven')
    : 'Joven'

  const MODULOS = [
    { id: 'logros',       label: 'Lo que logré',    icon: <StarIcon />,     variante: 'accent',   ruta: '/joven/lo-que-logre'    },
    { id: 'videos',       label: 'Mis fotos y videos',       icon: <VideoIcon />,    variante: 'default',  ruta: '/joven/mis-videos'       },
    { id: 'certificados', label: 'Mis certificados', icon: <MedalIcon />,    variante: 'default',  ruta: '/joven/mis-certificados' },
    { id: 'clases',       label: 'Mis clases',       icon: <CalendarIcon />, variante: 'default',  ruta: '/joven/mis-clases'       },
    { id: 'disponibles',  label: 'Talleres disponibles', icon: <Icon name="list" size={28} />, variante: 'default', ruta: '/joven/talleres' },
    { id: 'datos',        label: 'Mis datos',        icon: <Icon name="user" size={28} />, variante: 'default', ruta: '/joven/perfil' },
  ]

  return (
    <div className="joven-page">

      {/* Header */}
      <header className="joven-header">
        <Logo />
      </header>

      {/* Saludo */}
      <div className="joven-saludo">
        <h1 className="joven-saludo__titulo">¡Hola, {nombre}!</h1>
        <p className="joven-saludo__sub">¿Qué quieres ver hoy?</p>
      </div>
      {errorCarga && <p className="joven-error" role="alert">{errorCarga}</p>}

      {/* Hero — próxima clase */}
      {!cargando && !errorCarga && (
        <button
          className="joven-musica-card"
          aria-label={proximaClase ? `Ir a ${proximaClase.name}` : 'Mis clases'}
          onClick={() => navigate('/joven/mis-clases')}
        >
          <div className="joven-musica-card__icono"><MusicIcon /></div>
          <div className="joven-musica-card__content">
            <p className="joven-musica-card__tag">MI PRÓXIMA CLASE</p>
            <p className="joven-musica-card__titulo">
              {proximaClase ? proximaClase.name : 'Ver mis clases'}
            </p>
            {proximaClase?.startsAt && (
              <p className="joven-musica-card__sub">
                Desde {new Date(proximaClase.startsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <span className="joven-musica-card__deco" aria-hidden="true" />
        </button>
      )}

      {/* Los módulos en grid (el joven no tiene sidebar) */}
      <div className="joven-modulos" role="list">
        {MODULOS.map(m => (
          <button
            key={m.id}
            className={`joven-modulo joven-modulo--${m.variante}`}
            role="listitem"
            onClick={() => m.ruta && navigate(m.ruta)}
          >
            <div className="joven-modulo__icono">{m.icon}</div>
            <p className="joven-modulo__label">{m.label}</p>
          </button>
        ))}
      </div>

      {/* Card de logros */}
      {!cargando && (
        <div className="joven-logros-card">
          <div className="joven-logros-card__info">
            <h2 className="joven-logros-card__titulo">
              {tallereNombre ? `Calificaciones · ${tallereNombre}` : 'Mis calificaciones'}
            </h2>
            <p className="joven-logros-card__sub">Estado de tus habilidades, según la escala registrada</p>
          </div>
          <div className="joven-calificaciones" aria-label="Calificaciones por escala">
            {calificaciones.length ? calificaciones.map(({ name, scaleName }) => (
              <span className="joven-calificacion" key={name}>
                <strong>{name}</strong>
                <span>{scaleName}</span>
              </span>
            )) : (
              <span className="joven-logros-card__sub">Aún no tienes calificaciones registradas.</span>
            )}
          </div>
        </div>
      )}

      {/* Pie */}
      <footer className="joven-footer">
        <button className="joven-logout" onClick={cerrarSesion}>
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default Dashboard
