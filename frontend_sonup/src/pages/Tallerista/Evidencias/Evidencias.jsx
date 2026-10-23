import { useState, useRef } from 'react'
import './Evidencias.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const VideoIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
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

/* ─── Data ───────────────────────────────────────────────────────────────── */

const MODULOS = ['Música', 'Artes', 'Panadería', 'Educación física']
const TIPOS   = ['Video', 'Foto']

const MODULE_COLOR = {
  'Música':            'var(--color-text-dark)',
  'Artes':             'var(--color-primary)',
  'Panadería':         'var(--color-accent)',
  'Educación física':  'var(--color-blue)',
}

const EVIDS_DEMO = [
  {
    id: 1,
    titulo:      'Ritmo con tambor',
    modulo:      'Música',
    tipo:        'Video',
    fecha:       '10 de octubre de 2026',
    descripcion: 'Mariana sigue el pulso con el tambor junto a su grupo.',
  },
  {
    id: 2,
    titulo:      'Lienzo terminado',
    modulo:      'Artes',
    tipo:        'Foto',
    fecha:       '3 de octubre de 2026',
    descripcion: 'Resultado final del taller de pintura libre.',
  },
  {
    id: 3,
    titulo:      'Preparación de pan',
    modulo:      'Panadería',
    tipo:        'Video',
    fecha:       '26 de septiembre de 2026',
    descripcion: 'El grupo elabora pan artesanal siguiendo las instrucciones.',
  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const Evidencias = () => {
  const [evidencias,    setEvidencias]    = useState(EVIDS_DEMO)
  const [detalle,       setDetalle]       = useState(null)
  const [mostrarCrear,  setMostrarCrear]  = useState(false)
  const [form,          setForm]          = useState({
    modulo: 'Música', tipo: 'Video', titulo: '', descripcion: '',
  })
  const [archivoNombre, setArchivoNombre] = useState('')
  const inputRef = useRef(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const onArchivo = (e) => {
    const f = e.target.files?.[0]
    if (f) setArchivoNombre(f.name)
  }

  const cerrarCrear = () => {
    setMostrarCrear(false)
    setForm({ modulo: 'Música', tipo: 'Video', titulo: '', descripcion: '' })
    setArchivoNombre('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const guardarEvidencia = () => {
    if (!form.titulo.trim()) return
    setEvidencias(prev => [{
      id:          Date.now(),
      titulo:      form.titulo,
      modulo:      form.modulo,
      tipo:        form.tipo,
      fecha:       new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }),
      descripcion: form.descripcion,
    }, ...prev])
    cerrarCrear()
  }

  const thumbColor = (modulo) => MODULE_COLOR[modulo] ?? 'var(--color-primary)'

  return (
    <div className="evid-page">

      {/* ── Header ── */}
      <header className="evid-header">
        <div>
          <h1 className="evid-titulo">Evidencias</h1>
          <p className="evid-sub">Fotos y videos autorizados de las clases</p>
        </div>
        <button className="btn-nueva-evid" onClick={() => setMostrarCrear(true)}>
          + Nuevo
        </button>
      </header>

      {/* ── Grid ── */}
      {evidencias.length === 0 ? (
        <p className="evid-vacío">No hay evidencias registradas aún.</p>
      ) : (
        <div className="evid-grid">
          {evidencias.map(e => (
            <div key={e.id} className="evid-card">
              <div className="evid-thumb" style={{ background: thumbColor(e.modulo) }}>
                <div className="evid-play">
                  <VideoIcon />
                </div>
              </div>
              <div className="evid-card__body">
                <p className="evid-card__titulo">{e.titulo}</p>
                <p className="evid-card__fecha">{e.fecha}</p>
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
                <p className="evid-modal__tag">EVIDENCIA DE {detalle.modulo.toUpperCase()}</p>
                <h2 className="evid-modal__titulo">{detalle.titulo}</h2>
              </div>
              <button className="evid-modal__close" onClick={() => setDetalle(null)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="evid-modal-thumb" style={{ background: thumbColor(detalle.modulo) }}>
              <div className="evid-play evid-play--lg">
                <VideoIcon size={32} />
              </div>
            </div>

            <div className="evid-info-row">
              <div className="evid-info-item">
                <p className="evid-info-label">TIPO</p>
                <p className="evid-info-valor">{detalle.tipo}</p>
              </div>
              <div className="evid-info-item">
                <p className="evid-info-label">FECHA</p>
                <p className="evid-info-valor">{detalle.fecha}</p>
              </div>
              <div className="evid-info-item">
                <p className="evid-info-label">TALLER</p>
                <p className="evid-info-valor">{detalle.modulo}</p>
              </div>
            </div>

            {detalle.descripcion && (
              <p className="evid-modal-desc">{detalle.descripcion}</p>
            )}

            <div className="evid-modal__acciones">
              <button className="btn-descargar-evid">
                <DownloadIcon /> Descargar
              </button>
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
                <h2 className="evid-modal__titulo">Subir evidencia</h2>
              </div>
              <button className="evid-modal__close" onClick={cerrarCrear} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            {/* Upload area */}
            {archivoNombre ? (
              <div
                className="evid-file-preview"
                style={{ background: thumbColor(form.modulo) }}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Cambiar archivo"
              >
                <div className="evid-play evid-play--lg"><VideoIcon size={32} /></div>
                <p className="evid-file-preview__nombre">{archivoNombre}</p>
                <input
                  ref={inputRef} type="file"
                  accept="image/*,video/*,.mov,.mp4"
                  onChange={onArchivo}
                  className="evid-input-hidden"
                />
              </div>
            ) : (
              <div
                className="evid-upload-area"
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Seleccionar archivo"
              >
                <div className="evid-upload__icono"><UploadIcon /></div>
                <p className="evid-upload__texto">Arrastra o haz clic para subir</p>
                <p className="evid-upload__hint">JPG, PNG, MP4, MOV · hasta 50 MB</p>
                <input
                  ref={inputRef} type="file"
                  accept="image/*,video/*,.mov,.mp4"
                  onChange={onArchivo}
                  className="evid-input-hidden"
                />
              </div>
            )}

            {/* Form fields */}
            <div className="evid-form-grid">
              <div className="evid-campo">
                <label className="evid-label">Módulo o taller</label>
                <select className="evid-select" value={form.modulo} onChange={e => upd('modulo', e.target.value)}>
                  {MODULOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="evid-campo">
                <label className="evid-label">Tipo</label>
                <select className="evid-select" value={form.tipo} onChange={e => upd('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
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
                <label className="evid-label">Descripción</label>
                <textarea
                  className="evid-textarea" value={form.descripcion} rows={3}
                  onChange={e => upd('descripcion', e.target.value)}
                  placeholder="Describe brevemente la evidencia..."
                />
              </div>
            </div>

            <div className="evid-modal__acciones">
              <button className="btn-cancelar-evid" onClick={cerrarCrear}>Cancelar</button>
              <button
                className="btn-guardar-evid"
                onClick={guardarEvidencia}
                disabled={!form.titulo.trim()}
              >
                Guardar evidencia
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Evidencias
