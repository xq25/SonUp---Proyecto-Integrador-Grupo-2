import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABEL } from '../../utils/evidenceType.js'
import './EvidenceTypeField.css'

/**
 * Selector del atributo `type` de una evidencia. Solo ofrece los dos valores que acepta la API
 * (VIDEO | IMAGE). Es obligatorio: no hay opción «vacía» ni valor por defecto oculto; si `value`
 * es '' se muestra el aviso para que la persona elija.
 */
const ORDEN = ['IMAGE', 'VIDEO'].filter(t => EVIDENCE_TYPES.includes(t))

const EvidenceTypeField = ({ value, onChange, sugerido = null, idBase = 'evidence-type', error = '' }) => (
  <fieldset className="etf" aria-describedby={error ? `${idBase}-error` : undefined}>
    <legend className="etf__legend">Tipo de evidencia <span aria-hidden="true">*</span></legend>
    <div className="etf__opciones" role="radiogroup">
      {ORDEN.map(tipo => (
        <label key={tipo} className={`etf__opcion${value === tipo ? ' etf__opcion--sel' : ''}`}>
          <input
            type="radio"
            name={idBase}
            value={tipo}
            checked={value === tipo}
            onChange={() => onChange(tipo)}
          />
          <span>{EVIDENCE_TYPE_LABEL[tipo]}</span>
          <small>{tipo}</small>
        </label>
      ))}
    </div>
    {sugerido && value !== sugerido && (
      <p className="etf__hint">
        Por la dirección parece {EVIDENCE_TYPE_LABEL[sugerido].toLowerCase()}.{' '}
        <button type="button" className="etf__link" onClick={() => onChange(sugerido)}>Usar «{EVIDENCE_TYPE_LABEL[sugerido]}»</button>
      </p>
    )}
    {error && <p id={`${idBase}-error`} className="etf__error" role="alert">{error}</p>}
  </fieldset>
)

export default EvidenceTypeField
