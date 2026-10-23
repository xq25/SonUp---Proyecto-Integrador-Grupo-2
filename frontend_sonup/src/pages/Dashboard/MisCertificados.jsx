import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './MisCertificados.css'

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const RibbonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

const CERTIFICADOS = [
  {
    id: 'panaderia',
    titulo: 'Taller de panadería',
    subtitulo: 'Certificado de participación',
    bgIcon: '#E2F2EF',
    colorIcon: '#176D65',
    horas: 12,
    fecha: '16 de julio de 2025',
  },
  {
    id: 'artes',
    titulo: 'Muestra de Artes 2025',
    subtitulo: 'Certificado de participación',
    bgIcon: '#FFF0D8',
    colorIcon: '#F49A18',
    horas: 16,
    fecha: '20 de agosto de 2025',
  },
  {
    id: 'musica',
    titulo: 'Proceso musical',
    subtitulo: 'Certificado de participación',
    bgIcon: '#E2EDF5',
    colorIcon: '#3477A9',
    horas: 20,
    fecha: '10 de octubre de 2025',
  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

const MisCertificados = () => {
  const navigate = useNavigate()
  const [selectedCert, setSelectedCert] = useState(null)

  const handleDownloadPDF = (cert) => {
    // Genera un archivo imprimible o descarga el certificado
    const certWindow = window.open('', '_blank')
    if (!certWindow) {
      alert('Por favor permite ventanas emergentes para descargar el certificado.')
      return
    }

    certWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificado - ${cert.titulo}</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 20px;
            background: #fff;
            color: #173632;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 90vh;
          }
          .border-outer {
            border: 4px double #F49A18;
            padding: 40px;
            text-align: center;
            width: 90%;
            max-width: 850px;
            box-sizing: border-box;
          }
          .logo {
            font-family: sans-serif;
            font-weight: 800;
            letter-spacing: 0.2em;
            color: #176D65;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 22px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #173632;
            margin-bottom: 20px;
          }
          .name {
            font-size: 36px;
            font-style: italic;
            font-weight: bold;
            color: #176D65;
            margin: 25px 0;
          }
          .desc {
            font-size: 15px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .date {
            font-size: 13px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="border-outer">
          <div class="logo">🎗️<br/>SON UP</div>
          <div class="title">Certificado de Participación</div>
          <p>Se otorga el presente certificado a</p>
          <div class="name">Mariana Gómez</div>
          <div class="desc">
            por su participación activa en el <strong>${cert.titulo}</strong>, con una duración de ${cert.horas} horas.
          </div>
          <div class="date">Fundación Asisco · ${cert.fecha}</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `)
    certWindow.document.close()
  }

  return (
    <div className="mcert-page">
      {/* Top bar */}
      <header className="mcert-topbar">
        <button
          className="mcert-topbar__back"
          onClick={() => {
            if (selectedCert) setSelectedCert(null)
            else navigate('/dashboard')
          }}
          aria-label="Volver"
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="mcert-topbar__title">Mis certificados</h1>
        <button className="mcert-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {/* Vista detalle de certificado */}
      {selectedCert ? (
        <section className="mcert-detail" aria-label="Detalle del certificado">
          {/* Botón ver todos */}
          <div className="mcert-detail__nav">
            <button
              className="mcert-detail__back-link"
              onClick={() => setSelectedCert(null)}
            >
              <ChevronLeftIcon /> Ver todos
            </button>
          </div>

          {/* Cuadro de certificado estilo diploma */}
          <article className="mcert-diploma">
            <div className="mcert-diploma__border">
              <div className="mcert-diploma__badge">
                <RibbonIcon />
              </div>
              <p className="mcert-diploma__brand">SON UP</p>
              <h2 className="mcert-diploma__heading">CERTIFICADO DE PARTICIPACIÓN</h2>
              <p className="mcert-diploma__intro">Se otorga el presente certificado a</p>
              <p className="mcert-diploma__student">Mariana Gómez</p>
              <p className="mcert-diploma__text">
                por su participación activa en el {selectedCert.titulo}, con una duración de {selectedCert.horas} horas.
              </p>
              <p className="mcert-diploma__date">
                Fundación Asisco · {selectedCert.fecha}
              </p>
            </div>
          </article>

          {/* Botón descargar PDF */}
          <button
            className="mcert-download-btn"
            onClick={() => handleDownloadPDF(selectedCert)}
          >
            <DownloadIcon />
            <span>Descargar PDF</span>
          </button>
        </section>
      ) : (
        /* Vista lista de los 3 certificados */
        <section className="mcert-list-section" aria-label="Lista de certificados">
          <div className="mcert-grid" role="list">
            {CERTIFICADOS.map(cert => (
              <button
                key={cert.id}
                className="mcert-card"
                role="listitem"
                onClick={() => setSelectedCert(cert)}
                aria-label={`Ver certificado de ${cert.titulo}`}
              >
                <div
                  className="mcert-card__icon"
                  style={{ backgroundColor: cert.bgIcon, color: cert.colorIcon }}
                  aria-hidden="true"
                >
                  <RibbonIcon />
                </div>
                <div className="mcert-card__info">
                  <h2 className="mcert-card__title">{cert.titulo}</h2>
                  <p className="mcert-card__sub">{cert.subtitulo}</p>
                </div>
                <div className="mcert-card__chevron" aria-hidden="true">
                  <ChevronRightIcon />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mcert-footer">
        <button
          className="mcert-logout"
          onClick={() => navigate('/login')}
          aria-label="Cerrar sesión"
        >
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>
    </div>
  )
}

export default MisCertificados
