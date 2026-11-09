import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getChildren, getChild, getChildGuardians } from '../../../services/children.js'
import { getStudentCategoryAverages } from '../../../services/skills.js'
import { getStudentAttendances } from '../../../services/attendances.js'
import { getWorkshops } from '../../../services/workshops.js'
import Logo from '../../../components/Logo/Logo'
import CompartirModal from '../../../components/CompartirModal/CompartirModal.jsx'
import { createShareDocument } from '../../../utils/share-document.js'
import './Informes.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#176D65" />
    <polyline points="6,12 10,16 18,8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PendingCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="none" stroke="#F49A18" strokeWidth="2" />
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const calcularEdad = (birthDate) => {
  if (!birthDate) return null
  const today = new Date()
  const [y, mo, d] = birthDate.split('T')[0].split('-').map(Number)
  const birth = new Date(y, mo - 1, d)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const semestre = () => (new Date().getMonth() < 6 ? 'primer' : 'segundo')
const año = new Date().getFullYear()

const fechaActual = () => {
  const raw = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/* ─── Sub-component: Barras de progreso ──────────────────────────────────── */

const BarrasProgreso = ({ categorias }) => {
  if (!categorias.length) return null
  return (
    <div className="barras-card">
      <div className="barras-card__cabecera">
        <div>
          <p className="barras-card__titulo">Progreso por categoría</p>
          <p className="barras-card__sub">Basado en las valoraciones registradas</p>
        </div>
        <div className="barras-leyenda">
          <span className="barras-leyenda__item"><span className="dot dot--logrado" />Promedio</span>
        </div>
      </div>
      {categorias.map(c => {
        const pct = Math.round((c.average / 5) * 100)
        return (
          <div key={String(c.skillCategoryId)} className="barras-fila">
            <div className="barras-info">
              <span className="barras-nombre">{c.categoryName}</span>
              <span className="barras-detalle">
                {c.skillCount} valorada{c.skillCount !== 1 ? 's' : ''} · {c.average.toFixed(1)} / 5
              </span>
            </div>
            <div className="barras-pista">
              <div className="barras-seg barras-seg--logrado" style={{ width: `${pct}%` }} />
            </div>
            <span className="barras-pct">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Component ──────────────────────────────────────────────────────────── */

const Informes = () => {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { childId } = useParams()
  const { pathname } = useLocation()
  const base = pathname.startsWith('/administrador') ? '/administrador' : '/tallerista'
  const [mostrarEnviar, setMostrarEnviar] = useState(false)

  /* Selector */
  const [niños, setNiños] = useState([])

  /* Datos del participante */
  const [niño, setNiño] = useState(null)
  const [acudientes, setAcudientes] = useState([])
  const [catAverages, setCatAverages] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [talleres, setTalleres] = useState([])
  const [cargando, setCargando] = useState(false)

  /* Cargar lista de niños para el selector */
  useEffect(() => {
    getChildren().then(setNiños).catch(() => { })
  }, [])

  /* Cargar datos del participante cuando cambia childId */
  useEffect(() => {
    if (!childId) return
    setCargando(true)
    setNiño(null)
    setAcudientes([])
    setCatAverages([])
    setAsistencias([])
    setTalleres([])

    const evaluatorId = session?.saga?.professionalId
    Promise.allSettled([
      getChild(childId),
      getChildGuardians(childId),
      getStudentCategoryAverages(childId),
      getStudentAttendances(childId),
      getWorkshops(evaluatorId ? { evaluatorId } : {}),
    ]).then(([child, guardians, catAvg, asist, ws]) => {
      if (child.status === 'fulfilled') setNiño(child.value)
      if (guardians.status === 'fulfilled') setAcudientes(guardians.value)
      if (catAvg.status === 'fulfilled') setCatAverages(catAvg.value)
      if (asist.status === 'fulfilled') setAsistencias(asist.value)
      if (ws.status === 'fulfilled') setTalleres(ws.value)
      setCargando(false)
    })
  }, [childId, session?.saga?.professionalId])

  /* Derivados */
  const nombre = niño ? [niño.firstName, niño.lastName].filter(Boolean).join(' ') || 'Participante' : '…'
  const primerNombre = nombre.split(' ')[0]
  const edad = niño?.birthDate ? calcularEdad(niño.birthDate) : null
  const acudienteActual = acudientes[0]?.guardian ?? acudientes[0] ?? null

  const workshopsAsistidos = useMemo(() => {
    const ids = new Set(asistencias.map(a => String(a.workshopId)))
    return talleres.filter(t => ids.has(String(t.id)))
  }, [asistencias, talleres])

  const asistenciasPorTaller = useMemo(() => {
    const m = {}
    asistencias.forEach(a => {
      const id = String(a.workshopId)
      if (!m[id]) m[id] = []
      m[id].push(a)
    })
    return m
  }, [asistencias])

  const talleresStr = workshopsAsistidos.map(w => w.name).join(', ')

  const checklist = useMemo(() => [
    ...catAverages.map(c => ({
      label: `Valoraciones de ${c.categoryName}`,
      ok: c.skillCount > 0,
      estado: c.skillCount > 0 ? 'Completas' : 'Pendiente',
    })),
    { label: 'Revisión del docente', ok: false, estado: 'Pendiente' },
    { label: 'Firmas', ok: false, estado: 'Pendiente' },
  ], [catAverages])

  const titulo = `Informe del ${semestre()} semestre ${año}`
  const tagDoc = `INFORME DEL ${semestre().toUpperCase()} SEMESTRE ${año}`

  const defaultMensaje = `Estimada familia,\n\nCompartimos el informe del ${semestre()} semestre ${año} de ${nombre}.\n${workshopsAsistidos.length > 0 ? `Talleres participados: ${talleresStr}\n` : ''}${catAverages.length > 0 ? `Progreso en habilidades: ${catAverages.map(c => `${c.categoryName}: ${c.average.toFixed(1)}/5`).join(', ')}\n` : ''}\nEn él encontrarán un resumen de logros, avances y recomendaciones para el hogar.\n\nEquipo Son Up · Fundación Asisco`

  const reportFile = useMemo(() => {
    if (!niño) return null
    return createShareDocument({
      title: titulo,
      subtitle: nombre,
      sections: [
        {
          title: 'Información del estudiante',
          rows: [
            ['Nombre', nombre],
            ['Talleres', talleresStr || 'Sin talleres registrados'],
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
          items: workshopsAsistidos.flatMap(taller =>
            (asistenciasPorTaller[String(taller.id)] || [])
              .filter(attendance => attendance.observation)
              .sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
              .slice(0, 2)
              .map(attendance =>
                `${taller.name} · ${attendance.observation} (${new Date(attendance.attendedAt).toLocaleDateString('es-CO')})`
              )
          ),
        },
      ],
    })
  }, [niño, titulo, nombre, talleresStr, catAverages, workshopsAsistidos, asistenciasPorTaller])

  return (
    <div className="inf-page">

      {/* ── Header ── */}
      <header className="inf-header no-print">
        <div>
          <h1 className="inf-header__titulo">
            {childId && niño ? `${titulo} · ${nombre}` : titulo}
          </h1>
          <p className="inf-header__sub">
            {childId
              ? `${nombre} · se arma con las valoraciones y anotaciones de clase`
              : 'Selecciona un participante para ver su informe'
            }
          </p>
        </div>
        <div className="inf-header__acciones">
          {niños.length > 0 && (
            <select
              className="inf-selector"
              value={childId || ''}
              onChange={e => navigate(
                e.target.value
                  ? `${base}/informes/${e.target.value}`
                  : `${base}/informes`
              )}
              aria-label="Seleccionar participante"
            >
              <option value="">Seleccionar participante…</option>
              {niños.map(n => (
                <option key={String(n.id)} value={String(n.id)}>
                  {[n.firstName, n.lastName].filter(Boolean).join(' ') || `Participante ${n.id}`}
                </option>
              ))}
            </select>
          )}
          {childId && (
            <>
              <button className="btn-descargar" onClick={() => window.print()}>
                <DownloadIcon /> Descargar PDF
              </button>
              <button className="btn-enviar" onClick={() => setMostrarEnviar(true)}>
                <SendIcon /> Enviar a la familia
              </button>
            </>
          )}
        </div>
      </header>

      {/* Sin participante seleccionado */}
      {!childId && (
        <p style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
          Selecciona un participante en el desplegable para generar su informe.
        </p>
      )}

      {childId && cargando && (
        <p style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
          Cargando informe…
        </p>
      )}

      {/* ── Cuerpo ── */}
      {childId && !cargando && (
        <div className="inf-body">

          {/* ── Documento ── */}
          <article className="inf-documento" id="inf-doc-print">

            {/* Cabecera del documento */}
            <div className="doc-cabecera">
              <Logo />
              <div className="doc-cabecera__derecha">
                <p className="doc-cabecera__tag">{tagDoc}</p>
                <p className="doc-cabecera__fecha">Fecha: {fechaActual()}</p>
              </div>
            </div>
            <div className="doc-linea" />

            {/* Datos del participante */}
            <div className="doc-meta">
              <div className="doc-meta__campo">
                <span className="doc-meta__label">Nombre</span>
                <span className="doc-meta__valor">{nombre}</span>
              </div>
              {edad !== null && (
                <div className="doc-meta__campo">
                  <span className="doc-meta__label">Edad</span>
                  <span className="doc-meta__valor">{edad} años</span>
                </div>
              )}
              {talleresStr && (
                <div className="doc-meta__campo">
                  <span className="doc-meta__label">Talleres</span>
                  <span className="doc-meta__valor">{talleresStr}</span>
                </div>
              )}
            </div>
            <hr className="doc-separador" />

            {/* Cómo es */}
            <section className="doc-seccion">
              <h2 className="doc-seccion__titulo">Cómo es {primerNombre}</h2>
              {niño?.notes ? (
                <p className="doc-texto">{niño.notes}</p>
              ) : (
                <p className="doc-texto doc-texto--muted">Sin notas personales registradas.</p>
              )}
            </section>

            {/* Sección por cada taller al que asistió */}
            {workshopsAsistidos.map(taller => {
              const obs = (asistenciasPorTaller[String(taller.id)] || [])
                .filter(a => a.observation)
                .sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
                .slice(0, 2)
              return (
                <section key={String(taller.id)} className="doc-seccion">
                  <h2 className="doc-seccion__titulo">{taller.name}</h2>
                  {obs.length > 0 ? (
                    obs.map((a, i) => (
                      <p key={i} className="doc-texto">{a.observation}</p>
                    ))
                  ) : (
                    <p className="doc-texto doc-texto--muted">
                      Sin observaciones registradas aún en este taller.
                    </p>
                  )}
                </section>
              )
            })}

            {workshopsAsistidos.length === 0 && (
              <section className="doc-seccion">
                <p className="doc-texto doc-texto--muted">
                  Este participante no tiene asistencias registradas aún.
                </p>
              </section>
            )}

            {/* Progreso por categoría */}
            {catAverages.length > 0 && (
              <section className="doc-seccion">
                <BarrasProgreso categorias={catAverages} />
              </section>
            )}

            {/* Recomendaciones */}
            <section className="doc-seccion">
              <h2 className="doc-seccion__titulo">Recomendaciones para la casa</h2>
              <p className="doc-texto doc-texto--muted">
                Pendiente de redacción por parte del tallerista.
              </p>
            </section>

            {/* Firmas */}
            <div className="doc-firmas">
              <div className="doc-firma">
                <div className="doc-firma__linea" />
                <p className="doc-firma__nombre">Tallerista</p>
                <p className="doc-firma__rol">Son-Up</p>
              </div>
              {acudienteActual && (
                <div className="doc-firma">
                  <div className="doc-firma__linea" />
                  <p className="doc-firma__nombre">{acudienteActual.fullName || 'Acudiente'}</p>
                  <p className="doc-firma__rol">Acudiente</p>
                </div>
              )}
            </div>

          </article>

          {/* ── Panel lateral ── */}
          <aside className="inf-lateral no-print">

            <div className="card">
              <h3 className="card-titulo-sm">Antes de enviar</h3>
              <ul className="checklist" role="list">
                {checklist.map(item => (
                  <li key={item.label} className="checklist-item">
                    <span className="checklist-item__icono">
                      {item.ok ? <CheckCircleIcon /> : <PendingCircleIcon />}
                    </span>
                    <div>
                      <p className="checklist-item__label">{item.label}</p>
                      <p className={`checklist-item__estado${item.ok ? ' checklist-item__estado--ok' : ''}`}>
                        {item.estado}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="card-titulo-sm">Quién lo recibe</h3>
              <p className="quien-texto">
                La familia lo recibe en su cuenta y por correo o WhatsApp. La anamnesis y las
                notas internas no salen en el informe.
              </p>
            </div>

          </aside>

        </div>
      )}

      {/* ── Modal compartir informe con familiar ── */}
      <CompartirModal
        isOpen={mostrarEnviar && Boolean(childId)}
        onClose={() => setMostrarEnviar(false)}
        title={`Enviar informe: ${nombre}`}
        tag="INFORME SEMESTRAL · SON UP"
        childId={childId}
        studentName={nombre}
        attachmentFile={reportFile}
        defaultSubject={`${titulo} — ${nombre}`}
        defaultMessage={defaultMensaje}
      />

    </div>
  )
}

export default Informes
