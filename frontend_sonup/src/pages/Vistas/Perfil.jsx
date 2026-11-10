import { useAuth, ROLES } from '../../context/AuthContext'
import { getStaffMember } from '../../services/staff.js'
import { getProfessional } from '../../services/professionals.js'
import { getChild } from '../../services/children.js'
import { getGuardian } from '../../services/guardians.js'
import { ROLE_LABEL } from '../../components/Header/navConfig'
import useCarga from './useCarga.js'
import './Vistas.css'

/* Etiquetas en español de los campos más comunes; el resto se «humaniza» desde el nombre */
const ETIQUETAS = {
  firstName: 'Nombres', lastName: 'Apellidos', fullName: 'Nombre completo', email: 'Correo', phone: 'Teléfono',
  documentNumber: 'Documento', documentType: 'Tipo de documento', documentTypeName: 'Tipo de documento',
  birthDate: 'Fecha de nacimiento', gender: 'Género', genderName: 'Género', address: 'Dirección',
  statusName: 'Estado', roleName: 'Rol', relationship: 'Parentesco', relationshipName: 'Parentesco',
  specialty: 'Especialidad', profession: 'Profesión', cityName: 'Ciudad', city: 'Ciudad',
}
const OCULTOS = new Set(['id', 'password', 'passwordHash', 'anamnesis', 'createdAt', 'updatedAt', 'deletedAt'])

const humanizar = (k) => ETIQUETAS[k] ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())

const formatValor = (k, v) => {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (/date|At$/i.test(k) && typeof v === 'string' && !Number.isNaN(Date.parse(v))) {
    return new Date(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
  }
  return String(v)
}

/** Solo valores simples; si existe `xName`, se muestra en lugar de `xId`. */
const aFilas = (obj) => {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .filter(([k, v]) => !OCULTOS.has(k) && v !== null && v !== '' && typeof v !== 'object')
    .filter(([k]) => !(k.endsWith('Id') && `${k.slice(0, -2)}Name` in obj))
    .map(([k, v]) => [humanizar(k), formatValor(k, v)])
}

const Seccion = ({ titulo, datos }) => {
  const filas = aFilas(datos)
  if (filas.length === 0) return null
  return (
    <section className="vista-card">
      <h2 className="vista-card__titulo">{titulo}</h2>
      <dl className="vista-datos">
        {filas.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
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
      if (saga?.staffId)        lecturas.staff = getStaffMember(saga.staffId)
      if (saga?.professionalId) lecturas.profesional = getProfessional(saga.professionalId)
    } else if (activeRole === ROLES.estudiante) {
      if (activeChildId) lecturas.joven = getChild(activeChildId)
    } else if (activeRole === ROLES.acudiente) {
      if (saga?.guardianId) lecturas.acudiente = getGuardian(saga.guardianId)
      if (activeChildId)    lecturas.joven = getChild(activeChildId)
    }
    const claves = Object.keys(lecturas)
    const res = await Promise.allSettled(Object.values(lecturas))
    const salida = {}
    const fallos = []
    res.forEach((r, i) => (r.status === 'fulfilled' ? (salida[claves[i]] = r.value) : fallos.push(r.reason?.message)))
    // Si no se pudo leer nada del registro, se muestra el motivo (p. ej. el 403 del backend)
    if (claves.length > 1 && Object.keys(salida).length === 1 && fallos.length) throw new Error(fallos[0])
    return salida
  }, [activeRole, activeChildId, saga?.staffId, saga?.professionalId, saga?.guardianId])

  const cuenta = datos?.cuenta
  return (
    <div className="vista-page">
      <header>
        <p className="vista-eyebrow">{ROLE_LABEL[activeRole]?.toUpperCase()}</p>
        <h1 className="vista-titulo">{titulo}</h1>
        <p className="vista-sub">Estos datos se leen de tu registro en la fundación. Para corregirlos, comunícate con la coordinación.</p>
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
          <Seccion titulo="Personal" datos={datos.staff} />
          <Seccion titulo="Perfil profesional" datos={datos.profesional} />
          <Seccion titulo="Acudiente" datos={datos.acudiente} />
          <Seccion titulo={activeRole === ROLES.acudiente ? 'Joven a cargo' : 'Mis datos'} datos={datos.joven} />
        </>
      )}
    </div>
  )
}

export default Perfil
