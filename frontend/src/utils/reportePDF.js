/**
 * reportePDF.js
 * Genera reportes HTML con branding de Casa Scarlatta y los abre
 * en una nueva ventana lista para imprimir / guardar como PDF.
 */
import { hoyLocal } from './fecha'

const ICONO_TIPO = {
  financiero: '💰',
  cortes:     '🏧',
  usuarios:   '👥',
  clases:     '🏃',
  paquetes:   '📦',
  pdv:        '🛒',
  coaches:    '👩‍🏫',
  coaches_pagos: '💸',
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function hoy() {
  return fmtFecha(hoyLocal())
}

function esMonto(v) {
  if (typeof v === 'number') return true
  if (typeof v !== 'string') return false
  return /^\$?\d[\d,. ]*$/.test(String(v).trim())
}

function parseMonto(v) {
  if (typeof v === 'number') return v
  const limpio = String(v).replace(/[$,\s]/g, '')
  return isNaN(Number(limpio)) ? 0 : Number(limpio)
}

export function calcularStats(tipo, datos) {
  if (!datos?.length) return []

  if (tipo === 'financiero') {
    const ingresos = datos.filter(r => parseMonto(r.Monto ?? 0) > 0).reduce((a, r) => a + parseMonto(r.Monto), 0)
    const gastos   = datos.filter(r => parseMonto(r.Monto ?? 0) < 0).reduce((a, r) => a + Math.abs(parseMonto(r.Monto)), 0)
    const utilidad = ingresos - gastos
    return [
      { valor: datos.length.toLocaleString('es-MX'),     etiqueta: 'Total de registros' },
      { valor: '$' + ingresos.toLocaleString('es-MX'),   etiqueta: 'Ingresos' },
      { valor: '$' + gastos.toLocaleString('es-MX'),     etiqueta: 'Gastos' },
      { valor: '$' + utilidad.toLocaleString('es-MX'),   etiqueta: 'Utilidad' },
    ]
  }

  if (tipo === 'cortes') {
    const ingresos = datos.reduce((a, r) => a + parseMonto(r['Total ingresos'] ?? 0), 0)
    const gastos   = datos.reduce((a, r) => a + Math.abs(parseMonto(r['Gastos'] ?? 0)), 0)
    const neto     = datos.reduce((a, r) => a + parseMonto(r['Neto'] ?? 0), 0)
    return [
      { valor: datos.length.toLocaleString('es-MX'),   etiqueta: 'Cortes realizados' },
      { valor: '$' + ingresos.toLocaleString('es-MX'), etiqueta: 'Total ingresos' },
      { valor: '$' + gastos.toLocaleString('es-MX'),   etiqueta: 'Total gastos' },
      { valor: '$' + neto.toLocaleString('es-MX'),     etiqueta: 'Neto a entregar' },
    ]
  }

  if (['paquetes', 'pdv'].includes(tipo)) {
    const total = datos.reduce((a, r) => a + parseMonto(r.Monto ?? 0), 0)
    const prom  = Math.round(total / datos.length)
    return [
      { valor: datos.length.toLocaleString('es-MX'),  etiqueta: 'Total de registros' },
      { valor: '$' + total.toLocaleString('es-MX'),   etiqueta: 'Monto total' },
      { valor: '$' + prom.toLocaleString('es-MX'),    etiqueta: 'Promedio por venta' },
    ]
  }

  if (tipo === 'usuarios') {
    const activos   = datos.filter(u => u.Activo === 'Sí').length
    const inactivos = datos.filter(u => u.Activo === 'No').length
    const conPaq    = datos.filter(u => u.Paquete && u.Paquete !== '—').length
    const tasa      = datos.length ? Math.round((conPaq / datos.length) * 100) : 0
    return [
      { valor: datos.length.toLocaleString('es-MX'), etiqueta: 'Total de clientes' },
      { valor: activos.toLocaleString('es-MX'),       etiqueta: 'Clientes activos' },
      { valor: inactivos.toLocaleString('es-MX'),     etiqueta: 'Clientes inactivos' },
      { valor: tasa + '%',                            etiqueta: 'Tasa de renovación' },
    ]
  }

  if (tipo === 'clases') {
    const total  = datos.length
    const ocup   = datos.reduce((a, c) => a + (Number(c['Ocupación %']) || 0), 0)
    const avg    = total ? Math.round(ocup / total) : 0
    const llenas = datos.filter(c => Number(c['Ocupación %']) === 100).length
    return [
      { valor: total.toLocaleString('es-MX'),  etiqueta: 'Total de clases' },
      { valor: avg + '%',                       etiqueta: 'Ocupación promedio' },
      { valor: llenas.toLocaleString('es-MX'), etiqueta: 'Clases llenas' },
    ]
  }

  if (tipo === 'coaches') {
    const coaches     = new Set(datos.map(c => c.Coach)).size
    const totalClases = datos.length
    const totalPago   = datos.reduce((a, c) => a + parseMonto(c['Pago clase'] ?? 0), 0)
    return [
      { valor: coaches.toLocaleString('es-MX'),          etiqueta: 'Coaches activos' },
      { valor: totalClases.toLocaleString('es-MX'),      etiqueta: 'Clases impartidas' },
      { valor: '$' + totalPago.toLocaleString('es-MX'),  etiqueta: 'Pago total estimado' },
    ]
  }

  if (tipo === 'coaches_pagos') {
    const coaches     = new Set(datos.map(c => c.Coach)).size
    const totalClases = datos.length
    const totalPago   = datos.reduce((a, c) => a + parseMonto(c.Pago ?? 0), 0)
    const sinTarifa   = datos.filter(c => String(c.Estatus ?? '').includes('missing_rate')).length
    return [
      { valor: coaches.toLocaleString('es-MX'),          etiqueta: 'Coaches' },
      { valor: totalClases.toLocaleString('es-MX'),      etiqueta: 'Clases pagadas' },
      { valor: '$' + totalPago.toLocaleString('es-MX'),  etiqueta: 'Pago total' },
      { valor: sinTarifa.toLocaleString('es-MX'),        etiqueta: 'Sin tarifa' },
    ]
  }

  return [{ valor: datos.length.toLocaleString('es-MX'), etiqueta: 'Total de registros' }]
}

function construirFilasTabla(datos, tipo) {
  if (!datos?.length) {
    return '<tr><td colspan="99" style="text-align:center;padding:24px;color:#9C7A74;">Sin datos</td></tr>'
  }
  const cols     = Object.keys(datos[0])
  const colMonto = cols.find(c => /^monto$/i.test(c))
  const hayTotal = !!colMonto

  const filas = datos.map(r => {
    const monto     = colMonto ? parseMonto(r[colMonto] ?? 0) : 0
    const esGasto   = monto < 0
    const celdas = cols.map((c, ci) => {
      const v    = r[c] != null ? r[c] : '—'
      const bold = ci === 1 ? 'color:#2C1810;font-weight:500;' : ''
      let mono   = ''
      if (c === colMonto) {
        mono = esGasto
          ? 'font-family:"DM Serif Display",serif;color:#B91C1C;font-weight:600;'
          : 'font-family:"DM Serif Display",serif;color:#7B1E22;font-weight:600;'
      }
      return '<td style="' + bold + mono + '">' + v + '</td>'
    }).join('')
    return '<tr>' + celdas + '</tr>'
  }).join('')

  if (!hayTotal) return filas

  const blanks = '<td></td>'.repeat(cols.length - 2)

  if (tipo === 'financiero') {
    const ingresos = datos.filter(r => parseMonto(r[colMonto] ?? 0) > 0).reduce((a, r) => a + parseMonto(r[colMonto]), 0)
    const gastos   = datos.filter(r => parseMonto(r[colMonto] ?? 0) < 0).reduce((a, r) => a + Math.abs(parseMonto(r[colMonto])), 0)
    const utilidad = ingresos - gastos
    return filas
      + '<tr class="total-row"><td>INGRESOS</td>' + blanks + '<td>$' + ingresos.toLocaleString('es-MX') + '</td></tr>'
      + '<tr class="total-row gastos-row"><td>GASTOS</td>' + blanks + '<td style="color:#B91C1C;">−$' + gastos.toLocaleString('es-MX') + '</td></tr>'
      + '<tr class="total-row utilidad-row"><td>UTILIDAD</td>' + blanks + '<td>$' + utilidad.toLocaleString('es-MX') + '</td></tr>'
  }

  const total = datos.reduce((a, r) => a + parseMonto(r[colMonto] ?? 0), 0)
  return filas + '<tr class="total-row"><td>TOTAL</td>' + blanks + '<td>$' + total.toLocaleString('es-MX') + '</td></tr>'
}

const CSS_BLOCK = `  <style>
    :root {
      --wine:   #7B1E22;
      --rose:   #E8A4AD;
      --cream:  #F5EDE8;
      --dark:   #2C1810;
      --muted:  #7A5C58;
      --border: #E8D5CB;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'DM Sans', sans-serif; color: var(--dark);
      background: #F0E9E4; min-height: 100vh; padding: 40px 20px 60px;
    }
    .page {
      background: white; max-width: 960px; margin: 0 auto;
      padding: 52px 56px; border-radius: 4px;
      box-shadow: 0 4px 40px rgba(44,24,16,0.15);
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 22px; border-bottom: 2.5px solid var(--wine); margin-bottom: 28px; }
    .logo-wrap { display: flex; align-items: center; gap: 14px; }
    .logo-icon { width: 52px; height: 52px; background: var(--wine); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-icon svg { width: 28px; height: 28px; }
    .logo-text { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 32px; color: var(--wine); line-height: 1; letter-spacing: -0.01em; }
    .logo-sub { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 5px; }
    .contact-info { text-align: right; font-size: 12px; color: var(--muted); line-height: 2; }
    .contact-info strong { display: block; color: var(--dark); font-size: 13px; font-weight: 600; margin-bottom: 2px; }
    .report-meta { display: flex; align-items: center; gap: 20px; background: var(--cream); border-left: 4px solid var(--wine); padding: 16px 22px; border-radius: 0 10px 10px 0; margin-bottom: 28px; }
    .report-meta-icon { font-size: 32px; line-height: 1; flex-shrink: 0; }
    .report-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--wine); margin-bottom: 4px; }
    .report-date { font-size: 12px; color: var(--muted); }
    .report-date strong { color: var(--dark); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: var(--cream); border: 1px solid var(--border); border-radius: 10px; padding: 18px 16px; text-align: center; }
    .stat-value { font-family: 'DM Serif Display', serif; font-size: 28px; color: var(--wine); line-height: 1; margin-bottom: 8px; }
    .stat-label { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.09em; }
    .table-wrap { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: var(--wine); }
    th { font-family: 'DM Sans', sans-serif; font-weight: 600; padding: 9px 8px; text-align: center; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; white-space: nowrap; }
    td { padding: 8px 8px; border-bottom: 1px solid var(--border); color: var(--dark); vertical-align: middle; text-align: center; }
    tr:nth-child(even) td { background: #FDFAF8; }
    tr:last-child td { border-bottom: none; }
    .total-row td { background: var(--cream) !important; font-weight: 700; color: var(--wine) !important; border-top: 1px solid var(--border); border-bottom: none; font-family: 'DM Serif Display', serif; font-size: 13.5px; }
    .total-row:first-of-type td { border-top: 2px solid var(--wine); }
    .gastos-row td { color: #B91C1C !important; }
    .utilidad-row td { border-top: 1px solid var(--wine); }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
    .footer strong { color: var(--wine); }
    .print-controls { text-align: center; margin-top: 32px; }
    .btn-print { background: var(--wine); color: white; border: none; padding: 13px 30px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 12px rgba(123,30,34,0.35); margin-right: 12px; }
    .btn-print:hover { background: #5C1519; }
    .btn-close { background: white; color: var(--muted); border: 1px solid var(--border); padding: 13px 30px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; padding: 0; max-width: 100%; }
      .print-controls { display: none; }
      @page { margin: 12mm 10mm; size: A4 var(--page-orientation, portrait); }
    }
  </style>
`

const CSS_LANDSCAPE = `  <style>
    :root { --page-orientation: landscape; }
    :root {
      --wine:   #7B1E22;
      --rose:   #E8A4AD;
      --cream:  #F5EDE8;
      --dark:   #2C1810;
      --muted:  #7A5C58;
      --border: #E8D5CB;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'DM Sans', sans-serif; color: var(--dark); background: #F0E9E4; min-height: 100vh; padding: 30px 20px 50px; }
    .page { background: white; max-width: 1200px; margin: 0 auto; padding: 40px 48px; border-radius: 4px; box-shadow: 0 4px 40px rgba(44,24,16,0.15); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2.5px solid var(--wine); margin-bottom: 24px; }
    .logo-wrap { display: flex; align-items: center; gap: 14px; }
    .logo-icon { width: 44px; height: 44px; background: var(--wine); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-icon svg { width: 24px; height: 24px; }
    .logo-text { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 28px; color: var(--wine); line-height: 1; }
    .logo-sub { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 4px; }
    .contact-info { text-align: right; font-size: 11px; color: var(--muted); line-height: 1.9; }
    .contact-info strong { display: block; color: var(--dark); font-size: 12px; font-weight: 600; margin-bottom: 2px; }
    .report-meta { display: flex; align-items: center; gap: 16px; background: var(--cream); border-left: 4px solid var(--wine); padding: 14px 20px; border-radius: 0 10px 10px 0; margin-bottom: 24px; }
    .report-meta-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
    .report-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--wine); margin-bottom: 3px; }
    .report-date { font-size: 11px; color: var(--muted); }
    .report-date strong { color: var(--dark); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--cream); border: 1px solid var(--border); border-radius: 10px; padding: 16px 14px; text-align: center; }
    .stat-value { font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--wine); line-height: 1; margin-bottom: 6px; }
    .stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.09em; }
    .table-wrap { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead tr { background: var(--wine); }
    th { font-family: 'DM Sans', sans-serif; font-weight: 600; padding: 8px 7px; text-align: center; font-size: 8.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; white-space: nowrap; }
    td { padding: 7px 7px; border-bottom: 1px solid var(--border); color: var(--dark); vertical-align: middle; text-align: center; }
    tr:nth-child(even) td { background: #FDFAF8; }
    tr:last-child td { border-bottom: none; }
    .total-row td { background: var(--cream) !important; font-weight: 700; color: var(--wine) !important; border-top: 1px solid var(--border); border-bottom: none; font-family: 'DM Serif Display', serif; font-size: 13px; }
    .total-row:first-of-type td { border-top: 2px solid var(--wine); }
    .gastos-row td { color: #B91C1C !important; }
    .utilidad-row td { border-top: 1px solid var(--wine); }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
    .footer strong { color: var(--wine); }
    .print-controls { text-align: center; margin-top: 28px; }
    .btn-print { background: var(--wine); color: white; border: none; padding: 13px 30px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 12px rgba(123,30,34,0.35); margin-right: 12px; }
    .btn-print:hover { background: #5C1519; }
    .btn-close { background: white; color: var(--muted); border: 1px solid var(--border); padding: 13px 30px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; padding: 0; max-width: 100%; }
      .print-controls { display: none; }
      @page { margin: 10mm 8mm; size: A4 landscape; }
    }
  </style>
`

const HEADER_BLOCK = `    <div class="header">
      <div class="logo-wrap">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 4C9 4 5 8 5 13c0 3.8 2.2 7 5.5 8.6L11.5 25h5l1-3.4C20.8 20 23 16.8 23 13c0-5-4-9-9-9z" fill="white" opacity="0.9"/>
            <circle cx="14" cy="12" r="3.5" fill="#7B1E22"/>
          </svg>
        </div>
        <div>
          <div class="logo-text">Casa Scarlatta</div>
          <div class="logo-sub">Wellness Studio</div>
        </div>
      </div>
      <div class="contact-info">
        <strong>Casa Scarlatta</strong>
        +52 (55) 1234-5678<br>
        contacto@casascarlatta.com<br>
        Ciudad de México, México
      </div>
    </div>
`

function construirHTML({ tipo, titulo, datos, periodo, landscape = false }) {
  const icono    = ICONO_TIPO[tipo] ?? '📋'
  const stats    = calcularStats(tipo, datos)
  const cols     = datos?.length ? Object.keys(datos[0]) : []
  const nReg     = datos?.length ?? 0
  const fechaHoy = hoy()

  const statsHTML = stats.map(s =>
    '<div class="stat-card"><div class="stat-value">' + s.valor + '</div><div class="stat-label">' + s.etiqueta + '</div></div>'
  ).join('')

  const theadHTML  = cols.map(c => '<th>' + c + '</th>').join('')
  const tbodyHTML  = construirFilasTabla(datos, tipo)
  const periodoStr = periodo
    ? '&nbsp;·&nbsp; Período: <strong>' + periodo + '</strong>'
    : ''

  const cssBlock = landscape ? CSS_LANDSCAPE : CSS_BLOCK

  return '<!DOCTYPE html>\n'
    + '<html lang="es">\n<head>\n'
    + '  <meta charset="UTF-8">\n'
    + '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '  <title>Casa Scarlatta — ' + titulo + '</title>\n'
    + '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
    + '  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400;1,600&family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n'
    + cssBlock
    + '</head>\n<body>\n'
    + '  <div class="page">\n'
    + HEADER_BLOCK
    + '    <div class="report-meta">\n'
    + '      <div class="report-meta-icon">' + icono + '</div>\n'
    + '      <div>\n'
    + '        <div class="report-title">' + titulo + '</div>\n'
    + '        <div class="report-date">Generado el ' + fechaHoy + periodoStr
    + ' &nbsp;·&nbsp; ' + nReg + ' registro' + (nReg !== 1 ? 's' : '') + '</div>\n'
    + '      </div>\n    </div>\n'
    + '    <div class="stats-grid">' + statsHTML + '</div>\n'
    + '    <div class="table-wrap"><table>\n'
    + '      <thead><tr>' + theadHTML + '</tr></thead>\n'
    + '      <tbody>' + tbodyHTML + '</tbody>\n'
    + '    </table></div>\n'
    + '    <div class="footer">\n'
    + '      <span><strong>Casa Scarlatta</strong> Wellness Studio</span>\n'
    + '      <span>Documento generado automáticamente · ' + fechaHoy + '</span>\n'
    + '    </div>\n  </div>\n'
    + '  <div class="print-controls">\n'
    + '    <button class="btn-print" onclick="window.print()">🖨&nbsp; Guardar como PDF</button>\n'
    + '    <button class="btn-close" onclick="window.close()">Cerrar</button>\n'
    + '  </div>\n</body>\n</html>'
}

/**
 * Abre el reporte en una nueva pestaña lista para imprimir / guardar como PDF.
 */
export function abrirReportePDF({ tipo, titulo, datos, periodo = '', landscape = false }) {
  const html = construirHTML({ tipo, titulo, datos, periodo, landscape })
  const win  = window.open('', '_blank')
  if (!win) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
    return
  }
  win.document.write(html)
  win.document.close()
}

/**
 * Descarga el reporte como archivo .html independiente.
 */
export function descargarHTMLReporte({ tipo, titulo, datos, periodo = '' }) {
  const html  = construirHTML({ tipo, titulo, datos, periodo })
  const blob  = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  const fecha = hoyLocal()
  a.href     = url
  a.download = 'reporte-' + tipo + '-' + fecha + '.html'
  a.click()
  URL.revokeObjectURL(url)
}
