import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Habilidades.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const LayersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const RouteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
)
const TrendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const TallerSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const JuegoSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Data ───────────────────────────────────────────────────────────────── */

const MODULOS = ['Música', 'Artes', 'Panadería', 'Educación física']
const GRUPOS  = ['Jóvenes · Grupo A', 'Jóvenes · Grupo B', 'Adultos · Grupo A']

const STATS = [
  { icon: <LayersIcon />, valor: '4',          label: 'Dimensiones del árbol'   },
  { icon: <StarIcon />,   valor: '12',         label: 'Habilidades disponibles'  },
  { icon: <RouteIcon />,  valor: '2',          label: 'Orígenes de evaluación'   },
  { icon: <TrendIcon />,  valor: 'Individual', label: 'Historial por joven'      },
]

const PASOS = [
  { n: 1, titulo: 'Actividad',   sub: 'Define el módulo y el origen'    },
  { n: 2, titulo: 'Habilidades', sub: 'Selecciona qué se trabaja'        },
  { n: 3, titulo: 'Medición',    sub: 'Configura escala o ponderación'   },
  { n: 4, titulo: 'Resumen',     sub: 'Revisa y publica la configuración' },
]

const ORIGENES = [
  {
    id:     'sonup',
    titulo: 'Taller Son-Up',
    desc:   'El tallerista registra asistencia, evidencia y valoración.',
    icon:   <TallerSvg />,
  },
  {
    id:     'aulaup',
    titulo: 'Juego Aula-Up',
    desc:   'Aula-Up envía finalización y progreso ponderado.',
    icon:   <JuegoSvg />,
  },
]

const DIMENSIONES = [
  {
    id: 'cog', codigo: 'CO', nombre: 'Cognitiva',
    desc: 'Comprensión, atención y solución de situaciones.',
    habilidades: [
      { id: 'COG-01', nombre: 'Atención sostenida',        desc: 'Mantiene el foco durante una actividad.',        categoria: 'Atención'      },
      { id: 'COG-02', nombre: 'Seguimiento de secuencias', desc: 'Completa instrucciones en el orden esperado.',   categoria: 'Procesamiento' },
      { id: 'COG-03', nombre: 'Resolución de problemas',   desc: 'Busca alternativas ante una dificultad.',       categoria: 'Razonamiento'  },
    ],
  },
  {
    id: 'com', codigo: 'CO', nombre: 'Comunicativa',
    desc: 'Comprensión, expresión e interacción.',
    habilidades: [
      { id: 'COM-01', nombre: 'Comprensión de instrucciones', desc: 'Comprende indicaciones orales o visuales.',       categoria: 'Comprensión'       },
      { id: 'COM-02', nombre: 'Expresión de necesidades',     desc: 'Comunica lo que necesita durante la actividad.',  categoria: 'Expresión'         },
      { id: 'COM-03', nombre: 'Interacción con pares',        desc: 'Participa en intercambios con el grupo.',         categoria: 'Interacción'       },
    ],
  },
  {
    id: 'cor', codigo: 'CO', nombre: 'Corporal',
    desc: 'Coordinación, ritmo y control del movimiento.',
    habilidades: [
      { id: 'COR-01', nombre: 'Coordinación visomotora', desc: 'Coordina la mirada y el movimiento.',           categoria: 'Coordinación' },
      { id: 'COR-02', nombre: 'Motricidad fina',         desc: 'Manipula objetos con precisión.',               categoria: 'Motricidad'   },
      { id: 'COR-03', nombre: 'Ritmo y movimiento',      desc: 'Ajusta movimientos a un ritmo propuesto.',      categoria: 'Ritmo'        },
    ],
  },
  {
    id: 'soc', codigo: 'SO', nombre: 'Socioemocional',
    desc: 'Autonomía, participación y regulación.',
    habilidades: [
      { id: 'SOC-01', nombre: 'Trabajo colaborativo',     desc: 'Participa y respeta turnos en equipo.',                categoria: 'Participación social' },
      { id: 'SOC-02', nombre: 'Autonomía',                desc: 'Realiza tareas con apoyos progresivamente menores.',   categoria: 'Autonomía'            },
      { id: 'SOC-03', nombre: 'Manejo de la frustración', desc: 'Retoma la actividad después de una dificultad.',       categoria: 'Regulación'           },
    ],
  },
]

