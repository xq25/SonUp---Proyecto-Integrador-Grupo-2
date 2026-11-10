import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getWorkshops } from '../../../services/workshops.js'
import { getWorkshopAttendances } from '../../../services/attendances.js'
import { createCredential, updateCredential, deleteCredential, getStudentCredentials } from '../../../services/credentials.js'
import { getChildren } from '../../../services/children.js'
import CertificatePreview, { CREDENTIAL_STATUS_LABEL } from '../../../components/CertificatePreview/CertificatePreview.jsx'
import CompartirModal from '../../../components/CompartirModal/CompartirModal.jsx'
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
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const ESTADO_LABEL = CREDENTIAL_STATUS_LABEL

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

/* ─── Component ──────────────────────────────────────────────────────────── */

const Certificados = () => {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const [certificados,  setCertificados]  = useState([])
  const [niños,         setNiños]         = useState([])
  const [talleres,      setTalleres]      = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [detalle,       setDetalle]       = useState(null)
  const [mostrarCrear,  setMostrarCrear]  = useState(false)
  const [mostrarEnviar, setMostrarEnviar] = useState(false)
  const [certEnviar,    setCertEnviar]    = useState(null)
  const [guardando,     setGuardando]     = useState(false)
  const [errorGuardar,  setErrorGuardar]  = useState('')
  const [asistenciasPorTaller, setAsistenciasPorTaller] = useState({})  // workshopId → Set(studentId)
  const [editandoId,    setEditandoId]    = useState(null)   // credencial pending que se está editando
  const [confirmar,     setConfirmar]     = useState(null)   // 'eliminar' | 'revocar' | 'validar'
  const [accionando,    setAccionando]    = useState(false)
  const [errorAccion,   setErrorAccion]   = useState('')

  const [form, setForm] = useState({
    studentId:   '',
    nombre:      '',
    url:         '',
    workshopId:  '',
  })

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const nombreEstudiante = (studentId) => {
    const n = niños.find(k => String(k.id) === String(studentId))
    if (!n) return `Estudiante ${studentId}`
    return [n.firstName, n.lastName].filter(Boolean).join(' ') || `Estudiante ${studentId}`
  }

  /* Carga inicial: talleres → asistencias → estudiantes → credenciales */
  useEffect(() => {
    const evaluatorId = session?.saga?.professionalId
    const load = async () => {
      try {
        const [kids, ws] = await Promise.all([
          getChildren().catch(() => []),
          getWorkshops(evaluatorId ? { evaluatorId } : {}),
        ])
        setNiños(kids)
        setTalleres(ws)

        const asistRes = await Promise.allSettled(
          ws.map(t => getWorkshopAttendances(t.id))
        )
        const studentIdSet = new Set()
        const porTaller = {}
        asistRes.forEach((r, i) => {
          if (r.status !== 'fulfilled') return
          porTaller[String(ws[i].id)] = new Set(r.value.map(a => String(a.studentId)))
          r.value.forEach(a => studentIdSet.add(String(a.studentId)))
        })
        setAsistenciasPorTaller(porTaller)
        const certRes = await Promise.allSettled(
          [...studentIdSet].map(id => getStudentCredentials(id))
        )
        const map = new Map()
        certRes.forEach(r => {
          if (r.status === 'fulfilled') r.value.forEach(c => map.set(String(c.id), c))
        })
        setCertificados([...map.values()])
      } catch {}
      finally { setCargando(false) }
    }
    load()
  }, [session?.saga?.professionalId])

  /* Llegada desde «Resultados» de un taller: abre «Nuevo certificado» ya con participante y taller */
  const pidePrellenado = params.get('participante') && params.get('taller')
  useEffect(() => {
    if (cargando || !pidePrellenado) return
    const t = talleres.find(x => String(x.id) === params.get('taller'))
    setForm({ studentId: params.get('participante'), nombre: t ? `Participación en ${t.name}` : '', url: '', workshopId: params.get('taller') })
    setMostrarCrear(true)
    setParams({}, { replace: true })
  }, [cargando, pidePrellenado, params, setParams, talleres])

  const cerrarCrear = () => {
    setMostrarCrear(false)
    setForm({ studentId: '', nombre: '', url: '', workshopId: '' })
    setErrorGuardar('')
    setEditandoId(null)
  }

  /* Talleres a los que se puede asociar: finalizados y con asistencia del participante (regla del backend) */
  const talleresAsociables = talleres.filter(t =>
    t.status === 'finished' && asistenciasPorTaller[String(t.id)]?.has(String(form.studentId)))

  const reemplazar = (actualizada) => {
    setCertificados(prev => prev.map(c => (String(c.id) === String(actualizada.id) ? { ...c, ...actualizada } : c)))
    setDetalle(d => (d && String(d.id) === String(actualizada.id) ? { ...d, ...actualizada } : d))
  }

  const abrirEditar = (cert) => {
    setForm({ studentId: String(cert.studentId), nombre: cert.organizationName ?? '', url: cert.url ?? '', workshopId: cert.workshopId ? String(cert.workshopId) : '' })
    setEditandoId(String(cert.id))
    setDetalle(null)
    setMostrarCrear(true)
  }

  const cerrarDetalle = () => { setDetalle(null); setConfirmar(null); setErrorAccion('') }

  /* Solo `pending` se edita o elimina; pending→valid y pending/valid→revoked cambian de estado */
  const cambiarEstado = async (cert, status) => {
    setAccionando(true); setErrorAccion('')
    try {
      reemplazar(await updateCredential(cert.id, { status }))
      setConfirmar(null)
    } catch (e) { setErrorAccion(e.message) }
    finally { setAccionando(false) }
  }

  const eliminar = async (cert) => {
    setAccionando(true); setErrorAccion('')
    try {
      await deleteCredential(cert.id)
      setCertificados(prev => prev.filter(c => String(c.id) !== String(cert.id)))
      cerrarDetalle()
    } catch (e) { setErrorAccion(e.message) }
    finally { setAccionando(false) }
  }

  const crearCert = async () => {
    if (!form.nombre.trim() || !form.url.trim() || !form.studentId) return
    setGuardando(true)
    setErrorGuardar('')
    try {
      if (editandoId) {
        const editada = await updateCredential(editandoId, {
          organizationName: form.nombre.trim(),
          url:              form.url.trim(),
          workshopId:       form.workshopId || null,
        })
        reemplazar(editada)
        cerrarCrear()
        return
      }
      const body = {
        studentId:        form.studentId,
        organizationName: form.nombre.trim(),
        url:              form.url.trim(),
      }
      if (form.workshopId) body.workshopId = form.workshopId
      const nuevo = await createCredential(body)
      setCertificados(prev => [nuevo, ...prev])
      cerrarCrear()
    } catch (e) {
      setErrorGuardar(`No se pudo ${editandoId ? 'guardar' : 'crear'}: ${e.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const puedeCrear =
    form.nombre.trim().length >= 2 &&
    form.url.trim().startsWith('https://') &&
    form.studentId !== '' &&
    !guardando

  /* Abrir modal de envío */
  const abrirEnviar = (cert) => {
    setCertEnviar(cert)
    setDetalle(null)
    setMostrarEnviar(true)
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
          {cargando ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
              Cargando certificados…
            </p>
          ) : (
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
                {certificados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)', textAlign: 'center' }}>
                      No hay certificados registrados aún.
                    </td>
                  </tr>
                ) : certificados.map(c => (
                  <tr key={String(c.id)} className="cert-fila">
                    <td>
                      <div className="cert-fila__cert">
                        <div className={`cert-icono cert-icono--${c.status}`}>
                          <MedalIcon />
                        </div>
                        <div>
                          <p className="cert-fila__nombre">{c.organizationName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="cert-fila__part">{nombreEstudiante(c.studentId)}</td>
                    <td className="cert-fila__fecha">{c.createdAt ? formatFecha(c.createdAt) : '—'}</td>
                    <td>
                      <span className={`cert-estado cert-estado--${c.status}`}>
                        {ESTADO_LABEL[c.status] ?? c.status}
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
          )}
        </div>
      </div>

      {/* ── Modal detalle ── */}
      {detalle && (
        <div className="modal-overlay" onClick={cerrarDetalle} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            <div className="modal-head">
              <div>
                <p className="modal-tag">DETALLE DEL CERTIFICADO</p>
                <h2 className="modal-titulo">{detalle.organizationName}</h2>
              </div>
              <button className="modal-close" onClick={cerrarDetalle} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <CertificatePreview url={detalle.url} title={detalle.organizationName} />

            <div className="cert-info-row">
              <div className="cert-info-item">
                <p className="cert-info-label">PARTICIPANTE</p>
                <p className="cert-info-valor">{nombreEstudiante(detalle.studentId)}</p>
              </div>
              <div className="cert-info-item">
                <p className="cert-info-label">FECHA</p>
                <p className="cert-info-valor">{detalle.createdAt ? formatFecha(detalle.createdAt) : '—'}</p>
              </div>
              {detalle.workshopId && (
                <div className="cert-info-item">
                  <p className="cert-info-label">TALLER</p>
                  <p className="cert-info-valor">{talleres.find(t => String(t.id) === String(detalle.workshopId))?.name ?? `Taller ${detalle.workshopId}`}</p>
                </div>
              )}
              <div className="cert-info-item">
                <p className="cert-info-label">ESTADO</p>
                <p className="cert-info-valor">{ESTADO_LABEL[detalle.status] ?? detalle.status}</p>
              </div>
            </div>

            {errorAccion && <p className="cert-error" role="alert">{errorAccion}</p>}

            {confirmar && (
              <div className="cert-confirmar" role="alertdialog" aria-label="Confirmar acción">
                <p>
                  {confirmar === 'eliminar' && 'El borrador se eliminará de forma permanente.'}
                  {confirmar === 'validar'  && 'Al marcarlo como válido ya no podrás editar sus datos ni eliminarlo; solo revocarlo.'}
                  {confirmar === 'revocar'  && 'Al revocarlo queda sin validez y no se puede deshacer.'}
                </p>
                <div className="modal-acciones">
                  <button className="btn-cancelar" onClick={() => setConfirmar(null)} disabled={accionando}>Volver</button>
                  <button
                    className={confirmar === 'validar' ? 'btn-enviar' : 'btn-enviar btn-peligro'}
                    disabled={accionando}
                    onClick={() => (confirmar === 'eliminar' ? eliminar(detalle) : cambiarEstado(detalle, confirmar === 'validar' ? 'valid' : 'revoked'))}
                  >
                    {accionando ? 'Un momento…' : confirmar === 'eliminar' ? 'Sí, eliminar' : confirmar === 'validar' ? 'Sí, marcar como válido' : 'Sí, revocar'}
                  </button>
                </div>
              </div>
            )}

            {!confirmar && (
              <div className="modal-acciones modal-acciones--wrap">
                {detalle.status === 'pending' && (
                  <>
                    <button className="btn-descargar" onClick={() => abrirEditar(detalle)}>Editar</button>
                    <button className="btn-descargar" onClick={() => { setConfirmar('eliminar'); setErrorAccion('') }}>Eliminar</button>
                    <button className="btn-enviar" onClick={() => { setConfirmar('validar'); setErrorAccion('') }}>Marcar como válido</button>
                  </>
                )}
                {detalle.status === 'valid' && (
                  <>
                    <button className="btn-descargar" onClick={() => { setConfirmar('revocar'); setErrorAccion('') }}>Revocar</button>
                    <button className="btn-enviar" onClick={() => abrirEnviar(detalle)}><SendIcon /> Enviar a la familia</button>
                  </>
                )}
                {detalle.status === 'revoked' && (
                  <p className="cert-sub">Este certificado fue revocado y ya no admite cambios.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal compartir / enviar a la familia ── */}
      <CompartirModal
        isOpen={mostrarEnviar}
        onClose={() => setMostrarEnviar(false)}
        title={certEnviar ? `Certificado: ${certEnviar.organizationName}` : 'Enviar certificado'}
        tag="RECONOCIMIENTO · SON UP"
        childId={certEnviar?.studentId}
        studentName={certEnviar ? nombreEstudiante(certEnviar.studentId) : ''}
        resourceUrl={certEnviar?.url || ''}
        defaultSubject={certEnviar ? `Certificado: ${certEnviar.organizationName} — ${nombreEstudiante(certEnviar.studentId)}` : 'Certificado de participación'}
        defaultMessage={certEnviar ? `Estimada familia,\n\nCompartimos con ustedes el certificado "${certEnviar.organizationName}" correspondiente al estudiante ${nombreEstudiante(certEnviar.studentId)} por su participación y dedicación en el proceso formativo de Son Up.\n\nPueden consultarlo en el siguiente enlace:\n${certEnviar.url ?? '(enlace adjunto)'}\n\nEquipo Son Up · Fundación Asisco` : ''}
      />

      {/* ── Modal crear ── */}
      {mostrarCrear && (
        <div className="modal-overlay" onClick={cerrarCrear} role="dialog" aria-modal="true">
          <div className="modal-card modal-card--crear" onClick={e => e.stopPropagation()}>

            <div className="modal-head">
              <div>
                <p className="modal-tag">{editandoId ? 'BORRADOR' : 'NUEVO DOCUMENTO'}</p>
                <h2 className="modal-titulo">{editandoId ? 'Editar certificado' : 'Crear certificado'}</h2>
              </div>
              <button className="modal-close" onClick={cerrarCrear} aria-label="Cerrar">
                <XIcon />
              </button>
            </div>

            <div className="crear-grid">
              <div className="cert-campo">
                <label className="cert-label">Participante</label>
                <select
                  className="cert-select"
                  value={form.studentId}
                  disabled={Boolean(editandoId)}
                  onChange={e => setForm(p => ({ ...p, studentId: e.target.value, workshopId: '' }))}
                >
                  <option value="">Seleccionar estudiante…</option>
                  {niños.map(n => {
                    const id     = String(n.id)
                    const nombre = [n.firstName, n.lastName].filter(Boolean).join(' ') || `Estudiante ${id}`
                    return <option key={id} value={id}>{nombre}</option>
                  })}
                </select>
              </div>
              <div className="cert-campo">
                <label className="cert-label">Taller (opcional)</label>
                <small className="cert-ayuda">Solo talleres finalizados a los que el participante asistió.</small>
                <select
                  className="cert-select"
                  value={form.workshopId}
                  onChange={e => upd('workshopId', e.target.value)}
                >
                  <option value="">Sin taller asociado</option>
                  {talleresAsociables.map(t => (
                    <option key={String(t.id)} value={String(t.id)}>{t.name}</option>
                  ))}
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
                <label className="cert-label">URL del documento (https://…)</label>
                <input
                  type="url" className="cert-input" value={form.url}
                  onChange={e => upd('url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            {errorGuardar && (
              <p className="cert-error">{errorGuardar}</p>
            )}

            <div className="modal-acciones">
              <button className="btn-cancelar" onClick={cerrarCrear}>Cancelar</button>
              <button
                className="btn-crear-cert"
                onClick={crearCert}
                disabled={!puedeCrear}
              >
                {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear certificado'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Certificados
