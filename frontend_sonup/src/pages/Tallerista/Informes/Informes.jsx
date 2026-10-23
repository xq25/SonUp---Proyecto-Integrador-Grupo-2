import { useState } from 'react'
import Logo from '../../../components/Logo/Logo'
import './Informes.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#176D65"/>
    <polyline points="6,12 10,16 18,8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PendingCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="none" stroke="#F49A18" strokeWidth="2"/>
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ─── Mock data ──────────────────────────────────────────────────────────── */

const DIMENSIONES = [
  { nombre: 'Cognitiva',    logrado: 3, total: 5, pct: { logrado: 60, enProceso: 28, necesita: 12 } },
  { nombre: 'Comunicativa', logrado: 2, total: 4, pct: { logrado: 50, enProceso: 30, necesita: 20 } },
  { nombre: 'Corporal',     logrado: 1, total: 2, pct: { logrado: 50, enProceso: 40, necesita: 10 } },
  { nombre: 'Social',       logrado: 1, total: 1, pct: { logrado: 100,enProceso: 0,  necesita: 0  } },
]

const FIRMAS = [
  { nombre: 'Laura Ríos',      rol: 'Tallerista de Música' },
  { nombre: 'Felipe Arango',   rol: 'Tallerista de Artes'  },
  { nombre: 'Carmen Valencia', rol: 'Docente'              },
]

const CHECKLIST = [
  { label: 'Valoraciones de Música',    estado: 'Completas',  ok: true  },
  { label: 'Valoraciones de Artes',     estado: 'Completas',  ok: true  },
  { label: 'Valoraciones de Panadería', estado: 'Pendiente',  ok: false },
  { label: 'Revisión del docente',      estado: 'Pendiente',  ok: false },
  { label: 'Firmas',                    estado: 'Pendiente',  ok: false },
]

/* ─── Sub-component: Barras de progreso ──────────────────────────────────── */

const BarrasProgreso = () => (
  <div className="barras-card">
    <div className="barras-card__cabecera">
      <div>
        <p className="barras-card__titulo">Progreso por dimensión</p>
        <p className="barras-card__sub">Distribución de los indicadores valorados en Música</p>
      </div>
      <div className="barras-leyenda">
        <span className="barras-leyenda__item"><span className="dot dot--logrado" />Logrado</span>
        <span className="barras-leyenda__item"><span className="dot dot--proceso" />En proceso</span>
        <span className="barras-leyenda__item"><span className="dot dot--necesita"/>Necesita refuerzo</span>
      </div>
    </div>

    {DIMENSIONES.map(d => (
      <div key={d.nombre} className="barras-fila">
        <div className="barras-info">
          <span className="barras-nombre">{d.nombre}</span>
          <span className="barras-detalle">{d.logrado} de {d.total} logrados</span>
        </div>
        <div className="barras-pista">
          <div className="barras-seg barras-seg--logrado"  style={{ width: `${d.pct.logrado}%`    }} />
          <div className="barras-seg barras-seg--proceso"  style={{ width: `${d.pct.enProceso}%`  }} />
          <div className="barras-seg barras-seg--necesita" style={{ width: `${d.pct.necesita}%`   }} />
        </div>
        <span className="barras-pct">{d.pct.logrado}%</span>
      </div>
    ))}
  </div>
)

/* ─── Component ──────────────────────────────────────────────────────────── */

