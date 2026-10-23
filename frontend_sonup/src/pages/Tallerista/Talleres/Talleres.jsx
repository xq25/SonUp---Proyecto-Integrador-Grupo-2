import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Talleres.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

/* ─── Mock data ──────────────────────────────────────────────────────────── */

const TALLERES_OPTS = ['Música · Jóvenes', 'Artes · Jóvenes', 'Panadería · Jóvenes']

const PARTICIPANTES = [
  { id: 1, nombre: 'Mariana Gómez',  iniciales: 'MG' },
  { id: 2, nombre: 'Julián Ocampo',  iniciales: 'JO' },
  { id: 3, nombre: 'Sofía Arango',   iniciales: 'SA' },
  { id: 4, nombre: 'Tomás Herrera',  iniciales: 'TH' },
  { id: 5, nombre: 'Daniela Ruiz',   iniciales: 'DR' },
  { id: 6, nombre: 'Samuel Patiño',  iniciales: 'SP' },
]

const FASES = [
  { n: 1, label: 'Publicación del taller'    },
  { n: 2, label: 'Toma de asistencia'        },
  { n: 3, label: 'Valoraciones y evidencias' },
]

const DIMENSIONES = [
  {
    nombre: 'Dimensión cognitiva',
    indicadores: [
      'Sigue el compás y reconoce las figuras musicales',
      'Solicita ayuda ante alguna dificultad',
      'Responde cuando se le llama por el nombre',
      'Reconoce algunos instrumentos vistos en clase',
      'Realiza ejercicios de ritmo y solfeo grupal',
    ],
  },
  {
    nombre: 'Dimensión comunicativa',
    indicadores: [
      'Responde y reconoce sonidos graves, medios y agudos',
      'Imita gestos y movimientos que realiza el docente',
      'Mira con atención el rostro del docente',
      'Comprende lo que se le dice',
    ],
  },
  {
    nombre: 'Dimensión corporal',
    indicadores: [
      'Realiza ejercicios musicales moviendo manos y pies',
      'Manifiesta con risas o gestos el disfrute de las actividades',
      'Participa activamente en las actividades musicales',
    ],
  },
  {
    nombre: 'Dimensión social',
    indicadores: [
      'Participa en actividades grupales sin conflictos',
      'Ayuda a sus compañeros cuando lo necesitan',
      'Respeta los turnos durante las actividades',
    ],
  },
]

const TOTAL_IND = DIMENSIONES.reduce((s, d) => s + d.indicadores.length, 0)

const VAL_INICIALES = {
  '1-0-0': 'EP', '1-0-1': 'L',  '1-0-2': 'L',  '1-0-3': 'L',  '1-0-4': 'EP',
  '1-1-0': 'EP', '1-1-1': 'L',  '1-1-2': 'L',  '1-1-3': 'L',
  '1-2-0': 'EP', '1-2-1': 'L',  '1-2-2': 'L',
  '2-0-0': 'L',  '2-0-1': 'L',  '2-0-2': 'L',  '2-0-3': 'L',  '2-0-4': 'L',
  '2-1-0': 'L',  '2-1-1': 'L',  '2-1-2': 'L',  '2-1-3': 'L',
  '2-2-0': 'L',  '2-2-1': 'L',  '2-2-2': 'L',
  '2-3-0': 'L',  '2-3-1': 'L',  '2-3-2': 'L',
  '3-0-0': 'L',  '3-0-1': 'L',  '3-0-2': 'L',  '3-0-3': 'L',  '3-0-4': 'L',
  '3-1-0': 'L',  '3-1-1': 'L',  '3-1-2': 'L',  '3-1-3': 'L',
  '3-2-0': 'L',  '3-2-1': 'L',  '3-2-2': 'L',
  '3-3-0': 'L',  '3-3-1': 'L',  '3-3-2': 'L',
  '5-0-0': 'L',  '5-0-1': 'EP', '5-0-2': 'L',  '5-0-3': 'L',
}

const TITULOS = {
  1: { h: 'Publicación del taller',     sub: 'Define el tema, los objetivos y la actividad que desarrollarás.' },
  2: { h: 'Toma de asistencia',         sub: 'Registra quiénes participaron en la sesión publicada.' },
  3: { h: 'Valoraciones y evidencias',  sub: 'Valora los logros y adjunta evidencias de la actividad.' },
}

