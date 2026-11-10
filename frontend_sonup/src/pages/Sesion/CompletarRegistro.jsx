import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../../context/AuthContext'
import './Sesion.css'

/**
 * Registro de la cuenta en Saga (una sola vez por usuario). Se hace DIRECTAMENTE contra
 * Saga (no contra nuestra API) con el token del propio usuario. Si el documento ya existe
 * en Saga, solo enlaza la cuenta y no cambia los datos.
 */
const SAGA_URL = (import.meta.env.VITE_SAGA_URL || 'https://saga-up-backend-lr4u.onrender.com').replace(/\/$/, '')

const TIPOS_DOCUMENTO = [
  { id: '1', label: 'Cédula de ciudadanía (CC)' },
  { id: '2', label: 'Tarjeta de identidad (TI)' },
  { id: '3', label: 'Registro civil (RC)' },
  { id: '4', label: 'Cédula de extranjería (CE)' },
  { id: '5', label: 'Pasaporte (PA)' },
]

/** Un rol por vez: el primero de la cuenta que necesite enlace. */
const REGISTRO_POR_ROL = [
  { role: ROLES.tallerista, path: '/staff/register',     titulo: 'Registro de tallerista', nombreCompleto: true  },
  { role: ROLES.estudiante, path: '/children/register',  titulo: 'Registro de joven',      nombreCompleto: false },
  { role: ROLES.acudiente,  path: '/guardians/register', titulo: 'Registro de acudiente',  nombreCompleto: true  },
]

const mensajeDeSaga = async (r) => {
  try {
    const b = await r.json()
    return b?.error?.message || b?.message || (typeof b?.error === 'string' ? b.error : null) || `Saga respondió ${r.status}`
  } catch { return `Saga respondió ${r.status}` }
}

const CompletarRegistro = () => {
  const navigate = useNavigate()
  const { session, roles, activeRole, needsLink, refreshProfile, destinoPorRol } = useAuth()

  const config = REGISTRO_POR_ROL.find(c => c.role === activeRole)

  const [form, setForm] = useState({ full_name: '', first_name: '', last_name: '', document_type_id: '1', document_number: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  if (!needsLink || !config) return <Navigate to={destinoPorRol([activeRole])} replace />

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const valido = form.document_number.trim().length >= 4 && (
    config.nombreCompleto ? form.full_name.trim().length >= 3
                          : form.first_name.trim() && form.last_name.trim()
  )

  const enviar = async (e) => {
    e.preventDefault()
    if (!valido || enviando) return
    setEnviando(true)
    setError('')
    try {
      const body = {
        document_type_id: form.document_type_id,
        document_number:  form.document_number.trim(),
        ...(config.nombreCompleto
          ? { full_name: form.full_name.trim() }
          : { first_name: form.first_name.trim(), last_name: form.last_name.trim() }),
      }
      let r
      try {
        r = await fetch(`${SAGA_URL}${config.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify(body),
        })
      } catch {
        throw new Error('No se pudo conectar con Saga. Si estaba dormido, espera unos segundos y reintenta.')
      }
      if (!r.ok) throw new Error(await mensajeDeSaga(r))
      // Con el registro hecho, se releen los ids (saga.linked, childId, professionalId…)
      await refreshProfile()
      navigate(destinoPorRol([activeRole]), { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="sesion-page">
      <form className="sesion-card sesion-card--form" onSubmit={enviar} noValidate>
        <p className="sesion-card__tag">ÚLTIMO PASO</p>
        <h1 className="sesion-card__titulo">{config.titulo}</h1>
        <p className="sesion-card__texto">
          Tu cuenta aún no está enlazada con tu registro en la fundación. Completa estos datos una sola vez;
          si tu documento ya existe, solo se enlaza y no se modifica nada.
        </p>

        {config.nombreCompleto ? (
          <div className="sesion-campo">
            <label htmlFor="reg-full">Nombre completo</label>
            <input id="reg-full" value={form.full_name} onChange={e => upd('full_name', e.target.value)} autoComplete="name" />
          </div>
        ) : (
          <div className="sesion-fila">
            <div className="sesion-campo">
              <label htmlFor="reg-first">Nombres</label>
              <input id="reg-first" value={form.first_name} onChange={e => upd('first_name', e.target.value)} autoComplete="given-name" />
            </div>
            <div className="sesion-campo">
              <label htmlFor="reg-last">Apellidos</label>
              <input id="reg-last" value={form.last_name} onChange={e => upd('last_name', e.target.value)} autoComplete="family-name" />
            </div>
          </div>
        )}

        <div className="sesion-fila">
          <div className="sesion-campo">
            <label htmlFor="reg-tipo">Tipo de documento</label>
            <select id="reg-tipo" value={form.document_type_id} onChange={e => upd('document_type_id', e.target.value)}>
              {TIPOS_DOCUMENTO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="sesion-campo">
            <label htmlFor="reg-num">Número de documento</label>
            <input id="reg-num" inputMode="numeric" value={form.document_number} onChange={e => upd('document_number', e.target.value)} />
          </div>
        </div>

        {error && <p className="sesion-error" role="alert">{error}</p>}

        <button type="submit" className="sesion-btn" disabled={!valido || enviando}>
          {enviando ? 'Registrando…' : 'Completar registro'}
        </button>
      </form>
    </div>
  )
}

export default CompletarRegistro
