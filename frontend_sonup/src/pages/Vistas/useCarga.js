import { useCallback, useEffect, useState } from 'react'

/**
 * Carga un recurso y expone { datos, cargando, error }. Un 403 se muestra con el mensaje del
 * backend (`error.message`) en lugar de dejar la vista en blanco.
 */
export default function useCarga(fn, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(fn, deps)

  useEffect(() => {
    let vivo = true
    setEstado({ datos: null, cargando: true, error: '' })
    Promise.resolve()
      .then(cargar)
      .then(datos => { if (vivo) setEstado({ datos, cargando: false, error: '' }) })
      .catch(err => { if (vivo) setEstado({ datos: null, cargando: false, error: err?.message || 'No se pudo cargar la información.' }) })
    return () => { vivo = false }
  }, [cargar])

  return estado
}
