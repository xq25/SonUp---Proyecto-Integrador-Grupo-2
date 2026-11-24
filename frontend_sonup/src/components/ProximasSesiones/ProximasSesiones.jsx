import { useState } from 'react'
import { proximasSesiones } from '../../services/studentSessions.js'
import { formatHora, textToMaterials } from '../../utils/workshops.js'
import './ProximasSesiones.css'

const TZ = 'America/Bogota'
const dia = (v) => new Date(v).toLocaleDateString('es-CO', { day: 'numeric', timeZone: TZ })
const mes = (v) => new Date(v).toLocaleDateString('es-CO', { month: 'short', timeZone: TZ }).replace('.', '').toUpperCase()
const diaSemana = (v) => new Date(v).toLocaleDateString('es-CO', { weekday: 'long', timeZone: TZ })

/**
 * Próximas sesiones de los talleres del joven: tema, objetivo, horario y materiales que debe llevar.
 * Props: sesiones (de getSesionesDelJoven), talleres (id → taller), limite, titulo, cargando.
 */
const ProximasSesiones = ({ sesiones = [], talleres = {}, limite = 3, titulo = 'Próximas sesiones', cargando = false }) => {
  const [verTodas, setVerTodas] = useState(false)
  const lista = proximasSesiones(sesiones)
  const visibles = verTodas ? lista : lista.slice(0, limite)

  return (
    <section className="prox-card" aria-label={titulo}>
      <div className="prox-head">
        <h3 className="prox-titulo">{titulo}</h3>
        {lista.length > 0 && <span className="prox-total">{lista.length}</span>}
      </div>

      {cargando ? (
        <p className="prox-vacio">Cargando sesiones…</p>
      ) : lista.length === 0 ? (
        <p className="prox-vacio">No hay sesiones programadas por ahora.</p>
      ) : (
        <ul className="prox-lista" role="list">
          {visibles.map(s => {
            const materiales = textToMaterials(s.materials)
            const enCurso = s.status === 'in_progress'
            return (
              <li key={String(s.id)} className={`prox-item${enCurso ? ' prox-item--curso' : ''}`}>
                <div className="prox-fecha" aria-hidden="true">
                  <span className="prox-fecha__mes">{mes(s.startsAt)}</span>
                  <span className="prox-fecha__dia">{dia(s.startsAt)}</span>
                </div>
                <div className="prox-info">
                  <p className="prox-meta">
                    {enCurso ? <strong className="prox-curso">En curso</strong> : <span className="prox-dia">{diaSemana(s.startsAt)}</span>}
                    <span> · {formatHora(s.startsAt)}</span>
                  </p>
                  <p className="prox-tema">{s.topic}</p>
                  <p className="prox-taller">{talleres[String(s.workshopId)]?.name ?? `Taller ${s.workshopId}`}</p>
                  {s.objective && <p className="prox-objetivo">{s.objective}</p>}
                  {materiales.length > 0 && (
                    <div className="prox-materiales">
                      <span className="prox-materiales__label">Debe llevar:</span>
                      <ul className="prox-chips" role="list">
                        {materiales.map((m, i) => <li key={i} className="prox-chip">{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {lista.length > limite && (
        <button type="button" className="prox-mas" onClick={() => setVerTodas(v => !v)} aria-expanded={verTodas}>
          {verTodas ? 'Ver menos' : `Ver todas (${lista.length})`}
        </button>
      )}
    </section>
  )
}

export default ProximasSesiones
