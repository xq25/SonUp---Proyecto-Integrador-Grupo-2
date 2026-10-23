import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ParticipantePerfil.css'

/* ─── Mock data ──────────────────────────────────────────────────────────── */

const participante = {
  iniciales: 'MG',
  nombre:    'Mariana Gómez',
  edad:      24,
  grupo:     'Grupo jóvenes',
  nivel:     'Nivel 2 · En progreso',
  acudiente: {
    nombre:   'Patricia Gómez · mamá',
    autoriza: 'Autoriza fotos y vídeos',
  },
}

const MODULOS = ['Música', 'Artes', 'Panadería', 'Lectoescritura']

const habilidades = [
  { nombre: 'Cognitiva',    logrado: 3, total: 5 },
  { nombre: 'Comunicativa', logrado: 2, total: 5 },
  { nombre: 'Corporal',     logrado: 1, total: 3 },
  { nombre: 'Social',       logrado: 1, total: 2 },
]

const indicadores = [
  { periodo: '2025-1', logrados: 4, total: 15 },
  { periodo: '2025-2', logrados: 6, total: 15 },
  { periodo: '2026-1', logrados: 7, total: 15 },
]

const apoyos = ['Instrucciones cortas', 'Práctica guiada', 'Grupos pequeños', 'Apoyos visuales']

const ANAMNESIS_DETALLE = {
  diagnostico:   'Discapacidad intelectual leve. Evaluada por equipo interdisciplinar en 2023.',
  comunicacion:  ['Comunicación verbal simple', 'Apoyos visuales', 'Lenguaje sencillo'],
  cognitivo:     ['Instrucciones cortas', 'Práctica guiada', 'Repetición con variación'],
  social:        ['Grupos pequeños', 'Rol activo definido', 'Mediación entre pares'],
  observaciones: 'Responde bien a rutinas estructuradas. Prefiere ver el resultado final. Sensibilidad en ambientes ruidosos.',
  actualizacion: 'Laura Ríos · 15 sep 2026',
}

const seguimiento = [
  { fecha: '10 oct', texto: 'Siguió el ritmo rápido sola por primera vez.',           tag: 'Música · Laura R.' },
  { fecha: '3 oct',  texto: 'Participó con mayor autonomía en la actividad grupal.',   tag: 'Música · Equipo pedagógico' },
  { fecha: '26 sep', texto: 'Respondió positivamente al uso de la secuencia visual.', tag: 'Música · Seguimiento' },
]

const certificados = [
  { nombre: 'Proceso musical',                               tipo: 'Certificado · 12 horas', variante: 'cert'  },
  { nombre: 'Siguió el ritmo rápido sola por primera vez.',  tipo: 'Video · 10 de octubre',  variante: 'video' },
]

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const CertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
)

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

/* ─── Component ──────────────────────────────────────────────────────────── */

