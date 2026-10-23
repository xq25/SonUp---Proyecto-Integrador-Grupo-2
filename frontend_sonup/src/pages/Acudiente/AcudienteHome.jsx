import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

/* ─── Calendar ───────────────────────────────────────────────────────────── */

const CAL_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const CAL_OFFSET = 1   // 1 oct 2024 = martes (lun=0)
const CAL_TOTAL  = 31

/* ─── Data ───────────────────────────────────────────────────────────────── */

const FECHAS = [
  { id: 'musica',    dia: 14, mes: 'OCT', modulo: 'Música'   },
  { id: 'artes',     dia: 18, mes: 'OCT', modulo: 'Artes'    },
  { id: 'panaderia', dia: 21, mes: 'OCT', modulo: 'Panadería' },
]

const ACTIVIDADES = {
  musica:    { nombre: 'Ritmo con palmas',   modulo: 'Música',    hora: '10:00 a. m.', objetivo: 'Practicar el pulso lento con el grupo usando palmas y percusión corporal.',          para_llevar: 'Ropa cómoda y ganas de participar.' },
  artes:     { nombre: 'Mezcla de colores',  modulo: 'Artes',     hora: '2:00 p. m.',  objetivo: 'Explorar combinaciones de colores primarios y secundarios con pintura acrílica.',   para_llevar: 'Delantal o ropa vieja.' },
  panaderia: { nombre: 'Pan de queso',       modulo: 'Panadería', hora: '9:00 a. m.',  objetivo: 'Seguir una receta sencilla usando apoyos visuales y trabajo colaborativo.',         para_llevar: 'Cabello recogido y recipiente pequeño.' },
}

const ASISTENCIA = [
  { dia: 3,  estado: 'vino'  },
  { dia: 4,  estado: 'vino'  },
  { dia: 10, estado: 'vino'  },
  { dia: 11, estado: 'falto' },
  { dia: 17, estado: 'vino'  },
  { dia: 18, estado: 'vino'  },
]

const SEGUIMIENTO = [
  { texto: 'Siguió el ritmo rápido sola por primera vez.',   modulo: 'Música', fecha: '10 oct' },
  { texto: 'Terminó su lienzo y explicó los colores que usó.', modulo: 'Artes',  fecha: '3 oct'  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const AcudienteHome = () => {
  const navigate                    = useNavigate()
  const [fechaActiva, setFechaActiva] = useState('panaderia')
  const [confirmado,  setConfirmado]  = useState(false)

  const act           = ACTIVIDADES[fechaActiva]
  const asistenciaMap = Object.fromEntries(ASISTENCIA.map(a => [a.dia, a.estado]))

  return (
    <div className="acu-page">

      {/* Header */}
      <header className="acu-header">
        <div className="acu-header__perfil">
          <div className="acu-avatar" aria-hidden="true">MG</div>
          <div>
            <h1 className="acu-nombre">Mariana</h1>
            <p className="acu-modulos">Música, Artes y Panadería</p>
          </div>
        </div>
        <button className="acu-cal-btn" aria-label="Ver calendario">
          <CalendarIcon />
        </button>
      </header>

      {/* ── Próximas actividades — card grande, parte superior ── */}
      <section className="acu-actividades-card" aria-label="Próximas actividades">

        <div className="acu-actividades-head">
          <h2 className="acu-actividades-titulo">Próximas actividades</h2>
          <p className="acu-actividades-sub">Toca una fecha para ver el detalle.</p>
        </div>

        <div className="acu-fechas">
          {FECHAS.map(f => (
            <button
              key={f.id}
              className={`acu-fecha-btn${fechaActiva === f.id ? ' acu-fecha-btn--activo' : ''}`}
              onClick={() => { setFechaActiva(f.id); setConfirmado(false) }}
            >
              <span className="acu-fecha-mes">{f.mes}</span>
              <span className="acu-fecha-dia">{f.dia}</span>
              <span className="acu-fecha-modulo">{f.modulo}</span>
            </button>
          ))}
        </div>

        <div className="acu-preview">
          <p className="acu-preview__tag">PREVISUALIZACIÓN DE LA ACTIVIDAD</p>
          <div className="acu-preview__fila">
            <div className="acu-preview__icono"><LayersIcon /></div>
            <div>
              <p className="acu-preview__nombre">{act.nombre}</p>
              <p className="acu-preview__meta">{act.modulo} · {act.hora}</p>
            </div>
          </div>
          <div className="acu-preview__dato">
            <p className="acu-preview__dato-label">OBJETIVO</p>
            <p className="acu-preview__dato-valor">{act.objetivo}</p>
          </div>
          <div className="acu-preview__dato">
            <p className="acu-preview__dato-label">PARA LLEVAR</p>
            <p className="acu-preview__dato-valor">{act.para_llevar}</p>
          </div>
          <button
            className={`acu-confirmar-btn${confirmado ? ' acu-confirmar-btn--ok' : ''}`}
            onClick={() => setConfirmado(v => !v)}
          >
            {confirmado ? '✓  Confirmado' : 'Confirmar que lo vi'}
          </button>
        </div>

      </section>

      {/* ── Fila inferior ── */}
      <div className="acu-bottom-grid">

        {/* Asistencia — calendario — izquierda */}
        <section className="acu-asistencia-card" aria-label="Asistencia">
          <div className="acu-asistencia-head">
            <h3 className="acu-card-titulo">Asistencia de octubre</h3>
            <span className="acu-asistencia-resumen">5 de 6 clases</span>
          </div>
          <div className="acu-cal-grid" role="grid" aria-label="Calendario de octubre">
            {CAL_SEMANA.map(d => (
              <span key={d} className="acu-cal-head" role="columnheader">{d}</span>
            ))}
            {Array.from({ length: CAL_OFFSET }).map((_, i) => (
              <span key={`e${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: CAL_TOTAL }, (_, i) => {
              const dia    = i + 1
              const estado = asistenciaMap[dia]
              return (
                <span
                  key={dia}
                  className={`acu-cal-dia${estado ? ` acu-cal-dia--${estado}` : ''}`}
                  role="gridcell"
                  aria-label={estado ? `${dia}: ${estado === 'vino' ? 'asistió' : 'faltó'}` : String(dia)}
                >
                  {dia}
                </span>
              )
            })}
          </div>
        </section>

        {/* Columna derecha: Informe + Seguimiento */}
        <div className="acu-right-col">

          <section className="acu-informe-card" aria-label="Informe del semestre">
            <div className="acu-informe-card__top">
              <FileIcon />
              <div>
                <p className="acu-informe-titulo">Ya está el informe del semestre</p>
                <p className="acu-informe-fecha">Firmado el 12 de octubre</p>
              </div>
            </div>
            <button className="acu-btn-informe">Ver informe</button>
          </section>

          <section className="acu-seg-card" aria-label="Notas de profes">
            <h3 className="acu-card-titulo">Lo que contaron sus profes</h3>
            <ul className="acu-seg-list" role="list">
              {SEGUIMIENTO.map((s, i) => (
                <li key={i} className="acu-seg-item">
                  <span className="acu-seg-icono"><FileIcon /></span>
                  <div>
                    <p className="acu-seg-texto">{s.texto}</p>
                    <p className="acu-seg-meta">{s.modulo} · {s.fecha}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>

      {/* Nota privacidad */}
      <p className="acu-privacidad">
        Solo ves la información de Mariana. Las notas internas del equipo no aparecen aquí.
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
