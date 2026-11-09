import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getChildren, getChild, getChildGuardians } from '../../../services/children.js'
import { getStudentCategoryAverages }            from '../../../services/skills.js'
import { getStudentCredentials }                 from '../../../services/credentials.js'
import { getStudentEvidences }                   from '../../../services/evidences.js'
import { getStudentAttendances }                 from '../../../services/attendances.js'
import { getWorkshops }                          from '../../../services/workshops.js'
import CompartirModal                            from '../../../components/CompartirModal/CompartirModal.jsx'
import { createShareDocument } from '../../../utils/share-document.js'
import './ParticipantePerfil.css'

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const CertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
)

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
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

const initiales = (first, last) =>
  ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?'

const formatFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

const formatFechaLarga = (iso) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

/* ─── Component ──────────────────────────────────────────────────────────── */

const ParticipantePerfil = () => {
  const navigate    = useNavigate()
  const { childId } = useParams()
  const { pathname } = useLocation()
  const base = pathname.startsWith('/administrador') ? '/administrador' : '/tallerista'
  const [verMas,    setVerMas]    = useState(false)
  const [tabActivo, setTabActivo] = useState(null)

  /* Datos */
  const [niños,           setNiños]           = useState([])
  const [niño,            setNiño]            = useState(null)
  const [acudientes,      setAcudientes]      = useState([])
  const [catAverages,     setCatAverages]     = useState([])
  const [credenciales,    setCredenciales]    = useState([])
  const [evidencias,      setEvidencias]      = useState([])
  const [asistencias,     setAsistencias]     = useState([])
  const [talleresMapa,    setTalleresMapa]    = useState({})
  const [cargando,        setCargando]        = useState(true)

  /* Estado del modal compartir */
  const [modalCompartir, setModalCompartir] = useState({
    isOpen: false,
    title: '',
    tag: '',
    defaultSubject: '',
    defaultMessage: '',
    resourceUrl: '',
    attachmentFile: null,
  })

  /* When no childId in URL, load children list and redirect to the first one */
  useEffect(() => {
    if (childId) return
    getChildren()
      .then(kids => {
        if (kids.length > 0) navigate(`${base}/participante/${kids[0].id}`, { replace: true })
        else setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [childId, base, navigate])

  useEffect(() => {
    if (!childId) return
    const load = async () => {
      const results = await Promise.allSettled([
        getChild(childId),
        getChildGuardians(childId),
        getStudentCategoryAverages(childId),
        getStudentCredentials(childId),
        getStudentEvidences(childId),
        getStudentAttendances(childId),
        getWorkshops({}),
        getChildren(),
      ])
      const [child, guardians, catAvg, creds, evids, asist, ws, allChildren] = results

      if (child.status    === 'fulfilled') setNiño(child.value)
      if (guardians.status === 'fulfilled') setAcudientes(guardians.value)
      if (catAvg.status   === 'fulfilled') {
        setCatAverages(catAvg.value)
        if (catAvg.value.length) setTabActivo(catAvg.value[0].categoryName)
      }
      if (creds.status    === 'fulfilled') setCredenciales(creds.value)
      if (evids.status    === 'fulfilled') setEvidencias(evids.value)
      if (asist.status    === 'fulfilled') setAsistencias(asist.value)
      if (ws.status       === 'fulfilled') {
        const mapa = {}
        ws.value.forEach(w => { mapa[String(w.id)] = w.name })
        setTalleresMapa(mapa)
      }
      if (allChildren.status === 'fulfilled') setNiños(allChildren.value)
      setCargando(false)
    }
    load()
  }, [childId])

  /* Derivados */
  const nombre   = niño ? [niño.firstName, niño.lastName].filter(Boolean).join(' ') || 'Participante' : '…'
  const edad     = niño?.birthDate ? calcularEdad(niño.birthDate) : null
  const iniciales = niño ? initiales(niño.firstName, niño.lastName) : '?'
  const acudienteObj = acudientes[0]?.guardian ?? acudientes[0] ?? null

  const progresoPct = useMemo(() => {
    if (!catAverages.length) return 0
    const avg = catAverages.reduce((s, c) => s + c.average, 0) / catAverages.length
    return Math.round((avg / 5) * 100)
  }, [catAverages])

  const catActiva = catAverages.find(c => c.categoryName === tabActivo) ?? null

  const seguimiento = useMemo(() =>
    [...asistencias]
      .filter(a => a.observation)
      .sort((a, b) => new Date(b.attendedAt) - new Date(a.attendedAt))
      .slice(0, 8)
      .map(a => ({
        fecha: formatFechaCorta(a.attendedAt),
        texto: a.observation,
        tag:   talleresMapa[String(a.workshopId)] ?? `Taller ${a.workshopId}`,
      })),
    [asistencias, talleresMapa]
  )

  return (
    <div className="perfil-page">

      {/* ── Header ── */}
      <header className="perfil-header">
        <div>
          <h1 className="perfil-header__title">Perfil del participante</h1>
          <p className="perfil-header__subtitle">Información organizada por categoría de habilidades</p>
        </div>
        <div className="perfil-header__acciones">
          {niños.length > 0 && (
            <select
              className="perfil-selector"
              value={String(childId)}
              onChange={e => navigate(`${base}/participante/${e.target.value}`)}
              aria-label="Cambiar participante"
            >
              {niños.map(n => (
                <option key={String(n.id)} value={String(n.id)}>
                  {[n.firstName, n.lastName].filter(Boolean).join(' ') || `Participante ${n.id}`}
                </option>
              ))}
            </select>
          )}
          <button className="btn-informe" onClick={() => navigate(`${base}/informes/${childId}`)}>
            <FileTextIcon />
            Generar informe
          </button>
        </div>
      </header>

      {cargando ? (
        <p style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)' }}>
          Cargando perfil…
        </p>
      ) : (

      /* ── Body ── */
      <div className="perfil-body">

        {/* ── Sidebar ── */}
        <aside className="perfil-sidebar">

          {/* Tarjeta de perfil */}
          <div className="card">
            <div className="perfil-avatar">{iniciales}</div>
            <h2 className="perfil-nombre">{nombre}</h2>
            {edad !== null && (
              <p className="perfil-meta">{edad} años</p>
            )}
            {niño?.notes && (
              <span className="perfil-nivel">{niño.notes.slice(0, 60)}{niño.notes.length > 60 ? '…' : ''}</span>
            )}

            {acudienteObj && (
              <div className="perfil-acudiente">
                <span className="perfil-acudiente__label">Acudiente</span>
                <p className="perfil-acudiente__nombre">{acudienteObj.fullName ?? '—'}</p>
                {acudienteObj.phone && (
                  <p className="perfil-acudiente__dato">📞 {acudienteObj.phone}</p>
                )}
                <button
                  type="button"
                  className="btn-compartir-familiar-perfil"
                  onClick={() =>
                    setModalCompartir({
                      isOpen: true,
                      title: `Informe de seguimiento de ${nombre}`,
                      tag: 'INFORME · SON UP',
                      defaultSubject: `Informe de seguimiento de ${nombre} — Son Up`,
                      defaultMessage: `Estimada familia,\n\nAdjuntamos el informe de seguimiento de ${nombre}, con el progreso registrado y las observaciones recientes.\n\nEquipo Son Up · Fundación Asisco`,
                      attachmentFile: createShareDocument({
                        title: `Informe de seguimiento de ${nombre}`,
                        subtitle: edad !== null ? `${nombre} · ${edad} años` : nombre,
                        sections: [
                          {
                            title: 'Progreso por categoría',
                            items: catAverages.map(category =>
                              `${category.categoryName}: promedio ${category.average.toFixed(1)} / 5 (${category.skillCount} habilidades valoradas)`
                            ),
                          },
                          {
                            title: 'Seguimiento reciente',
                            items: seguimiento.map(item =>
                              `${item.fecha} · ${item.tag}: ${item.texto}`
                            ),
                          },
                        ],
                      }),
                    })
                  }
                >
                  <SendIcon /> Compartir con familiar
                </button>
              </div>
            )}
          </div>

          {/* Tarjeta de progreso */}
          <div className="card">
            <div className="progreso-header">
              <span className="progreso-titulo">
                {tabActivo ? `Progreso en ${tabActivo}` : 'Progreso general'}
              </span>
              <span className="progreso-pct">{progresoPct}%</span>
            </div>
            <p className="progreso-sub">Según las valoraciones registradas</p>

            {catAverages.length === 0 ? (
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Sin valoraciones aún.
              </p>
            ) : (
              <ul className="barras-lista" role="list">
                {catAverages.map(c => (
                  <li key={String(c.skillCategoryId)} className="barra-item">
                    <div className="barra-fila">
                      <span className="barra-nombre">{c.categoryName}</span>
                      <span className="barra-ratio">{c.average.toFixed(1)} de 5</span>
                    </div>
                    <div className="barra-track">
                      <div
                        className="barra-fill"
                        style={{ width: `${(c.average / 5) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </aside>

        {/* ── Contenido principal ── */}
        <section className="perfil-content">

          {/* Tabs de categoría */}
          {catAverages.length > 0 && (
            <div className="modulo-tabs" role="tablist">
              {catAverages.map(c => (
                <button
                  key={String(c.skillCategoryId)}
                  role="tab"
                  aria-selected={tabActivo === c.categoryName}
                  className={`modulo-tab${tabActivo === c.categoryName ? ' modulo-tab--activo' : ''}`}
                  onClick={() => setTabActivo(c.categoryName)}
                >
                  {c.categoryName}
                </button>
              ))}
            </div>
          )}

          {/* Grid: estado de categoría (izq) + certificados/evidencias (der) */}
          <div className="perfil-indicadores-fila">

            <div className="card">
              <div className="indicadores-cabecera">
                <h3 className="card-titulo">
                  {catActiva ? `Habilidades en ${catActiva.categoryName}` : 'Habilidades'}
                </h3>
              </div>

              {catActiva ? (
                <div className="grafica">
                  <div className="grafica__col" style={{ flex: 'none', width: '80px' }}>
                    <span className="grafica__valor">{catActiva.skillCount} hab.</span>
                    <div className="grafica__pista">
                      <div
                        className="grafica__barra grafica__barra--actual"
                        style={{ height: `${(catActiva.average / 5) * 100}%` }}
                      />
                    </div>
                    <span className="grafica__periodo">Actual</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Sin valoraciones en esta categoría.
                </p>
              )}

              {catActiva && (
                <p className="grafica__nota">
                  Promedio: <strong>{catActiva.average.toFixed(2)} / 5</strong>
                  &nbsp;· {catActiva.skillCount} habilidad{catActiva.skillCount !== 1 ? 'es' : ''} valorada{catActiva.skillCount !== 1 ? 's' : ''}.
                </p>
              )}
            </div>

            {/* Certificado + Apoyo gráfico — columna derecha */}
            <div className="perfil-fila-derecha">

              <div className="card">
                <div className="cert-cabecera">
                  <h3 className="card-titulo">Certificados</h3>
                  <button className="btn-ver-todo" onClick={() => navigate(`${base}/certificados`)}>
                    Ver todo
                  </button>
                </div>
                {credenciales.length === 0 ? (
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
                    Sin certificados aún.
                  </p>
                ) : credenciales.slice(0, 2).map(c => (
                  <div key={String(c.id)} className="cert-item">
                    <span className="cert-icono"><CertIcon /></span>
                    <div className="cert-info">
                      <p className="cert-nombre">{c.organizationName}</p>
                      <p className="cert-tipo">
                        Certificado · {c.createdAt ? formatFechaLarga(c.createdAt) : '—'}
                      </p>
                    </div>
                    {c.url && (
                      <a
                        className="cert-accion-btn"
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Ver certificado"
                      >
                        <DownloadIcon />
                      </a>
                    )}
                    <button
                      type="button"
                      className="cert-accion-btn"
                      onClick={() =>
                        setModalCompartir({
                          isOpen: true,
                          title: `Certificado: ${c.organizationName}`,
                          tag: 'CERTIFICADO · SON UP',
                          defaultSubject: `Certificado de ${nombre}: ${c.organizationName}`,
                          defaultMessage: `Estimada familia,\n\nCompartimos el certificado "${c.organizationName}" otorgado a ${nombre} en Son Up.\n\nPueden consultarlo en: ${c.url || '(enlace adjunto)'}\n\nEquipo Son Up · Fundación Asisco`,
                          resourceUrl: c.url || '',
                        })
                      }
                      title="Compartir certificado con familiar"
                      aria-label="Compartir certificado con familiar"
                    >
                      <SendIcon />
                    </button>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="card-titulo">Apoyo gráfico</h3>
                {evidencias.length === 0 ? (
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
                    Sin evidencias aún.
                  </p>
                ) : evidencias.slice(0, 2).map(e => (
                  <div key={String(e.id)} className="cert-item">
                    <span className="cert-icono"><VideoIcon /></span>
                    <div className="cert-info">
                      <p className="cert-nombre">{e.title}</p>
                      <p className="cert-tipo">
                        Evidencia · {e.createdAt ? formatFechaCorta(e.createdAt) : '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cert-accion-btn"
                      onClick={() =>
                        setModalCompartir({
                          isOpen: true,
                          title: `Evidencia: ${e.title}`,
                          tag: 'EVIDENCIA · SON UP',
                          defaultSubject: `Evidencia de clase: ${e.title} — ${nombre}`,
                          defaultMessage: `Estimada familia,\n\nCompartimos la evidencia "${e.title}" del proceso formativo de ${nombre} en Son Up.\n\nPueden verla en el enlace que acompaña este mensaje.\n\nEquipo Son Up · Fundación Asisco`,
                          resourceUrl: e.url || '',
                        })
                      }
                      title="Compartir evidencia con familiar"
                      aria-label="Compartir evidencia con familiar"
                    >
                      <SendIcon />
                    </button>
                    <button
                      className="cert-accion-btn"
                      onClick={() => navigate(`${base}/evidencias`)}
                      aria-label="Ver evidencia en módulo"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Anamnesis */}
          <div className="card card--prioritaria">
            <button
              className="anamnesis-cabecera"
              onClick={() => setVerMas(v => !v)}
              aria-expanded={verMas}
            >
              <div>
                <p className="prioritaria-tag">Información prioritaria · Uso interno</p>
                <h3 className="prioritaria-titulo">Anamnesis</h3>
              </div>
              <span className={`anamnesis-chevron${verMas ? ' anamnesis-chevron--abierto' : ''}`}>
                <ChevronDownIcon />
              </span>
            </button>

            {verMas && (
              <div className="anamnesis-expandida">
                {niño?.notes ? (
                  <p className="anamnesis-dx">{niño.notes}</p>
                ) : (
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
                    Sin notas registradas para este participante.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Seguimiento reciente */}
          <div className="card">
            <h3 className="card-titulo">Seguimiento reciente</h3>
            {seguimiento.length === 0 ? (
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
                Sin observaciones registradas aún.
              </p>
            ) : (
              <ul className="seguimiento-lista" role="list">
                {seguimiento.map((s, i) => (
                  <li key={i} className="seguimiento-item">
                    <span className="seguimiento-fecha">{s.fecha}</span>
                    <div>
                      <p className="seguimiento-texto">{s.texto}</p>
                      <p className="seguimiento-tag">{s.tag}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </section>
      </div>

      )}

      {/* ── Modal compartir con familiar ── */}
      <CompartirModal
        isOpen={modalCompartir.isOpen}
        onClose={() => setModalCompartir(prev => ({ ...prev, isOpen: false }))}
        title={modalCompartir.title}
        tag={modalCompartir.tag}
        childId={childId}
        studentName={nombre}
        defaultSubject={modalCompartir.defaultSubject}
        defaultMessage={modalCompartir.defaultMessage}
        resourceUrl={modalCompartir.resourceUrl}
        attachmentFile={modalCompartir.attachmentFile}
      />

    </div>
  )
}

export default ParticipantePerfil