/* ─── Component ──────────────────────────────────────────────────────────── */

const Talleres = () => {
  const navigate = useNavigate()
  const [fase, setFase] = useState(1)
  const [guardando, setGuardando] = useState(false)

  /* Fase 1 */
  const [sesion, setSesion] = useState({
    taller:     'Música · Jóvenes',
    fecha:      '2026-10-10',
    horaInicio: '10:00',
    horaFin:    '11:00',
    tema:       'Ritmo con palmas y tambor',
    objetivo:   'Seguir un pulso estable con palmas y tambor, primero en grupo y luego por turnos.',
    pasos: [
      'Saludo cantado y preparación del salón',
      'Ritmo con palmas: lento, rápido y pausa',
      'Tambores por turnos siguiendo la canción',
      'Cierre y organización de los instrumentos',
    ],
    materiales: ['Tambor', 'Panderetas', 'Parlante', 'Hojas con figuras musicales'],
  })

  /* Fase 2 */
  const [asistencia, setAsistencia] = useState(
    () => Object.fromEntries(PARTICIPANTES.map(p => [p.id, p.id !== 4]))
  )

  /* Fase 3 */
  const [participanteActivo, setParticipanteActivo] = useState(PARTICIPANTES[0].id)
  const [valoraciones,       setValoraciones]       = useState(VAL_INICIALES)
  const [observacion,        setObservacion]        = useState(
    'El grupo siguió el pulso lento sin ayuda. En el ritmo rápido varios necesitaron apoyo visual.'
  )
  const [evidencias,         setEvidencias]         = useState([])
  const inputEvidencias = useRef(null)

  /* Fase 1 helpers */
  const [nuevoPaso,     setNuevoPaso]     = useState('')
  const [nuevoMaterial, setNuevoMaterial] = useState('')

  const agregarPaso = () => {
    if (!nuevoPaso.trim()) return
    setSesion(s => ({ ...s, pasos: [...s.pasos, nuevoPaso.trim()] }))
    setNuevoPaso('')
  }
  const eliminarPaso = i =>
    setSesion(s => ({ ...s, pasos: s.pasos.filter((_, idx) => idx !== i) }))
  const agregarMaterial = () => {
    if (!nuevoMaterial.trim()) return
    setSesion(s => ({ ...s, materiales: [...s.materiales, nuevoMaterial.trim()] }))
    setNuevoMaterial('')
  }
  const eliminarMaterial = i =>
    setSesion(s => ({ ...s, materiales: s.materiales.filter((_, idx) => idx !== i) }))

  /* Fase 2 helpers */
  const presentes     = Object.values(asistencia).filter(Boolean).length
  const total         = PARTICIPANTES.length
  const pctAsistencia = Math.round((presentes / total) * 100)

  const toggleAsistencia = (id, val) => setAsistencia(a => ({ ...a, [id]: val }))

  /* Fechas */
  const fechaDisplay = sesion.fecha
    ? new Date(sesion.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'
  const fechaCorta = sesion.fecha
    ? new Date(sesion.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long',
      })
    : '—'
  const [tallerNombre, tallerGrupo = ''] = sesion.taller.split(' · ')

  /* Fase 3 helpers */
  const guardarValoraciones = () => {
    setGuardando(true)
    setTimeout(() => navigate('/tallerista/inicio'), 1400)
  }

  const agregarEvidencias = (e) => {
    const files = Array.from(e.target.files)
    setEvidencias(prev => [...prev, ...files])
    e.target.value = ''
  }
  const quitarEvidencia = (i) => setEvidencias(prev => prev.filter((_, idx) => idx !== i))

  const getVal = (pId, di, ii) => valoraciones[`${pId}-${di}-${ii}`] ?? null

  const setVal = (pId, di, ii, v) =>
    setValoraciones(prev => ({ ...prev, [`${pId}-${di}-${ii}`]: v }))

  const statusParticipante = (pId) => {
    let valorados = 0
    DIMENSIONES.forEach((d, di) =>
      d.indicadores.forEach((_, ii) => { if (getVal(pId, di, ii)) valorados++ })
    )
    if (valorados === 0)       return 'Sin empezar'
    if (valorados === TOTAL_IND) return 'Completo'
    return `${valorados} de ${TOTAL_IND} valorados`
  }

  /* ── Stepper ── */
  const Stepper = () => (
    <div className="stepper" role="list">
      {FASES.map(f => {
        const done   = fase > f.n
        const active = fase === f.n
        return (
          <div
            key={f.n}
            className={[
              'stepper__paso',
              active ? 'stepper__paso--activo' : '',
              done   ? 'stepper__paso--done'   : '',
            ].filter(Boolean).join(' ')}
            role="listitem"
          >
            <div className="stepper__circulo">
              {done ? <CheckIcon /> : f.n}
            </div>
            <div className="stepper__info">
              <span className="stepper__fase">FASE {f.n}</span>
              <span className="stepper__nombre">{f.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  /* ─────────────────────────────────────────── RENDER ─── */
  return (
    <div className="talleres-page">

      {/* ── Header ── */}
      <header className="talleres-header">
        <div>
          <h1 className="talleres-titulo">{TITULOS[fase].h}</h1>
          <p className="talleres-sub">{TITULOS[fase].sub}</p>
        </div>
        <div className="talleres-header__acciones">
          <button className="btn-borrador">Guardar borrador</button>
          {fase === 3 && (
            <button className="btn-finalizar">Finalizar sesión</button>
          )}
        </div>
      </header>

      {/* ── Stepper ── */}
      <Stepper />

      {/* ── Body ── */}
      <div className={`talleres-body${fase === 3 ? ' talleres-body--val' : ''}`}>

        {/* ════════════════════ FASE 1 ════════════════════ */}
        {fase === 1 ? (
          <>
            <div className="sesion-form">
              <div className="sesion-form__head">
                <div>
                  <h2 className="sesion-form__titulo">Datos de la sesión</h2>
                  <p className="sesion-form__sub">Información que verá el equipo y las familias.</p>
                </div>
                <span className="tag-borrador">Borrador</span>
              </div>

              <div className="form-fila-4">
                <div className="form-campo">
                  <label className="form-label">Taller</label>
                  <select className="form-select" value={sesion.taller}
                    onChange={e => setSesion(s => ({ ...s, taller: e.target.value }))}>
                    {TALLERES_OPTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-campo">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-input" value={sesion.fecha}
                    onChange={e => setSesion(s => ({ ...s, fecha: e.target.value }))} />
                </div>
                <div className="form-campo">
                  <label className="form-label">Hora de inicio</label>
                  <input type="time" className="form-input" value={sesion.horaInicio}
                    onChange={e => setSesion(s => ({ ...s, horaInicio: e.target.value }))} />
                </div>
                <div className="form-campo">
                  <label className="form-label">Hora de fin</label>
                  <input type="time" className="form-input" value={sesion.horaFin}
                    onChange={e => setSesion(s => ({ ...s, horaFin: e.target.value }))} />
                </div>
              </div>

              <div className="form-campo">
                <label className="form-label">Tema de la clase</label>
                <input type="text" className="form-input" value={sesion.tema}
                  onChange={e => setSesion(s => ({ ...s, tema: e.target.value }))}
                  placeholder="Ej: Ritmo con palmas y tambor" />
              </div>

              <div className="form-campo">
                <label className="form-label">Objetivo</label>
                <textarea className="form-textarea" value={sesion.objetivo} rows={3}
                  onChange={e => setSesion(s => ({ ...s, objetivo: e.target.value }))} />
              </div>

              <div className="actividad">
                <div className="actividad__head">
                  <span className="actividad__titulo">Actividad desarrollada</span>
                  <span className="actividad__sub">En el orden en que se hizo</span>
                </div>
                <ol className="actividad__lista" role="list">
                  {sesion.pasos.map((paso, i) => (
                    <li key={i} className="actividad__item">
                      <span className="actividad__num">{i + 1}</span>
                      <span className="actividad__texto">{paso}</span>
                      <button className="actividad__del" onClick={() => eliminarPaso(i)}
                        aria-label={`Eliminar paso ${i + 1}`}>×</button>
                    </li>
                  ))}
                </ol>
                <div className="actividad__nuevo">
                  <input className="form-input" placeholder="Escribir nuevo paso..."
                    value={nuevoPaso} onChange={e => setNuevoPaso(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregarPaso()} />
                  <button className="btn-agregar-paso" onClick={agregarPaso}>+ Agregar paso</button>
                </div>
              </div>

              <div className="materiales">
                <span className="form-label">Materiales</span>
                <div className="materiales__chips">
                  {sesion.materiales.map((m, i) => (
                    <span key={i} className="chip">
                      {m}
                      <button className="chip__del" onClick={() => eliminarMaterial(i)}
                        aria-label={`Quitar ${m}`}>×</button>
                    </span>
                  ))}
                </div>
                <input className="form-input form-input--sm"
                  placeholder="Agregar material y presionar Enter..."
                  value={nuevoMaterial} onChange={e => setNuevoMaterial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarMaterial()} />
              </div>
            </div>

            <aside className="vista-previa">
              <p className="vista-previa__tag">VISTA PREVIA</p>
              <h3 className="vista-previa__titulo">{sesion.tema || 'Sin título'}</h3>
              <p className="vista-previa__taller">{sesion.taller}</p>
              <hr className="vista-previa__sep" />
              <div className="vista-previa__datos">
                <div className="vp-fila">
                  <span className="vp-label">Fecha</span>
                  <span className="vp-valor">{fechaDisplay}</span>
                </div>
                <div className="vp-fila">
                  <span className="vp-label">Horario</span>
                  <span className="vp-valor vp-valor--teal">{sesion.horaInicio}–{sesion.horaFin}</span>
                </div>
                <div className="vp-fila">
                  <span className="vp-label">Participantes</span>
                  <span className="vp-valor vp-valor--teal">{total} inscritos</span>
                </div>
              </div>
              <button className="btn-publicar" onClick={() => setFase(2)}>
                Publicar y continuar a asistencia
              </button>
            </aside>
          </>

        /* ════════════════════ FASE 2 ════════════════════ */
        ) : fase === 2 ? (
          <>
            <div className="asistencia-card">
              <div className="asistencia-card__head">
                <div>
                  <h2 className="asistencia-card__titulo">Lista del grupo</h2>
                  <p className="asistencia-card__sub">
                    {tallerNombre} · Grupo {tallerGrupo.toLowerCase()} · {fechaCorta}
                  </p>
                </div>
                <span className="asistencia-card__contador">{presentes} de {total} presentes</span>
              </div>
              <ul className="asistencia-lista" role="list">
                {PARTICIPANTES.map(p => (
                  <li key={p.id} className="asistencia-item">
                    <div className="asistencia-avatar">{p.iniciales}</div>
                    <span className="asistencia-nombre">{p.nombre}</span>
                    <div className="asistencia-toggle">
                      <button
                        className={`toggle-btn${asistencia[p.id] ? ' toggle-btn--asistio' : ''}`}
                        onClick={() => toggleAsistencia(p.id, true)}
                      >Asistió</button>
                      <button
                        className={`toggle-btn${!asistencia[p.id] ? ' toggle-btn--ausente' : ''}`}
                        onClick={() => toggleAsistencia(p.id, false)}
                      >No asistió</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="resumen">
              <div className="resumen__circulo">{presentes}</div>
              <p className="resumen__titulo">Participantes presentes</p>
              <p className="resumen__sub">
                {total - presentes} {total - presentes === 1 ? 'ausente' : 'ausentes'} · {pctAsistencia}% de asistencia
              </p>
              <button className="btn-publicar" onClick={() => setFase(3)}>
                Guardar y continuar a valoraciones
              </button>
            </aside>
          </>

        /* ════════════════════ FASE 3 ════════════════════ */
        ) : (
          <>
            {/* Sidebar participantes */}
            <aside className="val-sidebar">
              <p className="val-sidebar__titulo">PARTICIPANTES · {PARTICIPANTES.length}</p>
              <ul className="val-sidebar__lista" role="list">
                {PARTICIPANTES.map(p => {
                  const activo = p.id === participanteActivo
                  return (
                    <li key={p.id}>
                      <button
                        className={`val-participante${activo ? ' val-participante--activo' : ''}`}
                        onClick={() => setParticipanteActivo(p.id)}
                      >
                        <div className={`val-participante__avatar${activo ? ' val-participante__avatar--activo' : ''}`}>
                          {p.iniciales}
                        </div>
                        <div className="val-participante__info">
                          <p className="val-participante__nombre">{p.nombre}</p>
                          <p className="val-participante__estado">{statusParticipante(p.id)}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>

            {/* Contenido valoraciones */}
            <div className="val-contenido">

              {/* Cabecera del participante activo */}
              <div className="val-header">
                <h2 className="val-header__nombre">
                  {PARTICIPANTES.find(p => p.id === participanteActivo)?.nombre}
                </h2>
                <div className="val-leyenda">
                  <span className="val-ley val-ley--i">I · INICIADO</span>
                  <span className="val-ley val-ley--ep">EP · EN PROCESO</span>
                  <span className="val-ley val-ley--nr">NR · NECESITA REFUERZO</span>
                  <span className="val-ley val-ley--l">L · LOGRADO</span>
                </div>
              </div>

              {/* Dimensiones */}
              {DIMENSIONES.map((dim, di) => {
                const logrados = dim.indicadores.filter((_, ii) =>
                  getVal(participanteActivo, di, ii) === 'L'
                ).length
                return (
                  <div key={di} className="val-dimension">
                    <div className="val-dimension__header">
                      <h3 className="val-dimension__titulo">{dim.nombre}</h3>
                      <span className="val-dimension__logrados">
                        {logrados} de {dim.indicadores.length} logrados
                      </span>
                    </div>
                    {dim.indicadores.map((ind, ii) => {
                      const v = getVal(participanteActivo, di, ii)
                      return (
                        <div key={ii} className="val-indicador">
                          <p className="val-indicador__texto">{ind}</p>
                          <div className="val-botones">
                            {['I', 'EP', 'NR', 'L'].map(opt => (
                              <button
                                key={opt}
                                className={`val-btn val-btn--${opt.toLowerCase()}${v === opt ? ' val-btn--sel' : ''}`}
                                onClick={() => setVal(participanteActivo, di, ii, v === opt ? null : opt)}
                                aria-label={opt}
                                aria-pressed={v === opt}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Observación del grupo */}
              <div className="val-observacion">
                <h3 className="val-observacion__titulo">Observación del grupo</h3>
                <p className="val-observacion__label">¿Cómo le fue al grupo?</p>
                <textarea
                  className="form-textarea"
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  rows={4}
                  placeholder="Describe cómo fue la sesión para el grupo..."
                />
              </div>

              {/* Evidencias */}
              <div className="val-evidencias">
                <div className="val-evidencias__header">
                  <h3 className="val-evidencias__titulo">Evidencias de la actividad</h3>
                  <span className="badge-opcional">Opcional</span>
                </div>
                <p className="val-evidencias__aviso">
                  Adjunta fotos, videos o documentos autorizados.
                </p>
                <label className="val-upload" htmlFor="evidencias-input">
                  <UploadIcon />
                  <span className="val-upload__btn">Subir evidencias</span>
                  <input
                    id="evidencias-input"
                    ref={inputEvidencias}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                    onChange={agregarEvidencias}
                    className="val-upload__input"
                  />
                </label>
                {evidencias.length > 0 && (
                  <ul className="evidencias-lista">
                    {evidencias.map((f, i) => (
                      <li key={i} className="evidencia-item">
                        <span className="evidencia-nombre">{f.name}</span>
                        <button
                          className="evidencia-del"
                          onClick={() => quitarEvidencia(i)}
                          aria-label={`Quitar ${f.name}`}
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="val-evidencias__nota">
                  La imagen de quienes no tienen autorización no se publicará.
                </p>
              </div>

              {/* Navegación */}
              <div className="val-footer">
                <button className="btn-volver" onClick={() => setFase(2)}>
                  Volver a asistencia
                </button>
                <button
                  className="btn-publicar"
                  onClick={guardarValoraciones}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar valoraciones'}
                </button>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Talleres
