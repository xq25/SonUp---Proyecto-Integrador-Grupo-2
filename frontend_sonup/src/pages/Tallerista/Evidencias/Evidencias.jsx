import { useState, useEffect } from 'react'
import { getWorkshops } from '../../../services/workshops.js'
import { getWorkshopAttendances } from '../../../services/attendances.js'
import { createEvidence, getStudentEvidences } from '../../../services/evidences.js'
import { getChildren } from '../../../services/children.js'
import './Evidencias.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const VideoIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const CARD_COLORS = [
  'var(--color-text-dark)',
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-blue)',
]

const cardColor = (id) => CARD_COLORS[Number(String(id ?? '0').at(-1) ?? 0) % CARD_COLORS.length]

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

/* ─── Component ──────────────────────────────────────────────────────────── */

const Evidencias = () => {
  const [evidencias,    setEvidencias]    = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [detalle,       setDetalle]       = useState(null)
  const [mostrarCrear,  setMostrarCrear]  = useState(false)
  const [niños,         setNiños]         = useState([])
  const [form,          setForm]          = useState({ url: '', titulo: '' })
  const [seleccionados, setSeleccionados] = useState([])
  const [guardando,     setGuardando]     = useState(false)
  const [errorGuardar,  setErrorGuardar]  = useState('')

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  /* Carga inicial: talleres → asistencias → estudiantes → evidencias */
  useEffect(() => {
    const evaluatorId = import.meta.env.VITE_EVALUATOR_ID
    const load = async () => {
      try {
        const talleres = await getWorkshops(evaluatorId ? { evaluatorId } : {})
        const asistRes = await Promise.allSettled(
          talleres.map(t => getWorkshopAttendances(t.id))
        )
        const studentIdSet = new Set()
        asistRes.forEach(r => {
          if (r.status === 'fulfilled') r.value.forEach(a => studentIdSet.add(String(a.studentId)))
        })
        const evidRes = await Promise.allSettled(
          [...studentIdSet].map(id => getStudentEvidences(id))
        )
        const map = new Map()
        evidRes.forEach(r => {
          if (r.status === 'fulfilled') r.value.forEach(e => map.set(String(e.id), e))
        })
        setEvidencias([...map.values()])
      } catch {}
      finally { setCargando(false) }
    }
    load()
  }, [])

  /* Abrir modal de creación y cargar estudiantes */
  const abrirCrear = async () => {
    setMostrarCrear(true)
    if (niños.length === 0) {
      try { setNiños(await getChildren()) } catch {}
    }
  }

  const cerrarCrear = () => {
    setMostrarCrear(false)
    setForm({ url: '', titulo: '' })
    setSeleccionados([])
    setErrorGuardar('')
  }

  const toggleEstudiante = (childId) =>
    setSeleccionados(prev =>
      prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
    )

  const guardarEvidencia = async () => {
    if (!form.titulo.trim() || !form.url.trim() || seleccionados.length === 0) return
    setGuardando(true)
    setErrorGuardar('')
    try {
      const nueva = await createEvidence({
        title:      form.titulo.trim(),
        url:        form.url.trim(),
        studentIds: seleccionados,
      })
      setEvidencias(prev => [nueva, ...prev])
      cerrarCrear()
    } catch (e) {
      setErrorGuardar(`No se pudo guardar: ${e.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const puedeGuardar =
    form.titulo.trim().length >= 2 &&
    form.url.trim().startsWith('https://') &&
    seleccionados.length > 0 &&
    !guardando

  return (
    <div className="evid-page">

      {/* ── Header ── */}
      <header className="evid-header">
        <div>
          <h1 className="evid-titulo">Evidencias</h1>
          <p className="evid-sub">Fotos y videos autorizados de las clases</p>
        </div>
        <button className="btn-nueva-evid" onClick={abrirCrear}>
          + Nuevo
        </button>
      </header>

      {/* ── Grid ── */}
      {cargando ? (
        <p className="evid-vacío">Cargando evidencias…</p>
      ) : evidencias.length === 0 ? (
        <p className="evid-vacío">No hay evidencias registradas aún.</p>
      ) : (
        <div className="evid-grid">
          {evidencias.map(e => (
            <div key={String(e.id)} className="evid-card">
              <div className="evid-thumb" style={{ background: cardColor(e.id) }}>
                <div className="evid-play">
                  <VideoIcon />
                </div>
              </div>
              <div className="evid-card__body">
                <p className="evid-card__titulo">{e.title}</p>
                <p className="evid-card__fecha">{e.createdAt ? formatFecha(e.createdAt) : '—'}</p>
                <button className="btn-ver-evid" onClick={() => setDetalle(e)}>
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal detalle ── */}
      {detalle && (
        <div className="evid-overlay" onClick={() => setDetalle(null)} role="dialog" aria-modal="true">
          <div className="evid-modal" onClick={e => e.stopPropagation()}>

            <div className="evid-modal__head">
              <div>
                <p className="evid-modal__tag">EVIDENCIA</p>
                <h2 className="evid-modal__titulo">{detalle.title}</h2>
              </div>
              <button className="evid-modal__close" onClick={() => setDetalle(null)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="evid-modal-thumb" style={{ background: cardColor(detalle.id) }}>
              <div className="evid-play evid-play--lg">
                <VideoIcon size={32} />
              </div>
            </div>

            <div className="evid-info-row">
              <div className="evid-info-item">
                <p className="evid-info-label">FECHA</p>
                <p className="evid-info-valor">{detalle.createdAt ? formatFecha(detalle.createdAt) : '—'}</p>
              </div>
              <div className="evid-info-item" style={{ gridColumn: '2 / -1' }}>
                <p className="evid-info-label">ENLACE</p>
                <p className="evid-info-valor" style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
                  <a href={detalle.url} target="_blank" rel="noreferrer">{detalle.url}</a>
                </p>
              </div>
            </div>

            <div className="evid-modal__acciones">
              <a className="btn-descargar-evid" href={detalle.url} target="_blank" rel="noreferrer">
                <DownloadIcon /> Ver evidencia
              </a>
              <button className="btn-compartir" onClick={() => setDetalle(null)}>
                Compartir con la familia
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal crear ── */}
      {mostrarCrear && (
        <div className="evid-overlay" onClick={cerrarCrear} role="dialog" aria-modal="true">
          <div className="evid-modal" onClick={e => e.stopPropagation()}>

            <div className="evid-modal__head">
              <div>
                <p className="evid-modal__tag">NUEVA EVIDENCIA</p>
                <h2 className="evid-modal__titulo">Registrar evidencia</h2>
              </div>
              <button className="evid-modal__close" onClick={cerrarCrear} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="evid-form-grid">
              <div className="evid-campo evid-campo--full">
                <label className="evid-label">URL de la evidencia (https://…)</label>
                <input
                  type="url" className="evid-input" value={form.url}
                  onChange={e => upd('url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="evid-campo evid-campo--full">
                <label className="evid-label">Título</label>
                <input
                  type="text" className="evid-input" value={form.titulo}
                  onChange={e => upd('titulo', e.target.value)}
                  placeholder="Ej: Ritmo con tambor"
                />
              </div>
              <div className="evid-campo evid-campo--full">
                <label className="evid-label">
                  Estudiantes vinculados&nbsp;
                  <span className="evid-hint-count">({seleccionados.length} seleccionados)</span>
                </label>
                <div className="evid-student-list">
                  {niños.length === 0 ? (
                    <p className="evid-hint">Cargando estudiantes…</p>
                  ) : niños.map(n => {
                    const id     = String(n.id)
                    const nombre = [n.firstName, n.lastName].filter(Boolean).join(' ') || `Estudiante ${id}`
                    return (
                      <label key={id} className="evid-student-item">
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(id)}
                          onChange={() => toggleEstudiante(id)}
                        />
                        {nombre}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {errorGuardar && <p className="evid-error">{errorGuardar}</p>}

            <div className="evid-modal__acciones">
              <button className="btn-cancelar-evid" onClick={cerrarCrear}>Cancelar</button>
              <button
                className="btn-guardar-evid"
                onClick={guardarEvidencia}
                disabled={!puedeGuardar}
              >
                {guardando ? 'Guardando…' : 'Guardar evidencia'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Evidencias
