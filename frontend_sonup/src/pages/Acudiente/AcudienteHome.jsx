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

/* ─── Calendar & Timezone Colombia ───────────────────────────────────────── */

const CAL_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const CAL_OFFSET = 1   // 1 oct 2024 = martes (lun=0)
const CAL_TOTAL  = 31

const MESES_ABR = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

// Obtiene la fecha YYYY-MM-DD en la zona horaria de Colombia (America/Bogota)
const getColombiaToday = () => {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date())
  const y = parts.find(p => p.type === 'year').value
  const m = parts.find(p => p.type === 'month').value
  const d = parts.find(p => p.type === 'day').value
  return `${y}-${m}-${d}`
}

const getColombiaCurrentTime = () => {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
}

const formatFechaLargaColombia = (dateStr) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

// Catálogo base de actividades
const ACTIVIDADES_BASE = [
  {
    modulo: 'Música',
    nombre: 'Ritmo con palmas',
    hora: '10:00 a. m.',
    objetivo: 'Practicar el pulso lento con el grupo usando palmas y percusión corporal.',
    para_llevar: 'Ropa cómoda y ganas de participar.',
  },
  {
    modulo: 'Artes',
    nombre: 'Mezcla de colores',
    hora: '2:00 p. m.',
    objetivo: 'Explorar combinaciones de colores primarios y secundarios con pintura acrílica.',
    para_llevar: 'Delantal o ropa vieja.',
  },
  {
    modulo: 'Panadería',
    nombre: 'Pan de queso',
    hora: '9:00 a. m.',
    objetivo: 'Seguir una receta sencilla usando apoyos visuales y trabajo colaborativo.',
    para_llevar: 'Cabello recogido y recipiente pequeño.',
  },
  {
    modulo: 'Música',
    nombre: 'Tambor y movimiento',
    hora: '10:00 a. m.',
    objetivo: 'Imitar ritmos guiados y coordinación motriz grupal.',
    para_llevar: 'Calzado cómodo y termo de agua.',
  },
  {
    modulo: 'Artes',
    nombre: 'Modelado con arcilla',
    hora: '2:00 p. m.',
    objetivo: 'Crear figuras geométricas para ejercitar motricidad fina.',
    para_llevar: 'Trapo limpio y delantal.',
  },
  {
    modulo: 'Panadería',
    nombre: 'Galletas de avena',
    hora: '9:00 a. m.',
    objetivo: 'Medir porciones y amasar con apoyo del tallerista.',
    para_llevar: 'Recipiente hermético.',
  },
]

// Genera las próximas 3 actividades a partir de una fecha YYYY-MM-DD
const generarProximasActividades = (fechaStr) => {
  const [year, month, day] = fechaStr.split('-').map(Number)
  const baseDate = new Date(year, month - 1, day)

  const diasOffset = [0, 3, 7]
  return diasOffset.map((offset, idx) => {
    const actDate = new Date(baseDate)
    actDate.setDate(baseDate.getDate() + offset)

    const diaNum = actDate.getDate()
    const mesAbr = MESES_ABR[actDate.getMonth()]
    const template = ACTIVIDADES_BASE[(actDate.getDay() + idx) % ACTIVIDADES_BASE.length]

    return {
      id: `act-${offset}-${diaNum}`,
      dia: diaNum,
      mes: mesAbr,
      modulo: template.modulo,
      nombre: template.nombre,
      hora: template.hora,
      objetivo: template.objetivo,
      para_llevar: template.para_llevar,
      fechaFull: actDate.toISOString().split('T')[0],
    }
  })
}