const TODAS_HAB = DIMENSIONES.flatMap(d => d.habilidades)

const DIM_MAP = Object.fromEntries(
  DIMENSIONES.flatMap(d => d.habilidades.map(h => [h.id, d.nombre]))
)
const DIM_CODE_MAP = Object.fromEntries(
  DIMENSIONES.flatMap(d => d.habilidades.map(h => [h.id, d.codigo]))
)
const HAB_CAT_MAP = Object.fromEntries(
  DIMENSIONES.flatMap(d => d.habilidades.map(h => [h.id, h.categoria]))
)

const ESCALA = [
  { id: 'I',  nombre: 'Iniciado',          desc: 'Se acerca a la habilidad con apoyo permanente.'       },
  { id: 'EP', nombre: 'En proceso',         desc: 'La realiza parcialmente o con apoyo ocasional.'       },
  { id: 'NR', nombre: 'Necesita refuerzo',  desc: 'Requiere una estrategia o acompañamiento diferente.'  },
  { id: 'L',  nombre: 'Logrado',            desc: 'La demuestra de manera consistente y autónoma.'       },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const Habilidades = () => {
  const navigate = useNavigate()
  const [fase,      setFase]      = useState(1)
  const [modulo,    setModulo]    = useState('Música')
  const [grupo,     setGrupo]     = useState('Jóvenes · Grupo A')
  const [nombre,    setNombre]    = useState('Secuencias de ritmo y memoria')
  const [objetivo,  setObjetivo]  = useState(
    'Fortalecer el seguimiento de secuencias, la comprensión de instrucciones y el trabajo colaborativo.'
  )
  const [origen,        setOrigen]        = useState('sonup')
  const [seleccionadas, setSeleccionadas] = useState(new Set(['COG-02', 'COM-01', 'SOC-01']))
  const [momentoVal,    setMomentoVal]    = useState('cierre')
  const [responsable,   setResponsable]   = useState('tallerista')
  const [regla,         setRegla]         = useState('reciente')

  const toggleHab = (id) => {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const habsSel = TODAS_HAB.filter(h => seleccionadas.has(h.id))

  const crearOtra = () => {
    setFase(1)
    setNombre('')
    setObjetivo('')
    setOrigen('sonup')
    setSeleccionadas(new Set())
    setMomentoVal('cierre')
    setResponsable('tallerista')
    setRegla('reciente')
  }

  return (
    <div className="hab-page">

      {/* ── Header ── */}
      <header className="hab-header">
        <div>
          <h1 className="hab-header__titulo">Habilidades, actividades y juegos</h1>
          <p className="hab-header__sub">Configura qué se trabaja, cómo se mide y cómo se integra con Aula-Up.</p>
        </div>
        <div className="hab-header__acciones">
          <button className="btn-hab-borrador">Guardar borrador</button>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="hab-stats">
        {STATS.map((s, i) => (
          <div key={i} className="hab-stat">
            <div className="hab-stat__icono">{s.icon}</div>
            <div>
              <p className="hab-stat__valor">{s.valor}</p>
              <p className="hab-stat__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stepper ── */}
      <div className="hab-stepper" role="list">
        {PASOS.map(p => {
          const done   = fase > p.n
          const activo = fase === p.n
          return (
            <div
              key={p.n}
              className={[
                'hab-paso',
                activo ? 'hab-paso--activo' : '',
                done   ? 'hab-paso--done'   : '',
              ].filter(Boolean).join(' ')}
              role="listitem"
            >
              <div className={[
                'hab-paso__circulo',
                activo ? '' : done ? 'hab-paso__circulo--done' : 'hab-paso__circulo--inactivo',
              ].filter(Boolean).join(' ')}>
                {done ? <CheckIcon /> : p.n}
              </div>
              <div className="hab-paso__info">
                <span className={`hab-paso__titulo${(!activo && !done) ? ' hab-paso__titulo--inactivo' : ''}`}>
                  {p.titulo}
                </span>
                <span className={`hab-paso__sub${(!activo && !done) ? ' hab-paso__sub--inactivo' : ''}`}>
                  {p.sub}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Body ── */}
      {fase === 1 && (
        <div className="hab-body">

          {/* Formulario */}
          <div className="hab-form">
            <div className="hab-form__head">
              <h2 className="hab-form__titulo">Datos de la actividad</h2>
              <p className="hab-form__sub">
                Este registro podrá convertirse en{' '}
                <span className="hab-enlace">taller de Son-Up</span> o{' '}
                <span className="hab-enlace">configuración para Aula-Up</span>.
              </p>
            </div>

            <div className="hab-fila-2">
              <div className="hab-campo">
                <label className="hab-label">Módulo formativo</label>
                <select className="hab-select" value={modulo} onChange={e => setModulo(e.target.value)}>
                  {MODULOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="hab-campo">
                <label className="hab-label">Grupo</label>
                <select className="hab-select" value={grupo} onChange={e => setGrupo(e.target.value)}>
                  {GRUPOS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="hab-campo">
              <label className="hab-label">Nombre de la actividad o juego</label>
              <input
                type="text" className="hab-input" value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Secuencias de ritmo y memoria"
              />
            </div>

            <div className="hab-campo">
              <label className="hab-label">Objetivo general</label>
              <textarea
                className="hab-textarea" value={objetivo} rows={4}
                onChange={e => setObjetivo(e.target.value)}
                placeholder="Describe el objetivo de la actividad..."
              />
            </div>

            <div className="hab-campo">
              <label className="hab-label">Origen del resultado</label>
              <div className="origen-grid">
                {ORIGENES.map(o => (
                  <button
                    key={o.id} type="button"
                    className={`origen-card${origen === o.id ? ' origen-card--sel' : ''}`}
                    onClick={() => setOrigen(o.id)}
                  >
                    <div className="origen-card__icono">{o.icon}</div>
                    <div className="origen-card__info">
                      <p className="origen-card__titulo">{o.titulo}</p>
                      <p className="origen-card__desc">{o.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aside fase 1 */}
          <aside className="hab-aside">
            <p className="hab-aside__tag">RESPONSABILIDADES</p>
            <h3 className="hab-aside__titulo">Un criterio común, dos flujos distintos</h3>
            <hr className="hab-aside__sep" />
            <div className="hab-resp">
              <div className="hab-resp__item">
                <p className="hab-resp__titulo">Son-Up define</p>
                <p className="hab-resp__desc">Árbol de habilidades, escalas, ponderaciones e historial individual.</p>
              </div>
              <div className="hab-resp__item">
                <p className="hab-resp__titulo">Cada módulo define</p>
                <p className="hab-resp__desc">Su recorrido de evaluación y la forma de presentar sus actividades.</p>
              </div>
              <div className="hab-resp__item">
                <p className="hab-resp__titulo">Aula-Up entrega</p>
                <p className="hab-resp__desc">Actividad completada, porcentaje de progreso y resultado por habilidad.</p>
              </div>
            </div>
            <button className="btn-continuar-hab" onClick={() => setFase(2)}>
              Continuar a habilidades
            </button>
          </aside>

        </div>
      )}

      {fase === 4 && (
        <div className="hab-body">

          {/* Resumen card */}
          <div className="resumen-card">
            <div className="resumen-card__head">
              <p className="resumen-card__tag">RESUMEN Y PUBLICACIÓN</p>
              <div className="resumen-card__title-row">
                <h2 className="resumen-card__titulo">{nombre}</h2>
                <span className="resumen-badge-origen">
                  {origen === 'sonup' ? 'Taller Son-Up' : 'Juego Aula-Up'}
                </span>
              </div>
            </div>

            <div className="resumen-info-grid">
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Módulo</p>
                <p className="resumen-info-item__valor">{modulo}</p>
              </div>
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Grupo</p>
                <p className="resumen-info-item__valor">{grupo}</p>
              </div>
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Habilidades</p>
                <p className="resumen-info-item__valor">{seleccionadas.size} seleccionadas</p>
              </div>
              <div className="resumen-info-item">
                <p className="resumen-info-item__label">Medición</p>
                <p className="resumen-info-item__valor">Escala I / EP / NR / L</p>
              </div>
            </div>

            <div className="resumen-habs-section">
              <p className="resumen-habs-titulo">Habilidades que se trabajarán</p>
              <ul className="resumen-hab-list" role="list">
                {habsSel.map(h => (
                  <li key={h.id} className="resumen-hab-item">
                    <span className="resumen-hab-item__badge">{DIM_CODE_MAP[h.id]}</span>
                    <div className="resumen-hab-item__info">
                      <p className="resumen-hab-item__nombre">{h.nombre}</p>
                      <p className="resumen-hab-item__sub">{DIM_MAP[h.id]} · {HAB_CAT_MAP[h.id]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="resumen-footer">
              <TrendIcon />
              <p className="resumen-footer__texto">
                Esta configuración quedará disponible para registrar sesiones y seguimiento individual.
              </p>
            </div>
          </div>

          {/* Aside fase 4 */}
          <aside className="hab-aside">
            <p className="hab-aside__tag">LISTO PARA CONTINUAR</p>
            <h3 className="hab-aside__titulo">Crear el taller</h3>
            <p className="hab-aside__hint">
              Revisa que todo esté en orden antes de publicar esta configuración.
            </p>
            <ul className="resumen-checks" role="list">
              <li className="resumen-check-item">
                <span className="resumen-check-item__icono"><CheckIcon /></span>
                <span className="resumen-check-item__texto">Datos de la actividad</span>
              </li>
              <li className="resumen-check-item">
                <span className="resumen-check-item__icono"><CheckIcon /></span>
                <span className="resumen-check-item__texto">Habilidades seleccionadas</span>
              </li>
              <li className="resumen-check-item">
                <span className="resumen-check-item__icono"><CheckIcon /></span>
                <span className="resumen-check-item__texto">Medición configurada</span>
              </li>
            </ul>
            <button
              className="btn-continuar-hab"
              onClick={() => navigate('/tallerista/talleres')}
            >
              Crear taller con esta configuración
            </button>
            <button className="btn-rec-nueva" onClick={crearOtra}>
              Configurar otra actividad
            </button>
          </aside>

        </div>
      )}

      {fase === 3 && (
        <div className="hab-body">

          {/* Escala card */}
          <div className="med-card">
            <div className="med-card__head">
              <div>
                <h2 className="med-card__titulo">Escala para talleres</h2>
                <p className="med-card__sub">El tallerista conserva su flujo de evaluación por módulo.</p>
              </div>
              <span className="med-badge-sonup">Son-Up</span>
            </div>

            <div className="escala-grid">
              {ESCALA.map(e => (
                <div key={e.id} className="escala-item">
                  <span className={`escala-item__badge escala-item__badge--${e.id.toLowerCase()}`}>{e.id}</span>
                  <p className="escala-item__nombre">{e.nombre}</p>
                  <p className="escala-item__desc">{e.desc}</p>
                </div>
              ))}
            </div>

            <div className="hab-fila-2">
              <div className="hab-campo">
                <label className="hab-label">Momento de valoración</label>
                <select className="hab-select" value={momentoVal} onChange={e => setMomentoVal(e.target.value)}>
                  <option value="cierre">Al cierre de cada sesión</option>
                  <option value="inicio">Al inicio de la sesión</option>
                  <option value="actividad">Por actividad</option>
                </select>
              </div>
              <div className="hab-campo">
                <label className="hab-label">Responsable</label>
                <select className="hab-select" value={responsable} onChange={e => setResponsable(e.target.value)}>
                  <option value="tallerista">Tallerista del módulo</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="ambos">Tallerista y coordinador</option>
                </select>
              </div>
            </div>

            <div className="hab-campo">
              <label className="hab-label">Regla de actualización</label>
              <select className="hab-select" value={regla} onChange={e => setRegla(e.target.value)}>
                <option value="reciente">La valoración más reciente actualiza el estado</option>
                <option value="promedio">El promedio de sesiones actualiza el estado</option>
                <option value="mejor">La mejor valoración registrada se mantiene</option>
              </select>
            </div>
          </div>

          {/* Aside fase 3 */}
          <aside className="hab-aside">
            <p className="hab-aside__tag">CONTRATO VISUAL · AULA-UP</p>
            <h3 className="hab-aside__titulo">Resultado esperado</h3>
            <p className="hab-aside__hint">
              Aula-Up define su experiencia, pero devuelve estos criterios comunes.
            </p>
            <div className="contrato-code">
              <div className="contrato-row">
                <span className="contrato-key">participantId</span>
                <span className="contrato-val">MG-024</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">activityId</span>
                <span className="contrato-val contrato-val--accent">AULA-RITMO-03</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">completed</span>
                <span className="contrato-val contrato-val--teal">true</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">progress</span>
                <span className="contrato-val contrato-val--teal">78%</span>
              </div>
              <div className="contrato-row">
                <span className="contrato-key">skills</span>
                <span className="contrato-val contrato-val--accent">{seleccionadas.size} resultados</span>
              </div>
            </div>
            <button className="btn-continuar-hab" onClick={() => setFase(4)}>
              Ver resumen
            </button>
          </aside>

        </div>
      )}

      {fase === 2 && (
        <div className="hab-body">

          {/* Grid de dimensiones */}
          <div className="dims-grid">
            {DIMENSIONES.map(dim => (
              <div key={dim.id} className="dim-card">
                <div className="dim-card__head">
                  <div className="dim-badge">{dim.codigo}</div>
                  <div>
                    <p className="dim-card__nombre">{dim.nombre}</p>
                    <p className="dim-card__desc">{dim.desc}</p>
                  </div>
                </div>
                <ul className="dim-skills" role="list">
                  {dim.habilidades.map((h, idx) => {
                    const sel = seleccionadas.has(h.id)
                    return (
                      <li key={h.id} className={`dim-skill${idx < dim.habilidades.length - 1 ? ' dim-skill--sep' : ''}`}>
                        <button
                          type="button"
                          className={`dim-skill__check${sel ? ' dim-skill__check--sel' : ''}`}
                          onClick={() => toggleHab(h.id)}
                          aria-pressed={sel}
                          aria-label={`${sel ? 'Quitar' : 'Seleccionar'} ${h.nombre}`}
                        >
                          {sel && <CheckIcon />}
                        </button>
                        <div className="dim-skill__info">
                          <p className="dim-skill__nombre">{h.nombre}</p>
                          <p className="dim-skill__subdesc">{h.desc}</p>
                        </div>
                        <span className="dim-skill__codigo">{h.id}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Aside fase 2 */}
          <aside className="hab-aside">
            <p className="hab-aside__tag">SELECCIÓN ACTUAL</p>
            <h3 className="hab-aside__titulo">
              {seleccionadas.size} habilidad{seleccionadas.size !== 1 ? 'es' : ''}
            </h3>
            <p className="hab-aside__hint">
              Estas habilidades serán visibles para el taller o juego.
            </p>
            <hr className="hab-aside__sep" />

            {habsSel.length === 0 ? (
              <p className="hab-aside__vacío">Ninguna habilidad seleccionada.</p>
            ) : (
              <ul className="sel-tags" role="list">
                {habsSel.map(h => (
                  <li key={h.id} className="sel-tag">
                    <span className="sel-tag__codigo">{h.id}</span>
                    <span className="sel-tag__nombre">{h.nombre}</span>
                    <button
                      type="button"
                      className="sel-tag__quitar"
                      onClick={() => toggleHab(h.id)}
                      aria-label={`Quitar ${h.nombre}`}
                    >×</button>
                  </li>
                ))}
              </ul>
            )}

            <button
              className="btn-continuar-hab"
              disabled={seleccionadas.size === 0}
              onClick={() => setFase(3)}
            >
              Configurar medición
            </button>
          </aside>

        </div>
      )}

    </div>
  )
}

export default Habilidades
