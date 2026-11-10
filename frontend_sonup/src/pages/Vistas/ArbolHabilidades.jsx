import { getSkillCategories, getSkills } from '../../services/skills.js'
import { getEvaluationScales } from '../../services/evaluations.js'
import useCarga from './useCarga.js'
import './Vistas.css'

/** Árbol de habilidades (solo consulta): categorías → habilidades, más la escala de valoración. */
const ArbolHabilidades = () => {
  const { datos, cargando, error } = useCarga(async () => {
    const [categorias, habilidades, escalas] = await Promise.all([
      getSkillCategories(), getSkills(), getEvaluationScales().catch(() => []),
    ])
    return { categorias, habilidades, escalas }
  }, [])

  const porCategoria = (cat) => datos.habilidades.filter(s => String(s.skillCategoryId ?? s.categoryId) === String(cat.id))

  return (
    <div className="vista-page">
      <header>
        <p className="vista-eyebrow">CONSULTA</p>
        <h1 className="vista-titulo">Árbol de habilidades</h1>
        <p className="vista-sub">Categorías y habilidades que se trabajan en los talleres, y la escala con la que se valoran.</p>
      </header>

      {cargando && <p className="vista-estado">Cargando el árbol…</p>}
      {error && <p className="vista-estado vista-estado--error" role="alert">{error}</p>}

      {datos && (
        <>
          {datos.escalas.length > 0 && (
            <section className="vista-card">
              <h2 className="vista-card__titulo">Escala de valoración</h2>
              <ul className="arbol-escalas" role="list">
                {datos.escalas.map(e => (<li key={String(e.id)}><b>{e.code}</b>{e.name}</li>))}
              </ul>
            </section>
          )}

          {datos.categorias.length === 0 && <p className="vista-estado">Aún no hay categorías creadas.</p>}
          {datos.categorias.map(cat => {
            const skills = porCategoria(cat)
            return (
              <section key={String(cat.id)} className="arbol-cat">
                <div className="arbol-cat__head"><span>{cat.name}</span><small>{skills.length} {skills.length === 1 ? 'habilidad' : 'habilidades'}</small></div>
                {skills.length === 0
                  ? <p className="vista-item__meta" style={{ padding: '0.8rem 1.1rem' }}>Sin habilidades en esta categoría.</p>
                  : (
                    <ul className="arbol-skills" role="list">
                      {skills.map(s => (
                        <li key={String(s.id)}>
                          <strong>{s.name}</strong>
                          {s.description && <span>{s.description}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}

export default ArbolHabilidades
