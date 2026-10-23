import { useNavigate } from 'react-router-dom'
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

/* ─── Static data ────────────────────────────────────────────────────────── */

const SEGUIMIENTO = [
  { fecha: '10 oct', desc: 'Siguió el ritmo rápido sola por primera vez.',                meta: 'Música · Laura R.'            },
  { fecha: '3 oct',  desc: 'Participó con mayor autonomía en la actividad grupal.',       meta: 'Música · Equipo pedagógico'   },
  { fecha: '26 sep', desc: 'Respondió positivamente al uso de la secuencia visual.',      meta: 'Música · Seguimiento'         },
]

const RECURSOS = [
  { tipo: 'cert',  titulo: 'Proceso musical',                              meta: 'Certificado · 12 horas',  ruta: '/tallerista/certificados' },
  { tipo: 'video', titulo: 'Siguió el ritmo rápido sola por primera vez.', meta: 'Video · 10 de octubre',   ruta: '/tallerista/evidencias'   },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const TalleristaHome = () => {
  const navigate = useNavigate()

  return (
    <div className="tl-home">

      {/* Header */}
      <header className="tl-header">
        <div>
          <h1 className="tl-header__greeting">{getGreeting()}, Laura</h1>
          <p className="tl-header__sub">Aquí tienes lo más importante para hoy.</p>
        </div>
      </header>

      {/* Hero — próxima clase */}
      <section className="tl-hero-card" aria-label="Próxima clase">
        <div className="tl-hero-card__deco" aria-hidden="true">
          <span className="tl-hero-deco tl-hero-deco--lg" />
          <span className="tl-hero-deco tl-hero-deco--sm" />
        </div>
        <div className="tl-hero-card__content">
          <p className="tl-hero-card__tag">PRÓXIMA CLASE · 10:00 A. M.</p>
          <h2 className="tl-hero-card__title">Música con Mariana y su grupo</h2>
          <p className="tl-hero-card__sub">Ritmo con palmas y tamboor · Salón 3</p>
        </div>
        <button
          className="tl-hero-card__btn"
          aria-label="Registrar sesión de clase"
          onClick={() => navigate('/tallerista/talleres')}
        >
          Registrar sesión
        </button>
      </section>

      {/* Stats */}
      <div className="tl-stats-grid" role="region" aria-label="Estadísticas del mes">
        <div className="tl-stat-card">
          <p className="tl-stat-card__label">Asistencia del mes</p>
          <p className="tl-stat-card__value">87%</p>
          <p className="tl-stat-card__detail">52 de 60 asistencias</p>
        </div>
        <div className="tl-stat-card">
          <p className="tl-stat-card__label">Valoraciones pendientes</p>
          <p className="tl-stat-card__value tl-stat-card__value--orange">8</p>
          <p className="tl-stat-card__detail">Primer período 2026</p>
        </div>
      </div>

      {/* Fila 1: Jornada + Progreso */}
      <div className="tl-bottom-grid">

        <section className="tl-jornada-card" aria-label="Jornada de hoy">
          <div className="tl-jornada-card__header">
            <h3 className="tl-jornada-card__title">Tu jornada</h3>
            <p className="tl-jornada-card__date">{getCurrentDate()}</p>
          </div>
          <ul className="tl-jornada-list" role="list">
            <li className="tl-jornada-item">
              <span className="tl-jornada-item__time">10:00</span>
              <span className="tl-jornada-item__dot tl-jornada-item__dot--teal" aria-hidden="true" />
              <div className="tl-jornada-item__info">
                <p className="tl-jornada-item__name">Música · Grupo A</p>
                <p className="tl-jornada-item__meta">10 participantes · Salón 3</p>
              </div>
              <button
                className="tl-jornada-item__btn"
                aria-label="Abrir sesión Música Grupo A"
                onClick={() => navigate('/tallerista/talleres')}
              >Abrir</button>
            </li>
            <li className="tl-jornada-item">
              <span className="tl-jornada-item__time">2:00</span>
              <span className="tl-jornada-item__dot tl-jornada-item__dot--orange" aria-hidden="true" />
              <div className="tl-jornada-item__info">
                <p className="tl-jornada-item__name">Valoración individual</p>
                <p className="tl-jornada-item__meta">Mariana Gómez</p>
              </div>
              <button
                className="tl-jornada-item__btn"
                aria-label="Abrir valoración Mariana Gómez"
                onClick={() => navigate('/tallerista/participante')}
              >Abrir</button>
            </li>
          </ul>
        </section>

        <section className="tl-progreso-card" aria-label="Progreso del grupo">
          <h3 className="tl-progreso-card__title">Progreso del grupo</h3>
          <p className="tl-progreso-card__sub">Música · primer período</p>
          <div className="tl-progreso-row"
            role="progressbar" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso 72%">
            <div className="tl-progreso-bar">
              <div className="tl-progreso-bar__fill" style={{ width: '72%' }} />
            </div>
            <span className="tl-progreso-bar__pct">72%</span>
          </div>
          <p className="tl-progreso-card__detail">106 de 150 indicadores valorados</p>
          <div className="tl-progreso-highlights">
            <div className="tl-progreso-highlight">
              <ClockIcon /><span>Última sesión: Lunes 13 oct</span>
            </div>
            <div className="tl-progreso-highlight">
              <StarSmIcon /><span>Indicadores al día: 106</span>
            </div>
          </div>
        </section>

      </div>

      {/* Fila 2: Seguimiento + Certificados */}
      <div className="tl-bottom-grid">

        <section className="tl-seg-card" aria-label="Seguimiento reciente">
          <h3 className="tl-seg-card__titulo">Seguimiento reciente de Música</h3>
          <ul className="tl-seg-list" role="list">
            {SEGUIMIENTO.map((s, i) => (
              <li key={i} className="tl-seg-item">
                <span className="tl-seg-item__fecha">{s.fecha}</span>
                <div className="tl-seg-item__content">
                  <p className="tl-seg-item__desc">{s.desc}</p>
                  <p className="tl-seg-item__meta">{s.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="tl-certs-card" aria-label="Certificados y apoyo gráfico">
          <div className="tl-certs-head">
            <h3 className="tl-certs-head__titulo">Certificados y apoyo gráfico</h3>
            <button
              className="tl-ver-todo"
              onClick={() => navigate('/tallerista/certificados')}
            >Ver todo</button>
          </div>
          <p className="tl-certs-sub">Recursos de Música</p>
          <div className="tl-recursos-list">
            {RECURSOS.map((r, i) => (
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
                  aria-label={r.tipo === 'cert' ? 'Descargar certificado' : 'Ver evidencia'}
                >
                  {r.tipo === 'cert' ? <DownloadSmIcon /> : <ChevronRightSmIcon />}
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>

    </div>
  )
}

export default TalleristaHome
