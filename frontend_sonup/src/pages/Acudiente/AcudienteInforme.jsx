import { useNavigate } from 'react-router-dom'
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

/* ─── Component ──────────────────────────────────────────────────────────── */

const AcudienteInforme = () => {
  const navigate = useNavigate()

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para descargar o imprimir el informe en PDF.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe del Primer Semestre - Mariana Gómez</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body {
            font-family: 'Nunito', Arial, sans-serif;
            color: #173632;
            background: #ffffff;
            margin: 0;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #176D65;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 38px;
            font-weight: 900;
            margin: 0;
            line-height: 1;
          }
          .logo-orange { color: #F49A18; }
          .logo-teal { color: #176D65; }
          .tagline {
            font-size: 13px;
            color: #687974;
            letter-spacing: 0.05em;
            margin-top: 6px;
          }
          .doc-title {
            font-size: 24px;
            font-weight: 800;
            color: #173632;
            margin-top: 25px;
            margin-bottom: 5px;
          }
          .meta {
            font-size: 14px;
            color: #687974;
            margin-bottom: 25px;
          }
          .card {
            background: #F9FAF9;
            border: 1px solid #DFE5E2;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #176D65;
            margin-top: 0;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .paragraph {
            font-size: 15px;
            line-height: 1.6;
            color: #173632;
            margin: 0 0 15px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #DFE5E2;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #687974;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="logo-text">
            <span class="logo-orange">asis</span><span class="logo-teal">co</span>
          </p>
          <p class="tagline">Asociación de Interés Social Comunitario</p>
          <h1 class="doc-title">Informe del Primer Semestre</h1>
          <p class="meta"><strong>Estudiante:</strong> Mariana Gómez | <strong>Talleres:</strong> Música, Artes y Panadería | <strong>Fecha:</strong> Octubre 2024</p>
        </div>

        <div class="card">
          <h2 class="section-title">Evaluación del Proceso</h2>
          <p class="paragraph">Mariana ha mostrado avances importantes en Música y Artes. Sigue el pulso lento sin ayuda y disfruta especialmente las actividades en pareja.</p>
        </div>

        <div class="card">
          <h2 class="section-title">Recomendación para el Hogar</h2>
          <p class="paragraph">Practicar canciones marcando el pulso con palmas.</p>
        </div>

        <div class="footer">
          <span>Fundación Asisco - Proyecto SonUp</span>
          <span>Firmado el 12 de octubre de 2024</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="ai-page">
      {/* Perfil del acudiente / Estudiante */}
      <header className="ai-header">
        <div className="ai-header__perfil">
          <div className="ai-avatar" aria-hidden="true">MG</div>
          <div>
            <h1 className="ai-nombre">Mariana</h1>
            <p className="ai-modulos">Música, Artes y Panadería</p>
          </div>
        </div>
      </header>

      {/* Tarjeta del Informe */}
      <main className="ai-card-wrap">
        <article className="ai-card">
          {/* Botón Volver */}
          <button
            className="ai-volver"
            onClick={() => navigate('/acudiente')}
            aria-label="Volver al inicio de acudiente"
          >
            <ChevronLeftIcon />
            <span>Volver</span>
          </button>

          {/* Banner de Asisco grande */}
          <div className="ai-banner" aria-label="Logo institucional Asisco">
            <div className="ai-banner__logo">
              <span className="ai-banner__orange">asis</span>
              <span className="ai-banner__teal">co</span>
            </div>
            <p className="ai-banner__sub">
              Asociación de Interés Social Comunitario
            </p>
          </div>

          {/* Contenido del informe */}
          <div className="ai-content">
            <h2 className="ai-titulo">Informe del primer semestre</h2>
            <p className="ai-parrafo">
              Mariana ha mostrado avances importantes en Música y Artes. Sigue el pulso lento sin ayuda y disfruta especialmente las actividades en pareja.
            </p>

            <h3 className="ai-subtitulo">Recomendación</h3>
            <p className="ai-recomendacion">
              Practicar canciones marcando el pulso con palmas.
            </p>
          </div>

          {/* Botón Descargar PDF */}
          <button
            className="ai-descargar-btn"
            onClick={handleDownloadPDF}
            aria-label="Descargar informe en formato PDF"
          >
            <DownloadIcon />
            <span>Descargar PDF</span>
          </button>
        </article>
      </main>

      {/* Footer con Cerrar Sesión */}
      <footer className="ai-footer">
        <button
          className="ai-logout"
          onClick={() => navigate('/login')}
          aria-label="Cerrar sesión"
        >
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default AcudienteInforme
