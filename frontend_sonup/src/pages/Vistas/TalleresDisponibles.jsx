import { useAuth, ROLES } from '../../context/AuthContext'
import { getWorkshops } from '../../services/workshops.js'
import { WORKSHOP_STATUS_LABEL, formatFecha } from '../../utils/workshops.js'
import useCarga from './useCarga.js'
import './Vistas.css'

/**
 * Talleres disponibles para joven y acudiente: GET /workshops devuelve solo planned/active.
 * Los finalizados se consultan desde el historial («Mis clases»).
 */
const TalleresDisponibles = () => {
  const { activeRole } = useAuth()
  const { datos, cargando, error } = useCarga(() => getWorkshops({}), [])
  const talleres = (datos ?? []).filter(t => t.status === 'planned' || t.status === 'active')

  return (
    <div className="vista-page">
      <header>
        <p className="vista-eyebrow">TALLERES</p>
        <h1 className="vista-titulo">Talleres disponibles</h1>
        <p className="vista-sub">
          {activeRole === ROLES.acudiente ? 'Talleres que se vienen o están en curso en la fundación.' : '¡Mira los talleres que vienen y los que ya empezaron!'}
        </p>
      </header>

      {cargando && <p className="vista-estado">Cargando talleres…</p>}
      {error && <p className="vista-estado vista-estado--error" role="alert">{error}</p>}
      {datos && talleres.length === 0 && <p className="vista-estado">Por ahora no hay talleres disponibles.</p>}

      {talleres.length > 0 && (
        <ul className="vista-grid" role="list">
          {talleres.map(t => (
            <li key={String(t.id)} className="vista-item">
              <span className={`vista-chip${t.status === 'planned' ? ' vista-chip--planned' : ''}`}>{WORKSHOP_STATUS_LABEL[t.status] ?? t.status}</span>
              <h2 className="vista-item__nombre">{t.name}</h2>
              <p className="vista-item__meta">
                {t.startsAt ? `Inicia: ${formatFecha(t.startsAt)}` : 'Fecha por definir'}
                {t.endsAt ? ` · Termina: ${formatFecha(t.endsAt)}` : ''}
              </p>
              {t.description && <p className="vista-item__meta">{t.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TalleresDisponibles
