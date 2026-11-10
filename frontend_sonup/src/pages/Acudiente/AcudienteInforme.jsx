import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getChild } from '../../services/children.js'
import { getStudentCategoryAverages } from '../../services/skills.js'
import { getStudentAttendances } from '../../services/attendances.js'
import { getStudentCredentials } from '../../services/credentials.js'
import { getWorkshops, completeWorkshopsFromAttendances } from '../../services/workshops.js'
import CompartirModal from '../../components/CompartirModal/CompartirModal.jsx'
import { createShareDocument, escapeHtml } from '../../utils/share-document.js'
import './AcudienteInforme.css'

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const semestre = () => new Date().getMonth() < 6 ? 'primer' : 'segundo'
const año = () => new Date().getFullYear()

const formatFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

/* ─── Component ──────────────────────────────────────────────────────────── */

const AcudienteInforme = () => {
  const navigate = useNavigate()
  const { activeChildId, logout } = useAuth()
  const cerrarSesion = () => { logout(); navigate('/login', { replace: true }) }

  const [niño,        setNiño]        = useState(null)
  const [catAverages, setCatAverages] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [talleresMapa,setTalleresMapa]= useState({})
  const [credencial,  setCredencial]  = useState(null)
  const [cargando,    setCargando]    = useState(true)
  const [mostrarCompartir, setMostrarCompartir] = useState(false)

  useEffect(() => {
    const studentId = activeChildId
    if (!studentId) { setCargando(false); return } // sin id todavía (Saga despertando o cuenta sin enlazar)
    const load = async () => {
      try {
        const [childRes, catRes, asistRes, wsRes, credRes] = await Promise.allSettled([
          getChild(studentId),
          getStudentCategoryAverages(studentId),
          getStudentAttendances(studentId),
          getWorkshops({}),
          getStudentCredentials(studentId),
        ])

        if (childRes.status === 'fulfilled') setNiño(childRes.value)
        setCatAverages(catRes.status === 'fulfilled' ? catRes.value : [])

        const asist = asistRes.status === 'fulfilled'
          ? [...asistRes.value].sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
          : []
        setAsistencias(asist)

        const allWs = await completeWorkshopsFromAttendances(wsRes.status === 'fulfilled' ? wsRes.value : [], asist)
        const mapa = {}
        allWs.forEach(w => { mapa[String(w.id)] = w })
        setTalleresMapa(mapa)

        if (credRes.status === 'fulfilled') {
          setCredencial(credRes.value.find(c => c.status === 'valid') ?? null)
        }
      } catch {}
      finally { setCargando(false) }
    }
    load()
  }, [activeChildId])

  const nombre    = niño ? [niño.firstName, niño.lastName].filter(Boolean).join(' ') || 'Estudiante' : 'Estudiante'
  const iniciales = niño
    ? [niño.firstName, niño.lastName].filter(Boolean).map(s => s[0].toUpperCase()).join('')
    : 'J'

  const workshopNombres = useMemo(() => {
    const ids = [...new Set(asistencias.map(a => String(a.workshopId)))]
    return ids.map(id => talleresMapa[id]?.name).filter(Boolean)
  }, [asistencias, talleresMapa])

  /* Últimas 3 observaciones no vacías */
  const observaciones = useMemo(() =>
    asistencias
      .filter(a => a.observation)
      .slice(0, 3)
      .map(a => ({
        texto:  a.observation,
        taller: talleresMapa[String(a.workshopId)]?.name ?? `Taller ${a.workshopId}`,
        fecha:  formatFecha(a.attendedAt),
      })),
    [asistencias, talleresMapa]
  )

  const reportFile = useMemo(() => {
    if (!niño) return null
    return createShareDocument({
      title: `Informe del ${semestre()} semestre ${año()}`,
      subtitle: nombre,
      sections: [
        {
          title: 'Información del estudiante',
          rows: [
            ['Nombre', nombre],
            ['Talleres', workshopNombres.join(', ') || 'Sin talleres registrados'],
          ],
        },
        {
          title: 'Progreso por categoría',
          items: catAverages.map(c =>
            `${c.categoryName}: promedio ${c.average.toFixed(1)} / 5 (${c.skillCount} habilidades valoradas)`
          ),
        },
        {
          title: 'Observaciones del tallerista',
          items: observaciones.map(o => `${o.texto} (${o.taller} · ${o.fecha})`),
        },
      ],
    })
  }, [niño, nombre, workshopNombres, catAverages, observaciones])

  const handleDownloadPDF = () => {
    /* Generar PDF con datos reales */
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir el informe.')
      return
    }

    const categoriasHtml = catAverages.map(c =>
      `<li><strong>${escapeHtml(c.categoryName)}</strong>: promedio ${c.average.toFixed(1)} / 5 (${c.skillCount} habilidad${c.skillCount !== 1 ? 'es' : ''})</li>`
    ).join('')

    const obsHtml = observaciones.map(o =>
      `<li>${escapeHtml(o.texto)} <em>(${escapeHtml(o.taller)} · ${escapeHtml(o.fecha)})</em></li>`
    ).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe del ${semestre()} semestre ${año()} - ${nombre}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: Arial, sans-serif; color: #173632; background: #fff; margin: 0; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #176D65; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-text { font-size: 38px; font-weight: 900; margin: 0; }
          .logo-orange { color: #F49A18; }
          .logo-teal   { color: #176D65; }
          .tagline { font-size: 13px; color: #687974; margin-top: 6px; }
          .doc-title { font-size: 24px; font-weight: 800; margin-top: 25px; margin-bottom: 5px; }
          .meta { font-size: 14px; color: #687974; margin-bottom: 25px; }
          .card { background: #F9FAF9; border: 1px solid #DFE5E2; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: 700; color: #176D65; margin-top: 0; margin-bottom: 10px; text-transform: uppercase; }
          ul { margin: 0; padding-left: 1.2em; }
          li { margin-bottom: 6px; font-size: 15px; line-height: 1.6; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #DFE5E2; display: flex; justify-content: space-between; font-size: 12px; color: #687974; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="logo-text"><span class="logo-orange">asis</span><span class="logo-teal">co</span></p>
          <p class="tagline">Asociación de Interés Social Comunitario</p>
          <h1 class="doc-title">Informe del ${semestre()} semestre ${año()}</h1>
          <p class="meta"><strong>Estudiante:</strong> ${escapeHtml(nombre)} | <strong>Talleres:</strong> ${escapeHtml(workshopNombres.join(', ') || 'Sin talleres')}</p>
        </div>

        ${catAverages.length > 0 ? `
        <div class="card">
          <h2 class="section-title">Progreso por categoría</h2>
          <ul>${categoriasHtml}</ul>
        </div>` : ''}

        ${observaciones.length > 0 ? `
        <div class="card">
          <h2 class="section-title">Observaciones del tallerista</h2>
          <ul>${obsHtml}</ul>
        </div>` : ''}

        <div class="footer">
          <span>Fundación Asisco · Proyecto SonUp</span>
          <span>${credencial?.createdAt ? `Firmado el ${escapeHtml(formatFecha(credencial.createdAt))}` : new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (cargando) {
    return (
      <div className="ai-page">
        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
          Cargando informe…
        </p>
      </div>
    )
  }

  return (
    <div className="ai-page">
      {/* Header */}
      <header className="ai-header">
        <div className="ai-header__perfil">
          <div className="ai-avatar" aria-hidden="true">{iniciales}</div>
          <div>
            <h1 className="ai-nombre">{nombre}</h1>
            <p className="ai-modulos">
              {workshopNombres.length > 0 ? workshopNombres.join(', ') : 'Sin talleres'}
            </p>
          </div>
        </div>
      </header>

      {/* Tarjeta del informe */}
      <main className="ai-card-wrap">
        <article className="ai-card">
          <button className="ai-volver" onClick={() => navigate('/acudiente')} aria-label="Volver al inicio">
            <ChevronLeftIcon />
            <span>Volver</span>
          </button>

          {/* Banner */}
          <div className="ai-banner" aria-label="Logo institucional Asisco">
            <div className="ai-banner__logo">
              <span className="ai-banner__orange">asis</span>
              <span className="ai-banner__teal">co</span>
            </div>
            <p className="ai-banner__sub">Asociación de Interés Social Comunitario</p>
          </div>

          {/* Contenido */}
          <div className="ai-content">
            <h2 className="ai-titulo">
              Informe del {semestre()} semestre {año()}
            </h2>

            {/* Progreso por categoría */}
            {catAverages.length > 0 && (
              <>
                <h3 className="ai-subtitulo">Progreso por categoría</h3>
                {catAverages.map(c => (
                  <p key={String(c.skillCategoryId)} className="ai-parrafo">
                    <strong>{c.categoryName}</strong>: promedio de {c.average.toFixed(1)} sobre 5,
                    con {c.skillCount} habilidad{c.skillCount !== 1 ? 'es' : ''} valorada{c.skillCount !== 1 ? 's' : ''}.
                  </p>
                ))}
              </>
            )}

            {/* Observaciones del tallerista */}
            {observaciones.length > 0 && (
              <>
                <h3 className="ai-subtitulo">Lo que contaron sus profes</h3>
                {observaciones.map((o, i) => (
                  <p key={i} className="ai-parrafo">
                    "{o.texto}" — <em>{o.taller}, {o.fecha}</em>
                  </p>
                ))}
              </>
            )}

            {catAverages.length === 0 && observaciones.length === 0 && (
              <p className="ai-parrafo" style={{ color: 'var(--color-text-muted, #888)' }}>
                Aún no hay datos suficientes para generar el informe.
              </p>
            )}

            {credencial && (
              <p className="ai-parrafo" style={{ fontSize: '0.85rem', color: '#687974' }}>
                Firmado el {formatFecha(credencial.createdAt)} · {credencial.organizationName}
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="ai-descargar-btn" onClick={handleDownloadPDF} aria-label="Imprimir informe">
              <DownloadIcon />
              <span>Imprimir informe</span>
            </button>
            <button
              type="button"
              className="ai-descargar-btn"
              style={{ background: '#25D366' }}
              onClick={() => setMostrarCompartir(true)}
              aria-label="Compartir informe con familiar"
            >
              <SendIcon />
              <span>Compartir con familiar</span>
            </button>
          </div>
        </article>
      </main>

      {/* ── Modal compartir informe ── */}
      <CompartirModal
        isOpen={mostrarCompartir}
        onClose={() => setMostrarCompartir(false)}
        title={`Informe de ${nombre}`}
        tag="INFORME SEMESTRAL · ASISCO"
        childId={niño?.id}
        studentName={nombre}
        attachmentFile={reportFile}
        defaultSubject={`Informe del ${semestre()} semestre ${año()} — ${nombre}`}
        defaultMessage={`Hola,\n\nTe comparto el informe del ${semestre()} semestre ${año()} de ${nombre} en Son Up. Incluye el progreso por categoría, los talleres y las observaciones registradas.\n\n¡Conoce sus avances en la Fundación Asisco!`}
      />

      {/* Footer */}
      <footer className="ai-footer">
        <button className="ai-logout" onClick={cerrarSesion} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default AcudienteInforme
