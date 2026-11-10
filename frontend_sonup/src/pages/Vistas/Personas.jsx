import { useEffect, useState } from 'react'
import { getGuardians, getGuardianChildren } from '../../services/guardians.js'
import { getStaff } from '../../services/staff.js'
import { nombreDe } from '../../utils/workshops.js'
import useCarga from './useCarga.js'
import './Vistas.css'

/** Administrador · listado de acudientes (con sus jóvenes) o del personal. Solo consulta. */
const Personas = ({ tipo = 'acudientes' }) => {
  const esAcudientes = tipo === 'acudientes'
  const [texto, setTexto]   = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [hijos, setHijos]   = useState({})

  useEffect(() => { const t = setTimeout(() => setBusqueda(texto.trim()), 350); return () => clearTimeout(t) }, [texto])

  const { datos, cargando, error } = useCarga(
    () => (esAcudientes ? getGuardians({ search: busqueda }) : getStaff({ search: busqueda })),
    [esAcudientes, busqueda],
  )

  const verHijos = async (g) => {
    const id = String(g.id)
    if (abierto === id) { setAbierto(null); return }
    setAbierto(id)
    if (!hijos[id]) {
      try { const lista = await getGuardianChildren(g.id); setHijos(h => ({ ...h, [id]: { lista } })) }
      catch (err) { setHijos(h => ({ ...h, [id]: { error: err.message } })) }
    }
  }

  return (
    <div className="vista-page">
      <header>
        <p className="vista-eyebrow">ADMINISTRACIÓN</p>
        <h1 className="vista-titulo">{esAcudientes ? 'Acudientes' : 'Personal'}</h1>
        <p className="vista-sub">{esAcudientes ? 'Acudientes registrados y los jóvenes a su cargo.' : 'Personal de la fundación.'}</p>
      </header>

      <input
        className="vista-buscar" type="search" placeholder="Buscar por nombre o documento…"
        value={texto} onChange={e => setTexto(e.target.value)} aria-label="Buscar"
      />

      {cargando && <p className="vista-estado">Cargando…</p>}
      {error && <p className="vista-estado vista-estado--error" role="alert">{error}</p>}
      {datos && datos.length === 0 && <p className="vista-estado">No hay resultados.</p>}

      {datos && datos.length > 0 && (
        <div className="vista-tabla-wrap">
          <table className="vista-tabla">
            <thead>
              <tr>
                <th scope="col">Nombre</th><th scope="col">Documento</th><th scope="col">Correo</th>
                <th scope="col">{esAcudientes ? 'Jóvenes' : 'Rol / estado'}</th>
              </tr>
            </thead>
            <tbody>
              {datos.map(p => {
                const id = String(p.id)
                return (
                  <tr key={id}>
                    <td>{nombreDe(p, `#${id}`)}</td>
                    <td>{p.documentNumber ?? '—'}</td>
                    <td>{p.email ?? '—'}</td>
                    <td>
                      {esAcudientes ? (
                        <>
                          <button type="button" className="vista-link" onClick={() => verHijos(p)} aria-expanded={abierto === id}>
                            {abierto === id ? 'Ocultar' : 'Ver jóvenes'}
                          </button>
                          {abierto === id && (
                            hijos[id]?.error ? <small role="alert"> {hijos[id].error}</small>
                              : !hijos[id] ? <small> Cargando…</small>
                              : hijos[id].lista.length === 0 ? <small> Sin jóvenes vigentes.</small>
                              : <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>{hijos[id].lista.map(c => <li key={String(c.id ?? c.childId)}>{nombreDe(c, `Joven ${c.id ?? c.childId}`)}</li>)}</ul>
                          )}
                        </>
                      ) : [p.roleName, p.statusName].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Personas
