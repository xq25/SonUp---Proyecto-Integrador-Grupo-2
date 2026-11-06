import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getChild } from '../../services/children.js'
import { getStudentCategoryAverages } from '../../services/skills.js'
import { getStudentAttendances } from '../../services/attendances.js'
import { getStudentCredentials } from '../../services/credentials.js'
import { getWorkshops } from '../../services/workshops.js'
import './AcudienteInforme.css'

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
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

  const [niño,        setNiño]        = useState(null)
  const [catAverages, setCatAverages] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [talleresMapa,setTalleresMapa]= useState({})
  const [credencial,  setCredencial]  = useState(null)
  const [cargando,    setCargando]    = useState(true)

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
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

        const allWs = wsRes.status === 'fulfilled' ? wsRes.value : []
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
  }, [])

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

  const handleDownloadPDF = () => {
    /* Si hay credencial con URL, abrirla directamente */
    if (credencial?.url) {
      window.open(credencial.url, '_blank', 'noreferrer')
      return
    }

    /* Generar PDF con datos reales */
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para descargar el informe.')
      return
    }

    const categoriasHtml = catAverages.map(c =>
      `<li><strong>${c.categoryName}</strong>: promedio ${c.average.toFixed(1)} / 5 (${c.skillCount} habilidad${c.skillCount !== 1 ? 'es' : ''})</li>`
    ).join('')

    const obsHtml = observaciones.map(o =>
      `<li>${o.texto} <em>(${o.taller} · ${o.fecha})</em></li>`
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
          <p class="meta"><strong>Estudiante:</strong> ${nombre} | <strong>Talleres:</strong> ${workshopNombres.join(', ') || 'Sin talleres'}</p>
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
          <span>${credencial?.createdAt ? `Firmado el ${formatFecha(credencial.createdAt)}` : new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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

          {/* Botón descargar */}
          <button className="ai-descargar-btn" onClick={handleDownloadPDF} aria-label="Descargar informe en PDF">
            <DownloadIcon />
            <span>{credencial?.url ? 'Ver certificado' : 'Descargar PDF'}</span>
          </button>
        </article>
      </main>

      {/* Footer */}
      <footer className="ai-footer">
        <button className="ai-logout" onClick={() => navigate('/login')} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default AcudienteInforme