const ParticipantePerfil = () => {
  const navigate = useNavigate()
  const [moduloActivo, setModuloActivo] = useState('Música')
  const [verMas,       setVerMas]       = useState(false)

  return (
    <div className="perfil-page">

      {/* ── Header ── */}
      <header className="perfil-header">
        <div>
          <h1 className="perfil-header__title">Perfil del participante</h1>
          <p className="perfil-header__subtitle">Información organizada por módulo formativo</p>
        </div>
        <button
          className="btn-informe"
          onClick={() => navigate('/tallerista/informes')}
        >
          <FileTextIcon />
          Generar informe
        </button>
      </header>

      {/* ── Body ── */}
      <div className="perfil-body">

        {/* ── Sidebar ── */}
        <aside className="perfil-sidebar">

          {/* Tarjeta de perfil */}
          <div className="card">
            <div className="perfil-avatar">{participante.iniciales}</div>
            <h2 className="perfil-nombre">{participante.nombre}</h2>
            <p className="perfil-meta">{participante.edad} años · {participante.grupo}</p>
            <span className="perfil-nivel">{participante.nivel}</span>

            <div className="perfil-acudiente">
              <span className="perfil-acudiente__label">Acudiente</span>
              <p className="perfil-acudiente__nombre">{participante.acudiente.nombre}</p>
              <p className="perfil-acudiente__dato">{participante.acudiente.autoriza}</p>
            </div>
          </div>

          {/* Tarjeta de progreso */}
          <div className="card">
            <div className="progreso-header">
              <span className="progreso-titulo">Progreso en {moduloActivo}</span>
              <span className="progreso-pct">47%</span>
            </div>
            <p className="progreso-sub">Según las valoraciones registradas</p>

            <ul className="barras-lista" role="list">
              {habilidades.map(h => (
                <li key={h.nombre} className="barra-item">
                  <div className="barra-fila">
                    <span className="barra-nombre">{h.nombre}</span>
                    <span className="barra-ratio">{h.logrado} de {h.total}</span>
                  </div>
                  <div className="barra-track">
                    <div
                      className="barra-fill"
                      style={{ width: `${(h.logrado / h.total) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </aside>

        {/* ── Contenido principal ── */}
        <section className="perfil-content">

          {/* Tabs de módulo */}
          <div className="modulo-tabs" role="tablist">
            {MODULOS.map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={moduloActivo === m}
                className={`modulo-tab${moduloActivo === m ? ' modulo-tab--activo' : ''}`}
                onClick={() => setModuloActivo(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* ── Grid: indicadores (izq) + certificados (der) ── */}
          <div className="perfil-indicadores-fila">

          <div className="card">
            <div className="indicadores-cabecera">
              <h3 className="card-titulo">Indicadores logrados en {moduloActivo}</h3>
              <button className="btn-descargar-grafica" aria-label="Descargar gráfico">
                <DownloadIcon />
                Descargar
              </button>
            </div>
            <div className="grafica">
              {indicadores.map((d, i) => {
                const esActual = i === indicadores.length - 1
                const pct = (d.logrados / d.total) * 100
                return (
                  <div key={d.periodo} className="grafica__col">
                    <span className="grafica__valor">{d.logrados}/{d.total}</span>
                    <div className="grafica__pista">
                      <div
                        className={`grafica__barra${esActual ? ' grafica__barra--actual' : ''}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="grafica__periodo">{d.periodo}</span>
                  </div>
                )
              })}
            </div>
            <p className="grafica__nota">
              Se cuentan solo los indicadores con valor Logrado. El período actual sigue abierto.
            </p>
          </div>

            {/* Certificado + Apoyo gráfico — columna derecha del grid */}
            <div className="perfil-fila-derecha">

              <div className="card">
                <div className="cert-cabecera">
                  <h3 className="card-titulo">Certificado</h3>
                  <button className="btn-ver-todo" onClick={() => navigate('/tallerista/certificados')}>Ver todo</button>
                </div>
                <p className="cert-sub">Recursos de {moduloActivo}</p>
                <div className="cert-item">
                  <span className="cert-icono"><CertIcon /></span>
                  <div className="cert-info">
                    <p className="cert-nombre">Proceso musical</p>
                    <p className="cert-tipo">Certificado · 12 horas</p>
                  </div>
                  <button
                    className="cert-accion-btn"
                    onClick={() => navigate('/tallerista/certificados')}
                    aria-label="Descargar certificado"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="card-titulo">Apoyo gráfico</h3>
                <p className="cert-sub">Videos de {moduloActivo}</p>
                <div className="cert-item">
                  <span className="cert-icono"><VideoIcon /></span>
                  <div className="cert-info">
                    <p className="cert-nombre">Siguió el ritmo rápido sola por primera vez.</p>
                    <p className="cert-tipo">Video · 10 de octubre</p>
                  </div>
                  <button
                    className="cert-accion-btn"
                    onClick={() => navigate('/tallerista/evidencias')}
                    aria-label="Ver video"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
              </div>

            </div>
          </div>{/* /perfil-indicadores-fila */}

          {/* Información prioritaria */}
          <div className="card card--prioritaria">
            <div className="prioritaria-cuerpo">
              <div>
                <p className="prioritaria-tag">Información prioritaria · Uso interno</p>
                <h3 className="prioritaria-titulo">Anamnesis y perfil de apoyo</h3>
                <p className="prioritaria-apoyos">{apoyos.join(' · ')}</p>
              </div>
              <button className="btn-ver-mas" onClick={() => setVerMas(v => !v)}>
                {verMas ? 'Ver menos ↑' : 'Ver más ↓'}
              </button>
            </div>

            {verMas && (
              <div className="anamnesis-expandida">
                <p className="anamnesis-dx">{ANAMNESIS_DETALLE.diagnostico}</p>
                <div className="anamnesis-grupos">
                  <div className="anamnesis-grupo">
                    <p className="anamnesis-grupo__titulo">Apoyos comunicativos</p>
                    <div className="anamnesis-tags">
                      {ANAMNESIS_DETALLE.comunicacion.map(t => <span key={t} className="anamnesis-tag">{t}</span>)}
                    </div>
                  </div>
                  <div className="anamnesis-grupo">
                    <p className="anamnesis-grupo__titulo">Apoyos cognitivos</p>
                    <div className="anamnesis-tags">
                      {ANAMNESIS_DETALLE.cognitivo.map(t => <span key={t} className="anamnesis-tag">{t}</span>)}
                    </div>
                  </div>
                  <div className="anamnesis-grupo">
                    <p className="anamnesis-grupo__titulo">Apoyos sociales</p>
                    <div className="anamnesis-tags">
                      {ANAMNESIS_DETALLE.social.map(t => <span key={t} className="anamnesis-tag">{t}</span>)}
                    </div>
                  </div>
                </div>
                <p className="anamnesis-obs">{ANAMNESIS_DETALLE.observaciones}</p>
                <p className="anamnesis-update">Actualizado por: {ANAMNESIS_DETALLE.actualizacion}</p>
              </div>
            )}
          </div>

          {/* Seguimiento reciente — ancho completo */}
          <div className="card">
            <h3 className="card-titulo">Seguimiento reciente de {moduloActivo}</h3>
            <ul className="seguimiento-lista" role="list">
              {seguimiento.map((s, i) => (
                <li key={i} className="seguimiento-item">
                  <span className="seguimiento-fecha">{s.fecha}</span>
                  <div>
                    <p className="seguimiento-texto">{s.texto}</p>
                    <p className="seguimiento-tag">{s.tag}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ParticipantePerfil
