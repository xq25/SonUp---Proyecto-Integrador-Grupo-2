import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, destinoPorRol } from '../../context/AuthContext'
import { getStudentSkills } from '../../services/skills.js'
import './LoQueLogre.css'

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

/* ─── Component ──────────────────────────────────────────────────────────── */

const LoQueLogre = () => {
  const navigate = useNavigate()
  const { activeChildId, activeRole, logout } = useAuth()
  const cerrarSesion = () => { logout(); navigate('/login', { replace: true }) }
  const [categorias,    setCategorias]    = useState([])
  const [studentSkills, setStudentSkills] = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [errorCarga,    setErrorCarga]    = useState('')
  const [activeTab,     setActiveTab]     = useState('')

  useEffect(() => {
    const studentId = activeChildId
    if (!studentId) { setCargando(false); return } // sin id todavía (Saga despertando o cuenta sin enlazar)
    const load = async () => {
      try {
        const rows = await getStudentSkills(studentId)
        setStudentSkills(rows)

        // Derivar categorías únicas desde los datos embebidos
        const seenIds = new Set()
        const cats = []
        rows.forEach(ss => {
          const catId = String(ss.skillCategoryId ?? 'sin-cat')
          if (!seenIds.has(catId)) {
            seenIds.add(catId)
            cats.push({ id: catId, name: ss.categoryName ?? catId })
          }
        })
        setCategorias(cats)
        if (cats.length > 0) setActiveTab(cats[0].id)

      } catch (error) {
        setErrorCarga(`No se pudieron cargar tus calificaciones: ${error.message}`)
      }
      finally { setCargando(false) }
    }
    load()
  }, [activeChildId])

  const porCategoria = useMemo(() => {
    const result = {}
    studentSkills.forEach(ss => {
      const catId = String(ss.skillCategoryId ?? 'sin-cat')
      if (!result[catId]) result[catId] = []
      result[catId].push({
        skillId: String(ss.skillId),
        name:    ss.skillName  ?? `Habilidad ${ss.skillId}`,
        grade:   ss.scale?.name ?? (ss.average != null ? String(ss.average) : '—'),
      })
    })
    return result
  }, [studentSkills])

  const habilidades = porCategoria[activeTab] ?? []

  return (
    <div className="ll-page">

      {/* Top bar */}
      <header className="ll-topbar">
        <button className="ll-topbar__back" onClick={() => navigate(destinoPorRol([activeRole]))} aria-label="Volver al inicio">
          <ChevronLeftIcon />
        </button>
        <h1 className="ll-topbar__title">Lo que logré</h1>
        <button className="ll-topbar__sound" aria-label="Activar audio">
          <VolumeIcon />
        </button>
      </header>

      {cargando ? (
        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
          Cargando logros…
        </p>
      ) : errorCarga ? (
        <p role="alert" style={{ padding: '1.5rem', textAlign: 'center', color: '#8C2B22' }}>
          {errorCarga}
        </p>
      ) : categorias.length === 0 ? (
        <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted, #888)' }}>
          Aún no hay habilidades registradas.
        </p>
      ) : (
        <>
          {/* Tabs de categorías */}
          <nav className="ll-tabs" aria-label="Categorías">
            {categorias.map(c => (
              <button
                key={String(c.id)}
                className={`ll-tab${activeTab === String(c.id) ? ' ll-tab--active' : ''}`}
                onClick={() => setActiveTab(String(c.id))}
                aria-current={activeTab === String(c.id) ? 'true' : undefined}
              >
                {c.name}
              </button>
            ))}
          </nav>

          <div className="ll-content">

            <section className="ll-card" aria-labelledby="ll-calificaciones-title">
              <h2 className="ll-card__title" id="ll-calificaciones-title">
                Mis calificaciones
              </h2>
              {habilidades.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', padding: '0.5rem 0' }}>
                  Aún no hay habilidades calificadas en esta categoría.
                </p>
              ) : (
                <ul className="ll-items" role="list">
                  {habilidades.map(item => (
                    <li key={item.skillId} className="ll-item ll-item--calificacion">
                      <span>{item.name}</span>
                      <strong className="ll-calificacion">{item.grade}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

          </div>
        </>
      )}

      {/* Footer */}
      <footer className="ll-footer">
        <button className="ll-logout" onClick={cerrarSesion} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default LoQueLogre
