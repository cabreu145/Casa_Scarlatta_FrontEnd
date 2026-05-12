/**
 * reportePDF.js
 * Genera reportes PDF con branding de Casa Scarlatta.
 * Abre una ventana nueva con el reporte listo para imprimir/guardar como PDF.
 * También permite descargar el HTML como archivo independiente.
 */

const EMPRESA = {
  nombre:    'Casa Scarlatta',
  eslogan:   'Wellness Studio',
  telefono:  '+52 (55) 1234-5678',
  email:     'contacto@casascarlatta.com',
  direccion: 'Ciudad de México, México',
}

function formatFecha() {
  return new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatMonto(val) {
  const n = Number(val)
  return isNaN(n) ? val : `$${n.toLocaleString('es-MX')}`
}

const MONTO_KEYS = ['monto', 'Monto', 'pago', 'Pago', 'Pago clase', 'total', 'Total']

function esMontoColumn(header) {
  return MONTO_KEYS.some(k => header.toLowerCase().includes(k.toLowerCase()))
}

// ── Estadísticas de resumen por tipo de reporte ───────────────────────────────
function calcularStats(tipo, datos) {
  if (!datos?.length) return []

  if (tipo === 'financiero' || tipo === 'paquetes' || tipo === 'pdv') {
    const total   = datos.reduce((a, r) => a + (Number(r.Monto) || 0), 0)
    const promedio = Math.round(total / datos.length)
    return [
      { label: 'Total de registros', value: datos.length },
      { label: 'Monto total',        value: `$${total.toLocaleString('es-MX')}` },
      { label: 'Promedio por ítem',  value: `$${promedio.toLocaleString('es-MX')}` },
    ]
  }

  if (tipo === 'usuarios') {
    const activos = datos.filter(r => r.Activo === 'Sí').length
    return [
      { label: 'Total clientes',  value: datos.length },
      { label: 'Activos',         value: activos },
      { label: 'Inactivos',       value: datos.length - activos },
    ]
  }

  if (tipo === 'clases') {
    const ocupPromedio = datos.length
      ? Math.round(datos.reduce((a, r) => a + (Number(r['Ocupación %']) || 0), 0) / datos.length)
      : 0
    return [
      { label: 'Total clases',      value: datos.length },
      { label: 'Ocupación promedio', value: `${ocupPromedio}%` },
      { label: 'Capacidad total',   value: datos.reduce((a, r) => a + (Number(r.Capacidad) || 0), 0) },
    ]
  }

  if (tipo === 'coaches') {
    const pagoTotal = datos.reduce((a, r) => a + (Number(r['Pago clase']) || 0), 0)
    const coaches = [...new Set(datos.map(r => r.Coach))].length
    return [
      { label: 'Coaches activos',  value: coaches },
      { label: 'Clases impartidas', value: datos.length },
      { label: 'Pago total estimado', value: `$${pagoTotal.toLocaleString('es-MX')}` },
    ]
  }

  return [{ label: 'Total registros', value: datos.length }]
}

// ── Constructor HTML ──────────────────────────────────────────────────────────
function construirHTML({ tipo, titulo, datos, periodo }) {
  const fecha  = formatFecha()
  const stats  = calcularStats(tipo, datos)
  const headers = datos?.length ? Object.keys(datos[0]) : []

  const statsHtml = stats.length ? `
    <div class="stats-grid">
      ${stats.map(s => `
        <div class="stat-card">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>
  ` : ''

  const headersHtml = headers.map(h => `<th>${h}</th>`).join('')

  const rowsHtml = (datos ?? []).map(row => `
    <tr>
      ${headers.map(h => {
        const val = row[h] ?? '—'
        const formatted = esMontoColumn(h) && !isNaN(Number(val)) ? formatMonto(val) : val
        return `<td>${formatted}</td>`
      }).join('')}
    </tr>
  `).join('')

  // Total row for money reports
  let totalRowHtml = ''
  const montoHeader = headers.find(h => esMontoColumn(h))
  if (montoHeader && datos?.length) {
    const total = datos.reduce((a, r) => a + (Number(r[montoHeader]) || 0), 0)
    totalRowHtml = `
      <tr class="total-row">
        ${headers.map((h, i) => `<td>${
          i === 0 ? 'TOTAL' : h === montoHeader ? formatMonto(total) : ''
        }</td>`).join('')}
      </tr>
    `
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${EMPRESA.nombre} — ${titulo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600&family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --wine:   #7B1E22;
      --rose:   #E8A4AD;
      --cream:  #F5EDE8;
      --dark:   #2C1810;
      --muted:  #7A5C58;
      --border: #E8D5CB;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      color: var(--dark);
      background: #fff;
      padding: 44px 52px;
      max-width: 960px;
      margin: 0 auto;
      font-size: 13px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 22px;
      border-bottom: 2.5px solid var(--wine);
      margin-bottom: 28px;
    }

    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: var(--wine);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-icon svg { display: block; }

    .logo-text {
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 30px;
      color: var(--wine);
      line-height: 1;
      letter-spacing: -0.01em;
    }

    .logo-sub {
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-top: 5px;
    }

    .contact-info {
      text-align: right;
      font-size: 12px;
      color: var(--muted);
      line-height: 2;
    }

    .contact-info strong {
      display: block;
      color: var(--dark);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    /* ── Report meta block ── */
    .report-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--cream);
      border-left: 4px solid var(--wine);
      padding: 16px 22px;
      border-radius: 0 10px 10px 0;
      margin-bottom: 28px;
    }

    .report-meta-icon {
      font-size: 32px;
      line-height: 1;
      flex-shrink: 0;
    }

    .report-title {
      font-family: 'DM Serif Display', serif;
      font-size: 21px;
      color: var(--wine);
      margin-bottom: 4px;
    }

    .report-date {
      font-size: 12px;
      color: var(--muted);
    }

    /* ── Stats grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--cream);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px 18px;
      text-align: center;
    }

    .stat-value {
      font-family: 'DM Serif Display', serif;
      font-size: 26px;
      color: var(--wine);
      line-height: 1;
      margin-bottom: 7px;
    }

    .stat-label {
      font-size: 10.5px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.09em;
    }

    /* ── Table ── */
    .table-wrap {
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 28px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }

    thead tr {
      background: var(--wine);
    }

    th {
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      padding: 11px 14px;
      text-align: left;
      font-size: 10.5px;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #fff;
      white-space: nowrap;
    }

    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      color: var(--dark);
      vertical-align: middle;
    }

    tr:nth-child(even) td { background: #FDFAF8; }
    tr:last-child td { border-bottom: none; }

    .total-row td {
      background: var(--cream) !important;
      font-weight: 700;
      color: var(--wine);
      border-top: 2px solid var(--wine);
      border-bottom: none;
    }

    /* ── Empty state ── */
    .empty {
      text-align: center;
      padding: 40px;
      color: var(--muted);
      font-size: 14px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
    }

    .footer strong { color: var(--wine); }

    /* ── Print controls (hidden on print) ── */
    .print-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 999;
    }

    .btn-print {
      background: var(--wine);
      color: white;
      border: none;
      padding: 11px 22px;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(123,30,34,0.3);
      transition: background 0.15s;
    }

    .btn-print:hover { background: #5C1519; }

    .btn-close {
      background: white;
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 11px 22px;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      cursor: pointer;
    }

    @media print {
      .print-controls { display: none !important; }
      body { padding: 0; max-width: 100%; }
      .table-wrap { border: 1px solid #ccc; }
      @page { margin: 15mm 12mm; size: A4 portrait; }
    }
  </style>
</head>
<body>

  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨&nbsp; Guardar como PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
  </div>

  <!-- ── Header ── -->
  <div class="header">
    <div class="logo-wrap">
      <div class="logo-icon">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 3C8 3 4 7 4 12c0 3.5 2 6.5 5 8l1 3h6l1-3c3-1.5 5-4.5 5-8 0-5-4-9-9-9z" fill="white" opacity="0.9"/>
          <circle cx="13" cy="11" r="3" fill="#7B1E22"/>
        </svg>
      </div>
      <div>
        <div class="logo-text">Casa Scarlatta</div>
        <div class="logo-sub">Wellness Studio</div>
      </div>
    </div>
    <div class="contact-info">
      <strong>${EMPRESA.nombre}</strong>
      ${EMPRESA.telefono}<br>
      ${EMPRESA.email}<br>
      ${EMPRESA.direccion}
    </div>
  </div>

  <!-- ── Report meta ── -->
  <div class="report-meta">
    <div class="report-meta-icon">${iconoPorTipo(tipo)}</div>
    <div>
      <div class="report-title">${titulo}</div>
      <div class="report-date">
        Generado el ${fecha}
        ${periodo ? `&nbsp;·&nbsp; Período: <strong>${periodo}</strong>` : ''}
        &nbsp;·&nbsp; ${datos?.length ?? 0} registros
      </div>
    </div>
  </div>

  <!-- ── Summary stats ── -->
  ${statsHtml}

  <!-- ── Data table ── -->
  ${datos?.length ? `
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${headersHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
        ${totalRowHtml}
      </tbody>
    </table>
  </div>
  ` : '<div class="empty">Sin datos para el período seleccionado.</div>'}

  <!-- ── Footer ── -->
  <div class="footer">
    <span><strong>Casa Scarlatta</strong> Wellness Studio</span>
    <span>Documento generado automáticamente · ${fecha}</span>
  </div>

</body>
</html>`
}

function iconoPorTipo(tipo) {
  const map = {
    financiero: '💰',
    usuarios:   '👥',
    clases:     '🏃',
    paquetes:   '📦',
    pdv:        '🛒',
    coaches:    '🏅',
  }
  return map[tipo] ?? '📋'
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Abre el reporte en una ventana nueva lista para imprimir / guardar como PDF.
 * @param {object} opts
 * @param {string} opts.tipo       - 'financiero' | 'usuarios' | 'clases' | 'paquetes' | 'pdv' | 'coaches'
 * @param {string} opts.titulo     - Título que aparece en el reporte
 * @param {object[]} opts.datos    - Array de objetos con las filas
 * @param {string} [opts.periodo]  - Texto del período (ej. "Mayo 2026")
 */
export function abrirReportePDF({ tipo, titulo, datos, periodo = '' }) {
  const html = construirHTML({ tipo, titulo, datos, periodo })
  const ventana = window.open('', '_blank')
  if (!ventana) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
    return
  }
  ventana.document.write(html)
  ventana.document.close()
}

/**
 * Descarga el reporte como archivo .html (para compartir con un colega).
 * @param {object} opts — mismos parámetros que abrirReportePDF
 * @param {string} [opts.nombreArchivo] — nombre del archivo sin extensión
 */
export function descargarHTMLReporte({ tipo, titulo, datos, periodo = '', nombreArchivo }) {
  const html = construirHTML({ tipo, titulo, datos, periodo })
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${nombreArchivo ?? `reporte_${tipo}_${new Date().toISOString().split('T')[0]}`}.html`
  a.click()
  URL.revokeObjectURL(url)
}