/* ─── Data Estática Asistencia ───────────────────────────────────────────── */

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
  const navigate = useNavigate()

  // Estado de fecha seleccionada en Colombia
  const [fechaSeleccionada, setFechaSeleccionada] = useState('2024-10-14')
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [horaColombia, setHoraColombia] = useState(getColombiaCurrentTime())

  // Actividades calculadas a partir de la fecha seleccionada
  const actividadesList = generarProximasActividades(fechaSeleccionada)
  const [actividadIndex, setActividadIndex] = useState(0)
  const [confirmado, setConfirmado] = useState(false)

  const actActual = actividadesList[actividadIndex] || actividadesList[0]
  const asistenciaMap = Object.fromEntries(ASISTENCIA.map(a => [a.dia, a.estado]))

  const handleSeleccionarFecha = (nuevaFecha) => {
    setFechaSeleccionada(nuevaFecha)
    setActividadIndex(0)
    setConfirmado(false)
    setHoraColombia(getColombiaCurrentTime())
    setMostrarCalendario(false)
  }

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

        {/* Botón y Popover del Calendario */}
        <div className="acu-cal-wrap">
          <button
            className={`acu-cal-btn${mostrarCalendario ? ' acu-cal-btn--activo' : ''}`}
            onClick={() => {
              setHoraColombia(getColombiaCurrentTime())
              setMostrarCalendario(v => !v)
            }}
            aria-label="Abrir calendario y seleccionar fecha"
            title="Seleccionar fecha (Zona horaria Colombia)"
            aria-expanded={mostrarCalendario}
          >
            <CalendarIcon />
          </button>

          {mostrarCalendario && (
            <div className="acu-cal-popover" role="dialog" aria-modal="true" aria-label="Selector de fecha">
              <div className="acu-cal-popover__head">
                <div className="acu-cal-popover__tz">
                  <span className="acu-cal-popover__bandera" aria-hidden="true">🇨🇴</span>
                  <div>
                    <p className="acu-cal-popover__tz-title">Hora Colombia (UTC-5)</p>
                    <p className="acu-cal-popover__tz-time">{horaColombia}</p>
                  </div>
                </div>
                <button
                  className="acu-cal-popover__close"
                  onClick={() => setMostrarCalendario(false)}
                  aria-label="Cerrar selector"
                >
                  ✕
                </button>
              </div>

              <div className="acu-cal-popover__body">
                <label className="acu-cal-popover__label" htmlFor="fecha-colombia-input">
                  Selecciona la fecha que deseas consultar:
                </label>
                <input
                  id="fecha-colombia-input"
                  type="date"
                  className="acu-cal-popover__input"
                  value={fechaSeleccionada}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSeleccionarFecha(e.target.value)
                    }
                  }}
                />

                <div className="acu-cal-popover__actions">
                  <button
                    type="button"
                    className="acu-cal-popover__btn-today"
                    onClick={() => handleSeleccionarFecha(getColombiaToday())}
                  >
                    Ver hoy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Próximas actividades — card grande, parte superior ── */}
      <section className="acu-actividades-card" aria-label="Próximas actividades">

        <div className="acu-actividades-head">
          <div className="acu-actividades-title-group">
            <h2 className="acu-actividades-titulo">Próximas actividades</h2>
            <p className="acu-actividades-sub">Toca una fecha para ver el detalle.</p>
          </div>

          {/* Badge de fecha activa en zona horaria Colombia */}
          <div className="acu-badge-tz" title="Zona horaria Colombia: America/Bogota">
            <span className="acu-badge-tz__icon" aria-hidden="true">📅</span>
            <span className="acu-badge-tz__text">
              Desde el: <strong>{formatFechaLargaColombia(fechaSeleccionada)}</strong>
            </span>
          </div>
        </div>

        <div className="acu-fechas">
          {actividadesList.map((f, idx) => (
            <button
              key={f.id}
              className={`acu-fecha-btn${actividadIndex === idx ? ' acu-fecha-btn--activo' : ''}`}
              onClick={() => { setActividadIndex(idx); setConfirmado(false) }}
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
              <p className="acu-preview__nombre">{actActual.nombre}</p>
              <p className="acu-preview__meta">{actActual.modulo} · {actActual.hora}</p>
            </div>
          </div>
          <div className="acu-preview__dato">
            <p className="acu-preview__dato-label">OBJETIVO</p>
            <p className="acu-preview__dato-valor">{actActual.objetivo}</p>
          </div>
          <div className="acu-preview__dato">
            <p className="acu-preview__dato-label">PARA LLEVAR</p>
            <p className="acu-preview__dato-valor">{actActual.para_llevar}</p>
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
            <button
              className="acu-btn-informe"
              onClick={() => navigate('/acudiente/informe')}
            >
              Ver informe
            </button>
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
