export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderSection = ({ title, rows = [], paragraphs = [], items = [] }) => {
  const rowsHtml = rows.map(([label, value]) =>
    `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
  ).join('')
  const paragraphsHtml = paragraphs.map(value =>
    `<p>${escapeHtml(value)}</p>`
  ).join('')
  const itemsHtml = items.length
    ? `<ul>${items.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`
    : ''

  return `<section><h2>${escapeHtml(title)}</h2>${rowsHtml}${paragraphsHtml}${itemsHtml}</section>`
}

export const createShareDocument = ({ title, subtitle = '', sections = [] }) => {
  const safeTitle = escapeHtml(title)
  const generatedAt = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
  }).format(new Date())
  const documentHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font: 16px/1.6 Arial, sans-serif; color: #173632; max-width: 760px; margin: 32px auto; padding: 0 20px; }
    header { border-bottom: 3px solid #176D65; margin-bottom: 28px; padding-bottom: 18px; }
    .brand { color: #176D65; font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { font-size: 26px; line-height: 1.2; margin: 8px 0; }
    .subtitle, footer { color: #687974; }
    section { border: 1px solid #DFE5E2; border-radius: 10px; margin: 16px 0; padding: 16px 20px; break-inside: avoid; }
    h2 { color: #176D65; font-size: 16px; margin: 0 0 10px; }
    p { margin: 6px 0; white-space: pre-wrap; }
    ul { margin: 8px 0 0; padding-left: 22px; }
    li { margin: 5px 0; }
    footer { border-top: 1px solid #DFE5E2; font-size: 12px; margin-top: 28px; padding-top: 12px; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Son Up · Fundación Asisco</div>
    <h1>${safeTitle}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
  </header>
  ${sections.map(renderSection).join('')}
  <footer>Generado el ${escapeHtml(generatedAt)} · Son Up</footer>
</body>
</html>`
  const filename = String(title ?? 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'documento-son-up'

  return new File([documentHtml], `${filename}.html`, { type: 'text/html;charset=utf-8' })
}
