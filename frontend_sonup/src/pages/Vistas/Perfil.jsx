import { useAuth, ROLES } from '../../context/AuthContext'
import { getStaffMember } from '../../services/staff.js'
import { getChild } from '../../services/children.js'
import { getGuardian } from '../../services/guardians.js'
import { ROLE_LABEL } from '../../components/Header/navConfig'
import VolverInicio from './VolverInicio.jsx'
import useCarga from './useCarga.js'
import './Vistas.css'

/* Solo información personal básica: nombre completo, teléfono y documento */
const basicos = (p) => {
  if (!p) return null
  const documento = [p.documentTypeName, p.documentNumber].filter(Boolean).join(' ')
  return {
    nombre:    [p.firstName, p.lastName].filter(Boolean).join(' ') || p.fullName || '',
    telefono:  p.phone || '',
    documento,
  }
}

const Basicos = ({ titulo, persona }) => {
  const d = basicos(persona)
  if (!d) return null
  return (
    <section className="vista-card">
      <h2 className="vista-card__titulo">{titulo}</h2>
      <dl className="vista-datos">
        <div><dt>Nombre completo</dt><dd>{d.nombre || '—'}</dd></div>
        <div><dt>Teléfono</dt><dd>{d.telefono || '—'}</dd></div>
        <div><dt>Documento</dt><dd>{d.documento || '—'}</dd></div>
      </dl>
    </section>
  )
}

/**
 * «Mi perfil» (tallerista / admin) y «Mis datos» (joven / acudiente): lo que el backend
 * expone del propio registro en Saga, según el rol activo.
 */
const Perfil = () => {
  const { session, saga, activeRole, activeChildId } = useAuth()
  const esJoven = activeRole === ROLES.estudiante
  const titulo = esJoven || activeRole === ROLES.acudiente ? 'Mis datos' : 'Mi perfil'

  const { datos, cargando, error } = useCarga(async () => {
    const lecturas = {
      cuenta: Promise.resolve({ usuario: session?.user?.username, correo: session?.user?.email, rol: ROLE_LABEL[activeRole] }),
    }
    if (activeRole === ROLES.admin || activeRole === ROLES.tallerista) {
      if (saga?.staffId) lecturas.personal = getStaffMember(saga.staffId)
    } else if (activeRole === ROLES.estudiante) {
      if (activeChildId) lecturas.joven = getChild(activeChildId)
    } else if (activeRole === ROLES.acudiente) {
      if (saga?.guardianId) lecturas.acudiente = getGuardian(saga.guardianId)
    }
    const claves = Object.keys(lecturas)
    const res = await Promise.allSettled(Object.values(lecturas))
    const salida = {}
    const fallos = []
    res.forEach((r, i) => (r.status === 'fulfilled' ? (salida[claves[i]] = r.value) : fallos.push(r.reason?.message)))
    // Si no se pudo leer nada del registro, se muestra el motivo (p. ej. el 403 del backend)
    if (claves.length > 1 && Object.keys(salida).length === 1 && fallos.length) throw new Error(fallos[0])
    return salida
  }, [activeRole, activeChildId, saga?.staffId, saga?.guardianId])

  const cuenta = datos?.cuenta
  return (
    <div className="vista-page">
      <VolverInicio />
      <header>
        <p className="vista-eyebrow">{ROLE_LABEL[activeRole]?.toUpperCase()}</p>
        <h1 className="vista-titulo">{titulo}</h1>
        <p className="vista-sub">Para corregir estos datos, comunícate con la coordinación de la fundación.</p>
      </header>

      {cargando && <p className="vista-estado">Cargando tus datos…</p>}
      {error && <p className="vista-estado vista-estado--error" role="alert">{error}</p>}

      {datos && (
        <>
          {cuenta && (
            <section className="vista-card">
              <h2 className="vista-card__titulo">Cuenta</h2>
              <dl className="vista-datos">
                <div><dt>Usuario</dt><dd>{cuenta.usuario ?? '—'}</dd></div>
                <div><dt>Correo</dt><dd>{cuenta.correo ?? '—'}</dd></div>
                <div><dt>Rol activo</dt><dd>{cuenta.rol ?? '—'}</dd></div>
              </dl>
            </section>
          )}
          <Basicos titulo="Información personal" persona={datos.personal ?? datos.acudiente ?? datos.joven} />
        </>
      )}
    </div>
  )
}

export default Perfil