const Informes = () => {
  const handleDescargarPDF = () => window.print()
  const [mostrarEnviar, setMostrarEnviar] = useState(false)

  return (
    <div className="inf-page">

      {/* ── Header ── */}
      <header className="inf-header no-print">
        <div>
          <h1 className="inf-header__titulo">Informe del primer semestre 2026</h1>
          <p className="inf-header__sub">Mariana Gómez · se arma con las valoraciones y anotaciones de clase</p>
        </div>
        <div className="inf-header__acciones">
          <button className="btn-descargar" onClick={handleDescargarPDF}>
            <DownloadIcon /> Descargar PDF
          </button>
          <button className="btn-enviar" onClick={() => setMostrarEnviar(true)}>
            <SendIcon /> Enviar a la familia
          </button>
        </div>
      </header>

      {/* ── Cuerpo ── */}
      <div className="inf-body">

        {/* ── Documento ── */}
        <article className="inf-documento" id="inf-doc-print">

          {/* Cabecera del documento */}
          <div className="doc-cabecera">
            <Logo />
            <div className="doc-cabecera__derecha">
              <p className="doc-cabecera__tag">INFORME DEL PRIMER SEMESTRE 2026</p>
              <p className="doc-cabecera__fecha">Fecha: 12 de octubre de 2026</p>
            </div>
          </div>
          <div className="doc-linea" />

          {/* Datos del participante */}
          <div className="doc-meta">
            <div className="doc-meta__campo">
              <span className="doc-meta__label">Nombre</span>
              <span className="doc-meta__valor">Mariana Gómez</span>
            </div>
            <div className="doc-meta__campo">
              <span className="doc-meta__label">Edad</span>
              <span className="doc-meta__valor">24 años</span>
            </div>
            <div className="doc-meta__campo">
              <span className="doc-meta__label">Talleres</span>
              <span className="doc-meta__valor">Música, Artes y Panadería</span>
            </div>
          </div>
          <hr className="doc-separador" />

          {/* Cómo es */}
          <section className="doc-seccion">
            <h2 className="doc-seccion__titulo">Cómo es Mariana</h2>
            <p className="doc-texto">
              Es <span className="doc-highlight">tranquila, expresiva y respetuosa</span>. Es responsable con las actividades que se le proponen y
              <span className="doc-highlight"> trabaja mejor en pareja</span>. Se ubica bien en el espacio; todavía le cuesta ubicarse en la fecha del día.
            </p>
          </section>

          {/* Música */}
          <section className="doc-seccion">
            <h2 className="doc-seccion__titulo">Música</h2>
            <p className="doc-texto">
              Desde que ingresó al taller su desarrollo va en aumento.{' '}
              <span className="doc-highlight">Sigue el pulso lento sin ayuda</span> y está empezando a{' '}
              <span className="doc-highlight">seguir el ritmo rápido</span>.
            </p>
            <BarrasProgreso />
          </section>

          {/* Artes */}
          <section className="doc-seccion">
            <h2 className="doc-seccion__titulo">Artes</h2>
            <p className="doc-texto">
              Terminó su primer lienzo con{' '}
              <span className="doc-highlight">fondos y mezcla de colores</span>. Sigue las instrucciones de
              limpieza y organización de los materiales.
            </p>
          </section>

          {/* Recomendaciones */}
          <section className="doc-seccion">
            <h2 className="doc-seccion__titulo">Recomendaciones para la casa</h2>
            <p className="doc-texto">
              Practicar con canciones que le gusten, marcando el pulso con palmas. Repasar con ella la fecha del día en el calendario cada mañana.
            </p>
          </section>

          {/* Firmas */}
          <div className="doc-firmas">
            {FIRMAS.map(f => (
              <div key={f.nombre} className="doc-firma">
                <div className="doc-firma__linea" />
                <p className="doc-firma__nombre">{f.nombre}</p>
                <p className="doc-firma__rol">{f.rol}</p>
              </div>
            ))}
          </div>

        </article>

        {/* ── Panel derecho ── */}
        <aside className="inf-lateral no-print">

          <div className="card">
            <h3 className="card-titulo-sm">Antes de enviar</h3>
            <ul className="checklist" role="list">
              {CHECKLIST.map(item => (
                <li key={item.label} className="checklist-item">
                  <span className="checklist-item__icono">
                    {item.ok ? <CheckCircleIcon /> : <PendingCircleIcon />}
                  </span>
                  <div>
                    <p className="checklist-item__label">{item.label}</p>
                    <p className={`checklist-item__estado${item.ok ? ' checklist-item__estado--ok' : ''}`}>
                      {item.estado}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 className="card-titulo-sm">Quién lo recibe</h3>
            <p className="quien-texto">
              La familia lo recibe en su cuenta y por correo. La anamnesis y las
              notas internas no salen en el informe.
            </p>
          </div>

        </aside>

      </div>
      {/* ── Modal enviar a la familia ── */}
      {mostrarEnviar && (
        <div className="inf-modal-overlay" onClick={() => setMostrarEnviar(false)} role="dialog" aria-modal="true">
          <div className="inf-modal" onClick={e => e.stopPropagation()}>

            <div className="inf-modal__head">
              <div>
                <p className="inf-modal__tag">CORREO A LA FAMILIA</p>
                <h2 className="inf-modal__titulo">Enviar informe</h2>
              </div>
              <button className="inf-modal__close" onClick={() => setMostrarEnviar(false)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="inf-modal__campos">
              <div className="inf-modal__campo">
                <label className="inf-modal__label">Para</label>
                <input
                  type="email"
                  className="inf-modal__input"
                  defaultValue="patricia.gomez@correo.com"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="inf-modal__campo">
                <label className="inf-modal__label">Asunto</label>
                <input
                  type="text"
                  className="inf-modal__input"
                  defaultValue="Informe del primer semestre 2026 — Mariana Gómez"
                />
              </div>
              <div className="inf-modal__campo">
                <label className="inf-modal__label">Mensaje</label>
                <textarea
                  className="inf-modal__textarea"
                  rows={5}
                  defaultValue={`Estimada familia,\n\nAdjunto encontrarán el informe del primer semestre 2026 de Mariana. En él encontrarán un resumen de sus logros, avances y recomendaciones para el hogar.\n\nQuedamos atentos a cualquier pregunta.\n\nEquipo Son Up`}
                />
              </div>
              <p className="inf-modal__nota">
                El informe se adjuntará automáticamente como PDF al enviar.
              </p>
            </div>

            <div className="inf-modal__acciones">
              <button className="inf-modal__btn-cancelar" onClick={() => setMostrarEnviar(false)}>
                Cancelar
              </button>
              <button className="inf-modal__btn-enviar" disabled>
                <SendIcon /> Enviar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Informes
