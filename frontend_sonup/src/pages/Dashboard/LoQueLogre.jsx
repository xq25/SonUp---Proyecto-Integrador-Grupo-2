import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudentSkills, getSkillCategories } from '../../services/skills.js'
import { getSkills } from '../../services/skills.js'
import { getEvaluationScales } from '../../services/evaluations.js'
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
  const [categorias,     setCategorias]     = useState([])
  const [studentSkills,  setStudentSkills]  = useState([])
  const [allSkills,      setAllSkills]      = useState([])
  const [scaleMap,       setScaleMap]       = useState({})
  const [cargando,       setCargando]       = useState(true)
  const [errorCarga,    setErrorCarga]    = useState('')
  const [activeTab,      setActiveTab]      = useState('')

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
    const load = async () => {
      try {
        const [categoryRows, studentRows, skillRows, scales] = await Promise.all([
          getSkillCategories(),
          getStudentSkills(studentId),
          getSkills(),
          getEvaluationScales({ activeOnly: false }),
        ])

        setStudentSkills(studentRows)
        setAllSkills(skillRows)

        const smap = {}
        scales.forEach(s => { smap[String(s.id)] = s.name })
        setScaleMap(smap)

        const skillCategories = new Map(skillRows.map(skill => [String(skill.id), String(skill.skillCategoryId)]))
        const ratedCategoryIds = new Set(
          studentRows
            .map(skill => skillCategories.get(String(skill.skillId)))
            .filter(Boolean)
        )
        const ratedCategories = categoryRows.filter(category => ratedCategoryIds.has(String(category.id)))
        setCategorias(ratedCategories)
        if (ratedCategories.length > 0) setActiveTab(String(ratedCategories[0].id))

      } catch (error) {
        setErrorCarga(`No se pudieron cargar tus calificaciones: ${error.message}`)
      }
      finally { setCargando(false) }
    }
    load()
  }, [])

  const porCategoria = useMemo(() => {
    const skillInfo = {}
    allSkills.forEach(s => { skillInfo[String(s.id)] = { name: s.name, catId: String(s.skillCategoryId) } })

    const result = {}
    studentSkills.forEach(ss => {
      const info = skillInfo[String(ss.skillId)]
      if (!info) return
      if (!result[info.catId]) result[info.catId] = []
      result[info.catId].push({
        skillId: String(ss.skillId),
        name: info.name,
        grade: scaleMap[String(ss.evaluationScaleId)] || 'Calificación no disponible',
      })
    })
    return result
  }, [studentSkills, allSkills, scaleMap])

  const habilidades = porCategoria[activeTab] ?? []

  return (
    <div className="ll-page">

      {/* Top bar */}
      <header className="ll-topbar">
        <button className="ll-topbar__back" onClick={() => navigate('/dashboard')} aria-label="Volver al inicio">
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
        <button className="ll-logout" onClick={() => navigate('/login')} aria-label="Cerrar sesión">
          <ChevronLeftIcon /> Cerrar sesión
        </button>
      </footer>

    </div>
  )
}

export default LoQueLogre
