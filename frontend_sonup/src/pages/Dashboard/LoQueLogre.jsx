import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudentCategoryAverages, getStudentSkills } from '../../services/skills.js'
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

const StarOutlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const BookmarkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

const SproutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 20h10"/>
    <path d="M12 20v-8"/>
    <path d="M12 12a5 5 0 0 1 5-5c0 4.5-5 5-5 5z"/>
    <path d="M12 12a5 5 0 0 0-5-5c0 4.5 5 5 5 5z"/>
  </svg>
)

const CheckSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/* numValue >= 3.5 → logrado (escala ALTO o SUPERIOR del seed) */
const esLogrado = (numValue) => numValue >= 3.5

/* ─── Component ──────────────────────────────────────────────────────────── */

const LoQueLogre = () => {
  const navigate = useNavigate()
  const [categorias,     setCategorias]     = useState([])
  const [studentSkills,  setStudentSkills]  = useState([])  // { skillId, evaluationScaleId }
  const [allSkills,      setAllSkills]      = useState([])  // { id, name, skillCategoryId }
  const [scaleMap,       setScaleMap]       = useState({})  // scaleId → numValue
  const [cargando,       setCargando]       = useState(true)
  const [activeTab,      setActiveTab]      = useState('')

  useEffect(() => {
    const studentId = import.meta.env.VITE_STUDENT_ID || '1'
    const load = async () => {
      try {
        const [catRes, skillsStudentRes, allSkillsRes, scalesRes] = await Promise.allSettled([
          getStudentCategoryAverages(studentId),
          getStudentSkills(studentId),
          getSkills(),
          getEvaluationScales(),
        ])

        const cats = catRes.status === 'fulfilled' ? catRes.value : []
        setCategorias(cats)
        if (cats.length > 0) setActiveTab(String(cats[0].skillCategoryId))

        setStudentSkills(skillsStudentRes.status === 'fulfilled' ? skillsStudentRes.value : [])
        setAllSkills(allSkillsRes.status === 'fulfilled' ? allSkillsRes.value : [])

        /* scaleId → numValue */
        const smap = {}
        if (scalesRes.status === 'fulfilled') {
          scalesRes.value.forEach(s => { smap[String(s.id)] = s.numValue })
        }
        setScaleMap(smap)

      } catch {}
      finally { setCargando(false) }
    }
    load()
  }, [])

  /*
   * Cruce de tres fuentes:
   *   studentSkills: { skillId, evaluationScaleId }
   *   allSkills:     { id, name, skillCategoryId }
   *   scaleMap:      { [scaleId]: numValue }
   *
   * Resultado: { [catId]: { logrados: string[], aprendiendo: string[] } }
   */
  const porCategoria = useMemo(() => {
    /* id → { name, skillCategoryId } */
    const skillInfo = {}
    allSkills.forEach(s => { skillInfo[String(s.id)] = { name: s.name, catId: String(s.skillCategoryId) } })

    const result = {}
    studentSkills.forEach(ss => {
      const info     = skillInfo[String(ss.skillId)]
      if (!info) return
      const numValue = scaleMap[String(ss.evaluationScaleId)] ?? 0
      if (!result[info.catId]) result[info.catId] = { logrados: [], aprendiendo: [] }
      if (esLogrado(numValue)) result[info.catId].logrados.push(info.name)
      else                      result[info.catId].aprendiendo.push(info.name)
    })
    return result
  }, [studentSkills, allSkills, scaleMap])

  const habilidades = porCategoria[activeTab] ?? { logrados: [], aprendiendo: [] }
  const hayDatos = habilidades.logrados.length > 0 || habilidades.aprendiendo.length > 0

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
                key={String(c.skillCategoryId)}
                className={`ll-tab${activeTab === String(c.skillCategoryId) ? ' ll-tab--active' : ''}`}
                onClick={() => setActiveTab(String(c.skillCategoryId))}
                aria-current={activeTab === String(c.skillCategoryId) ? 'true' : undefined}
              >
                {c.categoryName}
              </button>
            ))}
          </nav>

          <div className="ll-content">

            {/* Ya lo logré */}
            <section className="ll-card" aria-labelledby="ll-logrado-title">
              <h2 className="ll-card__title" id="ll-logrado-title">
                <StarOutlineIcon /> Ya lo logré
              </h2>
              {habilidades.logrados.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', padding: '0.5rem 0' }}>
                  {hayDatos ? 'Sigue practicando, pronto estarán aquí.' : 'Aún no hay habilidades en esta categoría.'}
                </p>
              ) : (
                <ul className="ll-items ll-items--logrado" role="list">
                  {habilidades.logrados.map((item, i) => (
                    <li key={i} className="ll-item ll-item--logrado">
                      <CheckSmIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Estoy aprendiendo */}
            <section className="ll-card" aria-labelledby="ll-aprendiendo-title">
              <h2 className="ll-card__title" id="ll-aprendiendo-title">
                <SproutIcon /> Estoy aprendiendo
              </h2>
              {habilidades.aprendiendo.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', padding: '0.5rem 0' }}>
                  {habilidades.logrados.length > 0
                    ? '¡Todo en esta categoría ya está logrado!'
                    : 'Aún no hay habilidades evaluadas aquí.'}
                </p>
              ) : (
                <ul className="ll-items ll-items--aprendiendo" role="list">
                  {habilidades.aprendiendo.map((item, i) => (
                    <li key={i} className="ll-item ll-item--aprendiendo">
                      <BookmarkIcon />
                      {item}
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
