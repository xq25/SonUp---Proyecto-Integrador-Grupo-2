import { useState } from 'react'
import './Certificados.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const MedalIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
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

const PARTICIPANTES = ['Mariana Gómez', 'Julián Pérez', 'Sofía Rodríguez', 'Daniela Torres']
const MODULOS       = ['Música', 'Artes', 'Panadería', 'Educación física']

const CERTS_DEMO = [
  {
    id: 1,
    nombre:       'Taller de panadería',
    horas:        12,
    participante: 'Mariana Gómez',
    fecha:        '16 de julio de 2026',
    estado:       'Entregado',
    descripcion:  'Por su participación activa en el Taller de panadería, con una duración de 12 horas.',
  },
  {
    id: 2,
    nombre:       'Muestra de Artes 2025',
    horas:        20,
    participante: 'Mariana Gómez',
    fecha:        '12 de diciembre de 2025',
    estado:       'Firmado',
    descripcion:  'Por su participación activa en la Muestra de Artes 2025, con una duración de 20 horas.',
  },
  {
    id: 3,
    nombre:       'Proceso musical',
    horas:        18,
    participante: 'Mariana Gómez',
    fecha:        '28 de noviembre de 2025',
    estado:       'Borrador',
    descripcion:  'Por su participación activa en el Proceso musical, con una duración de 18 horas.',
  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const Certificados = () => {
  const [certificados,  setCertificados]  = useState(CERTS_DEMO)
  const [detalle,       setDetalle]       = useState(null)
  const [mostrarCrear,  setMostrarCrear]  = useState(false)
  const [mostrarEnviar, setMostrarEnviar] = useState(false)
  const [certEnviar,    setCertEnviar]    = useState(null)
  const [form, setForm] = useState({
    participante: 'Mariana Gómez',
    modulo:       'Música',
    nombre:       '',
    horas:        '',
    descripcion:  '',
  })

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const crearCert = () => {
    if (!form.nombre.trim()) return
    setCertificados(prev => [{
      id:           Date.now(),
      nombre:       form.nombre,
      horas:        parseInt(form.horas) || 0,
      participante: form.participante,
      fecha:        new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
      estado:       'Borrador',
      descripcion:  form.descripcion || `Por su participación activa en el ${form.nombre}, con una duración de ${form.horas} horas.`,
    }, ...prev])
    setMostrarCrear(false)
    setForm({ participante: 'Mariana Gómez', modulo: 'Música', nombre: '', horas: '', descripcion: '' })
  }

  const descargar = () => {
    const prev = document.title
    document.title = detalle?.nombre ?? 'Certificado'
    window.print()
    document.title = prev
  }

  return (
    <div className="cert-page">

      {/* ── Header ── */}
      <header className="cert-header">
        <div>
          <h1 className="cert-titulo">Certificados</h1>
          <p className="cert-sub">Consulta, crea y entrega reconocimientos a los participantes</p>
        </div>
        <button className="btn-nuevo-cert" onClick={() => setMostrarCrear(true)}>
          + Nuevo certificado
        </button>
      </header>

      {/* ── Tabla ── */}
      <div className="cert-card">
        <div className="cert-tabla-wrap">
          <table className="cert-tabla">
            <thead>
              <tr>
                <th className="cert-th">CERTIFICADO</th>
                <th className="cert-th cert-th--part">PARTICIPANTE</th>
                <th className="cert-th cert-th--fecha">FECHA</th>
                <th className="cert-th">ESTADO</th>
                <th className="cert-th"></th>
              </tr>
            </thead>
            <tbody>
              {certificados.map(c => (
                <tr key={c.id} className="cert-fila">
                  <td>
                    <div className="cert-fila__cert">
                      <div className={`cert-icono cert-icono--${c.estado.toLowerCase()}`}>
                        <MedalIcon />
                      </div>
                      <div>
                        <p className="cert-fila__nombre">{c.nombre}</p>
                        <p className="cert-fila__horas">{c.horas} horas de formación</p>
                      </div>
                    </div>
                  </td>
                  <td className="cert-fila__part">{c.participante}</td>
                  <td className="cert-fila__fecha">{c.fecha}</td>
                  <td>
                    <span className={`cert-estado cert-estado--${c.estado.toLowerCase()}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="cert-fila__accion">
                    <button className="btn-ver-det" onClick={() => setDetalle(c)}>
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal detalle ── */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            <div className="modal-head">
              <div>
                <p className="modal-tag">DETALLE DEL CERTIFICADO</p>
                <h2 className="modal-titulo">{detalle.nombre}</h2>
              </div>
              <button className="modal-close" onClick={() => setDetalle(null)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="cert-preview">
              <div className="cert-preview__medal"><MedalIcon size={48} /></div>
              <p className="cert-preview__brand">SON UP</p>
              <p className="cert-preview__tipo">CERTIFICADO DE PARTICIPACIÓN</p>
              <p className="cert-preview__otorga">Se otorga el presente certificado a</p>
              <p className="cert-preview__nombre">{detalle.participante}</p>
              <p className="cert-preview__desc">{detalle.descripcion}</p>
              <p className="cert-preview__pie">Fundacion Asisco · {detalle.fecha}</p>
            </div>

            <div className="cert-info-row">
              <div className="cert-info-item">
                <p className="cert-info-label">PARTICIPANTE</p>
                <p className="cert-info-valor">{detalle.participante}</p>
              </div>
              <div className="cert-info-item">
                <p className="cert-info-label">DURACIÓN</p>
                <p className="cert-info-valor">{detalle.horas} horas</p>
              </div>
              <div className="cert-info-item">
                <p className="cert-info-label">ESTADO</p>
                <p className="cert-info-valor">{detalle.estado}</p>
              </div>
            </div>

            <div className="modal-acciones">
              <button className="btn-descargar" onClick={descargar}>
                <DownloadIcon /> Descargar
              </button>
              <button className="btn-enviar" onClick={() => { setCertEnviar(detalle); setDetalle(null); setMostrarEnviar(true) }}>
                Enviar a la familia
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal crear ── */}
      {mostrarCrear && (
        <div className="modal-overlay" onClick={() => setMostrarCrear(false)} role="dialog" aria-modal="true">
          <div className="modal-card modal-card--crear" onClick={e => e.stopPropagation()}>

            <div className="modal-head">
              <div>
                <p className="modal-tag">NUEVO DOCUMENTO</p>
                <h2 className="modal-titulo">Crear certificado</h2>
              </div>
              <button className="modal-close" onClick={() => setMostrarCrear(false)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="crear-grid">
              <div className="cert-campo">
                <label className="cert-label">Participante</label>
                <select className="cert-select" value={form.participante} onChange={e => upd('participante', e.target.value)}>
                  {PARTICIPANTES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="cert-campo">
                <label className="cert-label">Módulo o taller</label>
                <select className="cert-select" value={form.modulo} onChange={e => upd('modulo', e.target.value)}>
                  {MODULOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="cert-campo">
                <label className="cert-label">Nombre del certificado</label>
                <input
                  type="text" className="cert-input" value={form.nombre}
                  onChange={e => upd('nombre', e.target.value)}
                  placeholder="Participación en proceso musical"
                />
              </div>
              <div className="cert-campo">
                <label className="cert-label">Horas certificadas</label>
                <input
                  type="number" className="cert-input" value={form.horas}
                  onChange={e => upd('horas', e.target.value)}
                  placeholder="18" min="1"
                />
              </div>
              <div className="cert-campo cert-campo--full">
                <label className="cert-label">Descripción</label>
                <textarea
                  className="cert-textarea" value={form.descripcion} rows={3}
                  onChange={e => upd('descripcion', e.target.value)}
                  placeholder="Por su participación, compromiso y logros alcanzados durante el proceso formativo."
                />
              </div>
            </div>

            <div className="modal-acciones">
              <button className="btn-cancelar" onClick={() => setMostrarCrear(false)}>Cancelar</button>
              <button className="btn-crear-cert" onClick={crearCert} disabled={!form.nombre.trim()}>
                Crear certificado
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal enviar ── */}
      {mostrarEnviar && (
        <div className="modal-overlay" onClick={() => setMostrarEnviar(false)} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            <div className="modal-head">
              <div>
                <p className="modal-tag">CORREO A LA FAMILIA</p>
                <h2 className="modal-titulo">Enviar certificado</h2>
              </div>
              <button className="modal-close" onClick={() => setMostrarEnviar(false)} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="cert-enviar-campos">
              <div className="cert-campo">
                <label className="cert-label">Para</label>
                <input
                  type="email"
                  className="cert-input"
                  defaultValue="patricia.gomez@correo.com"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="cert-campo">
                <label className="cert-label">Asunto</label>
                <input
                  type="text"
                  className="cert-input"
                  defaultValue={`Certificado: ${certEnviar?.nombre ?? ''} — ${certEnviar?.participante ?? ''}`}
                />
              </div>
              <div className="cert-campo">
                <label className="cert-label">Mensaje</label>
                <textarea
                  className="cert-textarea"
                  rows={4}
                  defaultValue={`Estimada familia,\n\nAdjunto encontrarán el certificado "${certEnviar?.nombre}" correspondiente a ${certEnviar?.participante}.\n\nEquipo Son Up`}
                />
              </div>
              <p className="cert-enviar-nota">
                El certificado se adjuntará automáticamente como PDF al enviar.
              </p>
            </div>

            <div className="modal-acciones">
              <button className="btn-cancelar" onClick={() => setMostrarEnviar(false)}>Cancelar</button>
              <button className="btn-enviar" disabled>
                Enviar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Certificados
