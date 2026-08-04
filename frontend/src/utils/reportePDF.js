/**
 * reportePDF.js
 * Genera reportes HTML con branding de Casa Scarlatta y los abre
 * en una nueva ventana lista para imprimir / guardar como PDF.
 */
import { hoyLocal } from './fecha'

const ICONO_TIPO = {
  financiero:    '💰',
  cortes:        '🏧',
  usuarios:      '👥',
  clases:        '🏃',
  paquetes:      '📦',
  pdv:           '🛒',
  coaches:       '👩‍🏫',
  coaches_pagos: '💸',
  gastos:        '🧾',
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

function normalizeComparableText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function findRowByConcept(datos, concepts = []) {
  const normalizedConcepts = concepts.map((concept) => normalizeComparableText(concept))
  return datos.find((row = {}) => {
    const concept = normalizeComparableText(row.Concepto ?? row.Indicador ?? row.etiqueta ?? row.label ?? '')
    return normalizedConcepts.some((needle) => concept === needle || concept.includes(needle))
  })
}

function readRowMonto(row) {
  if (!row) return null
  const value = row.Monto ?? row.Valor ?? row.Total ?? row.total ?? row.monto ?? null
  const parsed = parseMonto(value)
  return Number.isFinite(parsed) ? parsed : null
}

function readFinancialMetric(datos, concepts, fallback = 0, { absolute = false } = {}) {
  const row = findRowByConcept(datos, concepts)
  if (row) {
    const value = readRowMonto(row)
    if (value != null) return absolute ? Math.abs(value) : value
  }
  return fallback
}

export function calcularStats(tipo, datos) {
  if (!datos?.length) return []

  if (tipo === 'financiero') {
    const ingresos = readFinancialMetric(datos, ['Ingresos totales', 'Ingresos'], 0)
    const gastos   = readFinancialMetric(datos, ['Gastos totales', 'Gastos'], 0, { absolute: true })
    const utilidad  = readFinancialMetric(datos, ['Utilidad neta', 'Utilidad'], ingresos - gastos)
    return [
      { valor: datos.length.toLocaleString('es-MX'),     etiqueta: 'Conceptos del reporte' },
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

  if (tipo === 'paquetes') {
    const txRows    = datos.filter(esFilaTransaccion)
    const total     = txRows.reduce((a, r) => a + parseMonto(r.Monto ?? 0), 0)
    const prom      = txRows.length ? Math.round(total / txRows.length) : 0
    const topPkgRow = datos.find(r => !esFilaTransaccion(r) && String(r.Cliente ?? '').includes('más vendido'))
    const topPkg    = topPkgRow ? String(topPkgRow.Monto ?? '—') : '—'
    return [
      { valor: txRows.length.toLocaleString('es-MX'), etiqueta: 'Total de registros' },
      { valor: '$' + total.toLocaleString('es-MX'),   etiqueta: 'Monto total' },
      { valor: '$' + prom.toLocaleString('es-MX'),    etiqueta: 'Promedio por venta' },
      { valor: topPkg,                                 etiqueta: 'Paquete más vendido' },
    ]
  }

  if (tipo === 'pdv') {
    const txRows = datos.filter(esFilaTransaccion)
    const total  = txRows.reduce((a, r) => a + parseMonto(r.Monto ?? 0), 0)
    const prom   = txRows.length ? Math.round(total / txRows.length) : 0
    return [
      { valor: txRows.length.toLocaleString('es-MX'), etiqueta: 'Total de registros' },
      { valor: '$' + total.toLocaleString('es-MX'),   etiqueta: 'Monto total' },
      { valor: '$' + prom.toLocaleString('es-MX'),    etiqueta: 'Promedio por venta' },
    ]
  }

  if (tipo === 'usuarios') {
    const conPaq    = datos.filter(u => u.Paquete && u.Paquete !== '—').length
    const sinPaq    = datos.length - conPaq
    const tasa      = datos.length ? Math.round((conPaq / datos.length) * 100) : 0
    return [
      { valor: datos.length.toLocaleString('es-MX'), etiqueta: 'Total de clientes' },
      { valor: conPaq.toLocaleString('es-MX'),        etiqueta: 'Con paquete' },
      { valor: sinPaq.toLocaleString('es-MX'),        etiqueta: 'Sin paquete' },
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

  if (tipo === 'gastos') {
    const total = datos.reduce((a, r) => a + parseMonto(r.Monto ?? 0), 0)
    const cats  = new Set(datos.map(r => r.Categoría).filter(Boolean)).size
    return [
      { valor: datos.length.toLocaleString('es-MX'),  etiqueta: 'Total de gastos' },
      { valor: '$' + total.toLocaleString('es-MX'),   etiqueta: 'Monto total' },
      { valor: cats.toLocaleString('es-MX'),           etiqueta: 'Categorías' },
    ]
  }

  return [{ valor: datos.length.toLocaleString('es-MX'), etiqueta: 'Total de registros' }]
}

function renderFilaResumen(r, cols, colMonto) {
  const celdas = cols.map((c) => {
    const v = r[c] != null ? String(r[c]) : ''
    if (c === colMonto) {
      return '<td style="font-family:\'DM Serif Display\',serif;color:#7B1E22;font-weight:600;">' + (v || '') + '</td>'
    }
    return '<td>' + (v || '') + '</td>'
  }).join('')
  return '<tr class="total-row">' + celdas + '</tr>'
}

function construirFilasTablaChunk(rows) {
  if (!rows?.length) return ''
  const cols     = Object.keys(rows[0])
  const colMonto = cols.find(c => /^monto$/i.test(c))
  const tieneFecha = cols.some(c => /^fecha$/i.test(c))
  return (tieneFecha ? rows.filter(esFilaTransaccion) : rows).map(r => {
    const monto   = colMonto ? parseMonto(r[colMonto] ?? 0) : 0
    const esGasto = monto < 0
    const celdas  = cols.map((c, ci) => {
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
}

// Filas con Fecha vacía son filas de resumen — no se suman en totales
function esFilaTransaccion(r) {
  const f = r.Fecha ?? r.fecha ?? ''
  return f !== '' && f !== null && f !== undefined
}

function construirTotalesFilas(datos, tipo) {
  if (!datos?.length) return ''
  const cols     = Object.keys(datos[0])
  const colMonto = cols.find(c => /^monto$/i.test(c))
  if (!colMonto) return ''
  const blanks = '<td></td>'.repeat(cols.length - 2)
  const transacciones = datos.filter(esFilaTransaccion)
  if (tipo === 'financiero') {
    const tieneResumen = !!findRowByConcept(datos, ['Ingresos totales', 'Ingresos'])
    let ingresos, gastos, utilidad
    if (tieneResumen) {
      ingresos = readFinancialMetric(datos, ['Ingresos totales', 'Ingresos'], 0)
      gastos   = readFinancialMetric(datos, ['Gastos totales', 'Gastos'], 0, { absolute: true })
      utilidad = readFinancialMetric(datos, ['Utilidad neta', 'Utilidad'], ingresos - gastos)
    } else {
      ingresos = transacciones.filter(r => parseMonto(r[colMonto] ?? 0) > 0).reduce((a, r) => a + parseMonto(r[colMonto]), 0)
      gastos   = transacciones.filter(r => parseMonto(r[colMonto] ?? 0) < 0).reduce((a, r) => a + Math.abs(parseMonto(r[colMonto])), 0)
      utilidad = ingresos - gastos
    }
    return '<tr class="total-row"><td>INGRESOS</td>' + blanks + '<td>$' + ingresos.toLocaleString('es-MX') + '</td></tr>'
      + '<tr class="total-row gastos-row"><td>GASTOS</td>' + blanks + '<td style="color:#B91C1C;">−$' + gastos.toLocaleString('es-MX') + '</td></tr>'
      + '<tr class="total-row utilidad-row"><td>UTILIDAD</td>' + blanks + '<td>$' + utilidad.toLocaleString('es-MX') + '</td></tr>'
  }
  const total = transacciones.reduce((a, r) => a + parseMonto(r[colMonto] ?? 0), 0)
  const totalHTML = '<tr class="total-row"><td>TOTAL</td>' + blanks + '<td>$' + total.toLocaleString('es-MX') + '</td></tr>'
  const resumenRows = datos.filter(r => !esFilaTransaccion(r))
  const resumenHTML = resumenRows.map(r => renderFilaResumen(r, cols, colMonto)).join('')
  return totalHTML + resumenHTML
}

export function construirFilasTabla(datos, tipo) {
  if (!datos?.length) {
    return '<tr><td colspan="99" style="text-align:center;padding:24px;color:#9C7A74;">Sin datos</td></tr>'
  }
  const cols     = Object.keys(datos[0])
  const colMonto = cols.find(c => /^monto$/i.test(c))
  const hayTotal = !!colMonto
  const tieneFecha = cols.some(c => /^fecha$/i.test(c))

  const filas = (tieneFecha ? datos.filter(esFilaTransaccion) : datos).map(r => {
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

  const transacciones = datos.filter(esFilaTransaccion)

  if (tipo === 'financiero') {
    const tieneResumen = !!findRowByConcept(datos, ['Ingresos totales', 'Ingresos'])
    let ingresos
    let gastos
    let utilidad
    if (tieneResumen) {
      ingresos = readFinancialMetric(datos, ['Ingresos totales', 'Ingresos'], 0)
      gastos   = readFinancialMetric(datos, ['Gastos totales', 'Gastos'], 0, { absolute: true })
      utilidad = readFinancialMetric(datos, ['Utilidad neta', 'Utilidad'], ingresos - gastos)
    } else {
      ingresos = transacciones.filter(r => parseMonto(r[colMonto] ?? 0) > 0).reduce((a, r) => a + parseMonto(r[colMonto]), 0)
      gastos   = transacciones.filter(r => parseMonto(r[colMonto] ?? 0) < 0).reduce((a, r) => a + Math.abs(parseMonto(r[colMonto])), 0)
      utilidad = ingresos - gastos
    }
    return filas
      + '<tr class="total-row"><td>INGRESOS</td>' + blanks + '<td>$' + ingresos.toLocaleString('es-MX') + '</td></tr>'
      + '<tr class="total-row gastos-row"><td>GASTOS</td>' + blanks + '<td style="color:#B91C1C;">−$' + gastos.toLocaleString('es-MX') + '</td></tr>'
      + '<tr class="total-row utilidad-row"><td>UTILIDAD</td>' + blanks + '<td>$' + utilidad.toLocaleString('es-MX') + '</td></tr>'
  }

  const total = transacciones.reduce((a, r) => a + parseMonto(r[colMonto] ?? 0), 0)
  return filas + '<tr class="total-row"><td>TOTAL</td>' + blanks + '<td>$' + total.toLocaleString('es-MX') + '</td></tr>'
}

const CSS_VARS = `
    :root {
      --wine:   #7B1E22;
      --rose:   #E8A4AD;
      --cream:  #F5EDE8;
      --dark:   #2C1810;
      --muted:  #7A5C58;
      --border: #E8D5CB;
    }`

const CSS_SHARED = `
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2.5px solid var(--wine); margin-bottom: 24px; }
    .logo-wrap { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 44px; height: 44px; background: var(--wine); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-icon svg { width: 24px; height: 24px; }
    .logo-text { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 28px; color: var(--wine); line-height: 1; letter-spacing: -0.01em; }
    .logo-sub { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 4px; }
    .contact-info { text-align: right; font-size: 11px; color: var(--muted); line-height: 1.8; }
    .contact-info strong { display: block; color: var(--dark); font-size: 12px; font-weight: 600; margin-bottom: 2px; }
    .report-meta { display: flex; align-items: center; gap: 16px; background: var(--cream); border-left: 4px solid var(--wine); padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
    .report-meta-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
    .report-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--wine); margin-bottom: 3px; }
    .report-date { font-size: 11px; color: var(--muted); }
    .report-date strong { color: var(--dark); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
    .stat-card { background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 14px 12px; text-align: center; }
    .stat-value { font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--wine); line-height: 1; margin-bottom: 6px; }
    .stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.09em; }
    .table-wrap { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead { display: table-header-group; }
    thead tr { background: var(--wine); }
    th { font-family: 'DM Sans', sans-serif; font-weight: 600; padding: 8px 6px; text-align: center; font-size: 8.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; white-space: nowrap; }
    tbody tr { page-break-inside: avoid; break-inside: avoid; }
    td { padding: 7px 6px; border-bottom: 1px solid var(--border); color: var(--dark); vertical-align: middle; text-align: center; }
    tr:nth-child(even) td { background: #FDFAF8; }
    tr:last-child td { border-bottom: none; }
    .total-row td { background: var(--cream) !important; font-weight: 700; color: var(--wine) !important; border-top: 1px solid var(--border); border-bottom: none; font-family: 'DM Serif Display', serif; font-size: 12px; }
    .total-row:first-of-type td { border-top: 2px solid var(--wine); }
    .gastos-row td { color: #B91C1C !important; }
    .utilidad-row td { border-top: 1px solid var(--wine); }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); }
    .footer strong { color: var(--wine); }
    .print-controls { text-align: center; margin-top: 28px; }
    .btn-print { background: var(--wine); color: white; border: none; padding: 13px 30px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 12px rgba(123,30,34,0.35); margin-right: 12px; }
    .btn-print:hover { background: #5C1519; }
    .btn-close { background: white; color: var(--muted); border: 1px solid var(--border); padding: 13px 30px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; }
    .mini-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1.5px solid var(--wine); margin-bottom: 16px; }
    @media screen {
      .page-break { margin-bottom: 40px; }
    }
    @media print {
      .page-break { page-break-after: always; break-after: page; }
    }`

const CSS_BLOCK = `  <style>
    ${CSS_VARS}
    body {
      font-family: 'DM Sans', sans-serif; color: var(--dark);
      background: #F0E9E4; min-height: 100vh; padding: 40px 20px 60px;
    }
    .page {
      background: white; max-width: 816px; margin: 0 auto;
      padding: 44px 52px; border-radius: 4px;
      box-shadow: 0 4px 40px rgba(44,24,16,0.15);
    }
    ${CSS_SHARED}
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 0; max-width: 100%; }
      .print-controls { display: none; }
      .stats-grid { page-break-inside: avoid; break-inside: avoid; }
      .report-meta { page-break-inside: avoid; break-inside: avoid; }
      .header { page-break-inside: avoid; break-inside: avoid; }
      .footer { page-break-inside: avoid; break-inside: avoid; }
      @page { size: letter portrait; margin: 15mm 12mm; }
    }
  </style>
`

const CSS_LANDSCAPE = `  <style>
    ${CSS_VARS}
    body { font-family: 'DM Sans', sans-serif; color: var(--dark); background: #F0E9E4; min-height: 100vh; padding: 30px 20px 50px; }
    .page { background: white; max-width: 1056px; margin: 0 auto; padding: 36px 44px; border-radius: 4px; box-shadow: 0 4px 40px rgba(44,24,16,0.15); }
    ${CSS_SHARED}
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 0; max-width: 100%; }
      .print-controls { display: none; }
      .stats-grid { page-break-inside: avoid; break-inside: avoid; }
      .report-meta { page-break-inside: avoid; break-inside: avoid; }
      .header { page-break-inside: avoid; break-inside: avoid; }
      .footer { page-break-inside: avoid; break-inside: avoid; }
      @page { size: letter landscape; margin: 12mm 10mm; }
    }
  </style>
`

function buildHeaderBlock(siteInfo = {}) {
  const nombre    = siteInfo.nombre    || siteInfo.nombreEstudio || 'Casa Scarlatta'
  const telefono  = siteInfo.telefono  || ''
  const email     = siteInfo.email     || ''
  const direccion = siteInfo.direccion || ''
  const ciudad    = siteInfo.ciudad    || ''

  const contactLines = [telefono, email, [direccion, ciudad].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join('<br>')

  return `    <div class="header">
      <div class="logo-wrap">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 4C9 4 5 8 5 13c0 3.8 2.2 7 5.5 8.6L11.5 25h5l1-3.4C20.8 20 23 16.8 23 13c0-5-4-9-9-9z" fill="white" opacity="0.9"/>
            <circle cx="14" cy="12" r="3.5" fill="#7B1E22"/>
          </svg>
        </div>
        <div>
          <div class="logo-text">${nombre}</div>
          <div class="logo-sub">Wellness Studio</div>
        </div>
      </div>
      <div class="contact-info">
        <strong>${nombre}</strong>
        ${contactLines}
      </div>
    </div>
`
}

// Filas que caben por página (estimadas, dependen de landscape)
// Declaradas dentro de construirHTML donde landscape está disponible.

function buildMiniHeader(siteInfo, nombre) {
  return `    <div class="mini-header">
      <div class="logo-wrap" style="gap:8px">
        <div class="logo-icon" style="width:28px;height:28px">
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 4C9 4 5 8 5 13c0 3.8 2.2 7 5.5 8.6L11.5 25h5l1-3.4C20.8 20 23 16.8 23 13c0-5-4-9-9-9z" fill="white" opacity="0.9"/>
            <circle cx="14" cy="12" r="3.5" fill="#7B1E22"/>
          </svg>
        </div>
        <span class="logo-text" style="font-size:18px">${nombre}</span>
      </div>
      <span style="font-size:10px;color:var(--muted)">Continúa...</span>
    </div>\n`
}

function construirHTML({ tipo, titulo, datos, periodo, landscape = false, siteInfo = {} }) {
  const ROWS_FIRST_PAGE  = landscape ? 12 : 15
  const ROWS_OTHER_PAGES = landscape ? 18 : 22

  const icono    = ICONO_TIPO[tipo] ?? '📋'
  const stats    = calcularStats(tipo, datos)
  const cols     = datos?.length ? Object.keys(datos[0]) : []
  const nReg     = datos?.length ?? 0
  const fechaHoy = hoy()
  const nombre   = siteInfo.nombre || siteInfo.nombreEstudio || 'Casa Scarlatta'

  const statsHTML = stats.map(s =>
    '<div class="stat-card"><div class="stat-value">' + s.valor + '</div><div class="stat-label">' + s.etiqueta + '</div></div>'
  ).join('')

  const theadHTML = cols.map(c => '<th>' + c + '</th>').join('')

  const periodoStr = periodo
    ? '&nbsp;·&nbsp; Período: <strong>' + periodo + '</strong>'
    : ''
  const unidadRegistro = tipo === 'financiero'
    ? 'transacción' + (nReg !== 1 ? 'es' : '')
    : 'registro' + (nReg !== 1 ? 's' : '')

  const cssBlock = landscape ? CSS_LANDSCAPE : CSS_BLOCK

  // --- Dividir filas en páginas ---
  // Las filas de totales (total-row) van siempre al final de la última página
  const totalRows = []
  const dataRows  = datos?.length ? [...datos] : []

  // Separar filas normales de filas de totales (que tienen Concepto en mayúscula como "INGRESOS")
  // No necesitamos hacerlo aquí; construirFilasTabla ya las agrega; las dividimos directamente
  // por índice sobre `datos`.

  // Calcular chunks
  const chunks = []
  if (dataRows.length <= ROWS_FIRST_PAGE) {
    chunks.push(dataRows)
  } else {
    chunks.push(dataRows.slice(0, ROWS_FIRST_PAGE))
    let i = ROWS_FIRST_PAGE
    while (i < dataRows.length) {
      chunks.push(dataRows.slice(i, i + ROWS_OTHER_PAGES))
      i += ROWS_OTHER_PAGES
    }
  }

  const totalPages = chunks.length

  // Construir bloques de página
  let pagesHTML = ''

  chunks.forEach((chunk, pageIdx) => {
    const isFirst = pageIdx === 0
    const isLast  = pageIdx === totalPages - 1
    const pageNum = pageIdx + 1

    pagesHTML += '  <div class="page' + (isLast ? '' : ' page-break') + '">\n'

    if (isFirst) {
      // Primera página: header completo + meta + stats
      pagesHTML += buildHeaderBlock(siteInfo)
      pagesHTML += '    <div class="report-meta">\n'
      pagesHTML += '      <div class="report-meta-icon">' + icono + '</div>\n'
      pagesHTML += '      <div>\n'
      pagesHTML += '        <div class="report-title">' + titulo + '</div>\n'
      pagesHTML += '        <div class="report-date">Generado el ' + fechaHoy + periodoStr
      pagesHTML += ' &nbsp;·&nbsp; ' + nReg + ' ' + unidadRegistro + '</div>\n'
      pagesHTML += '      </div>\n    </div>\n'
      pagesHTML += '    <div class="stats-grid">' + statsHTML + '</div>\n'
    } else {
      // Páginas siguientes: mini header
      pagesHTML += buildMiniHeader(siteInfo, nombre)
    }

    // Tabla
    if (isLast && totalPages === 1) {
      // Una sola página: tabla completa con totales
      const allBodyHTML = construirFilasTabla(datos, tipo)
      pagesHTML += '    <div class="table-wrap"><table>\n'
      pagesHTML += '      <thead><tr>' + theadHTML + '</tr></thead>\n'
      pagesHTML += '      <tbody>' + allBodyHTML + '</tbody>\n'
      pagesHTML += '    </table></div>\n'
    } else if (isLast) {
      // Última página: filas del chunk + totales calculados de todos los datos
      const lastBodyHTML = construirFilasTablaChunk(chunk) + construirTotalesFilas(datos, tipo)
      pagesHTML += '    <div class="table-wrap"><table>\n'
      pagesHTML += '      <thead><tr>' + theadHTML + '</tr></thead>\n'
      pagesHTML += '      <tbody>' + lastBodyHTML + '</tbody>\n'
      pagesHTML += '    </table></div>\n'
    } else {
      // Página intermedia: sólo las filas del chunk, sin totales
      const midBodyHTML = construirFilasTablaChunk(chunk)
      pagesHTML += '    <div class="table-wrap"><table>\n'
      pagesHTML += '      <thead><tr>' + theadHTML + '</tr></thead>\n'
      pagesHTML += '      <tbody>' + midBodyHTML + '</tbody>\n'
      pagesHTML += '    </table></div>\n'
    }

    // Footer en cada página con número
    pagesHTML += '    <div class="footer">\n'
    pagesHTML += '      <span><strong>' + nombre + '</strong> Wellness Studio</span>\n'
    if (totalPages > 1) {
      pagesHTML += '      <span>Página ' + pageNum + ' de ' + totalPages + ' &nbsp;·&nbsp; ' + fechaHoy + '</span>\n'
    } else {
      pagesHTML += '      <span>Documento generado automáticamente · ' + fechaHoy + '</span>\n'
    }
    pagesHTML += '    </div>\n  </div>\n'
  })

  return '<!DOCTYPE html>\n'
    + '<html lang="es">\n<head>\n'
    + '  <meta charset="UTF-8">\n'
    + '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '  <title>' + nombre + ' — ' + titulo + '</title>\n'
    + '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
    + '  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400;1,600&family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n'
    + cssBlock
    + '</head>\n<body>\n'
    + pagesHTML
    + '  <div class="print-controls">\n'
    + '    <button class="btn-print" onclick="window.print()">🖨&nbsp; Guardar como PDF</button>\n'
    + '    <button class="btn-close" onclick="window.close()">Cerrar</button>\n'
    + '  </div>\n</body>\n</html>'
}

/**
 * Abre el reporte en una nueva pestaña lista para imprimir / guardar como PDF.
 */
export function abrirReportePDF({ tipo, titulo, datos, periodo = '', landscape = false, siteInfo = {} }) {
  const html = construirHTML({ tipo, titulo, datos, periodo, landscape, siteInfo })
  const win  = window.open('', '_blank')
  if (!win) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
    return
  }
  win.document.write(html)
  win.document.close()
}

function fmtMoney(v) {
  const n = Number(v ?? 0)
  return '$' + (Number.isFinite(n) ? n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function metodoPago(m) {
  const map = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', mercado_pago: 'Mercado Pago', mercadopago: 'Mercado Pago', other: 'Otro' }
  return map[(m || '').toLowerCase()] || m || '—'
}

function productosVenta(sale) {
  const items = Array.isArray(sale.items) ? sale.items : []
  if (!items.length) return '—'
  return items.map((i) => {
    const nombre = i.name || i.nombre || i.displayName || 'Producto'
    const cantidad = i.quantity ?? i.qty ?? 1
    return cantidad > 1 ? `${nombre} (x${cantidad})` : nombre
  }).join(', ')
}

function cantidadVenta(sale) {
  const items = Array.isArray(sale.items) ? sale.items : []
  if (!items.length) return '—'
  return items.reduce((sum, i) => sum + Number(i.quantity ?? i.qty ?? 1), 0)
}

function buildCortesDetalladoHTML({ titulo, cortes, periodo, siteInfo = {} }) {
  const nombre  = siteInfo.nombre || siteInfo.nombreEstudio || 'Casa Scarlatta'
  const fechaHoy = hoy()

  const totalIngresos = cortes.reduce((a, c) => a + Number(c.totalMxn ?? 0), 0)
  const totalGastos   = cortes.reduce((a, c) => a + Number(c.expensesTotalMxn ?? 0), 0)
  const totalUtilidad = cortes.reduce((a, c) => a + Number(c.netTotalMxn ?? 0), 0)

  const statsHTML = [
    { v: cortes.length, l: 'Cortes realizados' },
    { v: fmtMoney(totalIngresos), l: 'Total ingresos' },
    { v: fmtMoney(totalGastos),   l: 'Total gastos' },
    { v: fmtMoney(totalUtilidad), l: 'Utilidad del turno' },
  ].map(s => `<div class="stat-card"><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div>`).join('')

  const cortesHTML = cortes.map((c) => {
    const diff    = c.cashDifferenceMxn
    const counted = c.countedCashMxn
    let saludColor = '#22c55e'; let saludTxt = 'Cuadrado'
    if (counted === null || counted === undefined) { saludColor = '#d97706'; saludTxt = 'Sin contar' }
    else if (diff < 0) { saludColor = '#dc2626'; saludTxt = `Diferencia ${fmtMoney(Math.abs(diff))}` }
    else if (diff > 0) { saludTxt = `Sobrante ${fmtMoney(diff)}` }

    const apertura = [
      ['Fondo inicial', fmtMoney(c.openingCashMxn)],
      c.openedAt ? ['Hora apertura', fmtDateTime(c.openedAt)] : null,
    ].filter(Boolean).map(([l, v]) => `<tr><td style="color:#7A5C58;font-size:10px">${l}</td><td style="font-weight:600;text-align:right">${v}</td></tr>`).join('')

    const cierre = c.closedAt ? [
      ['Hora cierre', fmtDateTime(c.closedAt)],
      c.createdByName ? ['Cerró', c.createdByName] : null,
    ].filter(Boolean).map(([l, v]) => `<tr><td style="color:#7A5C58;font-size:10px">${l}</td><td style="font-weight:600;text-align:right">${v}</td></tr>`).join('') : ''

    const dineroFisico   = Number(c.cashTotalMxn ?? 0)
    const dineroBancario = Number(c.cardTotalMxn ?? 0) + Number(c.transferTotalMxn ?? 0) + Number(c.otherTotalMxn ?? 0)

    const desglose = [
      { l: 'Total ventas',            v: fmtMoney(c.totalMxn),           bold: true,  color: '#2C1810' },
      { l: 'Dinero físico (efectivo)',v: fmtMoney(dineroFisico),          color: '#1D4ED8' },
      { l: 'Dinero bancario',         v: fmtMoney(dineroBancario),        color: '#1D4ED8' },
      { l: 'Gastos',                  v: '−' + fmtMoney(c.expensesTotalMxn), color: '#DC2626' },
      { l: 'Utilidad del turno',      v: fmtMoney(c.netTotalMxn),         bold: true,  color: '#15803D' },
    ].map(({ l, v, bold, color }) =>
      `<tr><td style="color:#7A5C58;font-size:10px">${l}</td><td style="font-weight:${bold ? 700 : 500};color:${color || '#2C1810'};text-align:right">${v}</td></tr>`
    ).join('')

    const entrega = [
      { l: 'Efectivo a entregar',      v: fmtMoney(dineroFisico) },
      { l: 'Tarjetas / Transferencia', v: fmtMoney(dineroBancario) },
      { l: 'Total corte',              v: fmtMoney(c.totalMxn), bold: true },
    ].map(({ l, v, bold }) =>
      `<tr><td style="color:#7A5C58;font-size:10px">${l}</td><td style="font-weight:${bold ? 700 : 500};text-align:right${bold ? ';color:#7B1E22' : ''}">${v}</td></tr>`
    ).join('')

    const conteo = (counted !== null && counted !== undefined) ? [
      { l: 'Efectivo esperado', v: fmtMoney(c.expectedCashMxn) },
      { l: 'Efectivo contado',  v: fmtMoney(counted) },
      { l: 'Diferencia',        v: fmtMoney(diff), color: diff >= 0 ? '#15803D' : '#DC2626', bold: true },
    ].map(({ l, v, color, bold }) =>
      `<tr><td style="color:#7A5C58;font-size:10px">${l}</td><td style="font-weight:${bold ? 700 : 500};color:${color || '#2C1810'};text-align:right">${v}</td></tr>`
    ).join('') : ''

    const salesHTML = (c.sales?.length > 0) ? `
      <div style="margin-top:14px">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#7A5C58;margin-bottom:6px">Ventas incluidas (${c.sales.length})</div>
        <table style="width:100%;border-collapse:collapse;font-size:9.5px">
          <thead><tr style="background:#7B1E22">
            ${['Folio','Cliente','Producto','Cantidad','Método','Subtotal','IVA','Total','Fecha'].map(h => `<th style="padding:5px 7px;color:#fff;text-align:left;font-size:8px;letter-spacing:0.06em;text-transform:uppercase">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${c.sales.map((s, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#FDFAF8'}">
              ${[s.folio, s.customerName || s.customerEmail || 'Venta mostrador', productosVenta(s), cantidadVenta(s), metodoPago(s.paymentMethod), fmtMoney(s.subtotalMxn), fmtMoney(s.taxMxn), fmtMoney(s.totalMxn), fmtDateTime(s.createdAt)]
                .map(v => `<td style="padding:5px 7px;border-bottom:1px solid #E8D5CB;color:#2C1810">${v}</td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''

    const expensesHTML = (c.expenses?.length > 0) ? `
      <div style="margin-top:12px">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#7A5C58;margin-bottom:6px">Gastos del turno (${c.expenses.length})</div>
        <table style="width:100%;border-collapse:collapse;font-size:9.5px">
          <thead><tr style="background:#7B1E22">
            ${['Categoría','Descripción','Método','Monto'].map(h => `<th style="padding:5px 7px;color:#fff;text-align:left;font-size:8px;letter-spacing:0.06em;text-transform:uppercase">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${c.expenses.map((e, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#FDFAF8'}">
              ${[e.category || '—', e.description || '—', metodoPago(e.paymentMethod), fmtMoney(e.amountMxn)]
                .map(v => `<td style="padding:5px 7px;border-bottom:1px solid #E8D5CB;color:#2C1810">${v}</td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''

    return `
    <div style="border:1px solid #E8D5CB;border-radius:8px;padding:18px 20px;margin-bottom:20px;page-break-inside:avoid;break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div>
          <div style="font-family:'DM Serif Display',serif;font-size:16px;color:#7B1E22">${fmtFecha(c.date)}</div>
          <div style="font-size:10px;color:#7A5C58;margin-top:2px">${c.shiftLabel || 'Día completo'} · ${c.salesCount ?? 0} ventas · ${c.isClosed ? 'Cerrado' : 'Abierto'}</div>
        </div>
        <div style="background:${saludColor}18;border:1px solid ${saludColor}44;border-radius:6px;padding:6px 12px;text-align:center">
          <div style="font-size:11px;font-weight:700;color:${saludColor}">${saludTxt}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:${c.closedAt ? '1fr 1fr' : '1fr'} 1fr 1fr${conteo ? ' 1fr' : ''};gap:12px">
        <div style="background:#F5EDE8;border-radius:6px;padding:12px">
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7A5C58;margin-bottom:8px">Apertura</div>
          <table style="width:100%;border-collapse:collapse">${apertura}</table>
        </div>
        ${c.closedAt ? `<div style="background:#F5EDE8;border-radius:6px;padding:12px">
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7A5C58;margin-bottom:8px">Cierre</div>
          <table style="width:100%;border-collapse:collapse">${cierre}</table>
        </div>` : ''}
        <div style="background:#F5EDE8;border-radius:6px;padding:12px">
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7A5C58;margin-bottom:8px">Desglose de ingresos</div>
          <table style="width:100%;border-collapse:collapse">${desglose}</table>
        </div>
        <div style="background:#F5EDE8;border-radius:6px;padding:12px">
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7A5C58;margin-bottom:8px">Dinero por entregar ⭐</div>
          <table style="width:100%;border-collapse:collapse">${entrega}</table>
        </div>
        ${conteo ? `<div style="background:#F5EDE8;border-radius:6px;padding:12px">
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7A5C58;margin-bottom:8px">Conteo de caja</div>
          <table style="width:100%;border-collapse:collapse">${conteo}</table>
        </div>` : ''}
      </div>
      ${salesHTML}
      ${expensesHTML}
    </div>`
  }).join('')

  const periodoStr = periodo ? ` · Período: <strong>${periodo}</strong>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${nombre} — ${titulo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400;1,600&family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${CSS_VARS}
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'DM Sans', sans-serif; color: var(--dark); background: #F0E9E4; min-height: 100vh; padding: 40px 20px 60px; }
    .page { background: white; max-width: 900px; margin: 0 auto; padding: 44px 52px; border-radius: 4px; box-shadow: 0 4px 40px rgba(44,24,16,0.15); }
    ${CSS_SHARED}
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 20px 24px; max-width: 100%; }
      .print-controls { display: none; }
      @page { size: letter portrait; margin: 10mm 8mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${buildHeaderBlock(siteInfo)}
    <div class="report-meta">
      <div class="report-meta-icon">🏧</div>
      <div>
        <div class="report-title">${titulo}</div>
        <div class="report-date">Generado el ${fechaHoy}${periodoStr} · ${cortes.length} corte${cortes.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
    <div class="stats-grid">${statsHTML}</div>
    ${cortesHTML}
    <div class="footer">
      <span><strong>${nombre}</strong> Wellness Studio</span>
      <span>Documento generado automáticamente · ${fechaHoy}</span>
    </div>
  </div>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨&nbsp; Guardar como PDF</button>
    <button class="btn-close" onclick="window.close()">Cerrar</button>
  </div>
</body>
</html>`
}

export function abrirCortesDetalladoPDF({ titulo, cortes, periodo = '', siteInfo = {} }) {
  const html = buildCortesDetalladoHTML({ titulo, cortes, periodo, siteInfo })
  const win  = window.open('', '_blank')
  if (!win) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
    return
  }
  win.document.write(html)
  win.document.close()
}

function estatusColor(estatus) {
  if (estatus === 'Agotado') return '#dc2626'
  if (estatus === 'Bajo stock') return '#d97706'
  return '#22c55e'
}

function buildInventoryTable(titulo, rows, { showStockCols = true } = {}) {
  if (!rows?.length) {
    return `
      <div style="margin-top:14px">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#7A5C58;margin-bottom:6px">${titulo} (0)</div>
        <div style="font-size:10.5px;color:#9C7A74;padding:10px 0">Sin registros.</div>
      </div>`
  }
  const headers = showStockCols
    ? ['SKU', 'Producto', 'Stock inicial', 'Entradas', 'Vendidos', 'Stock actual', 'Stock mínimo', 'Estatus']
    : ['SKU', 'Producto', 'Vendidos']
  return `
    <div style="margin-top:14px">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#7A5C58;margin-bottom:6px">${titulo} (${rows.length})</div>
      <table style="width:100%;border-collapse:collapse;font-size:9.5px">
        <thead><tr style="background:#7B1E22">
          ${headers.map(h => `<th style="padding:5px 7px;color:#fff;text-align:left;font-size:8px;letter-spacing:0.06em;text-transform:uppercase">${h}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${rows.map((r, i) => {
            const cells = showStockCols
              ? [r.sku, r.name, r.stockInicial, r.entradas, r.vendidos, r.stockActual, r.stockMinimo]
              : [r.sku, r.name, r.vendidos]
            return `<tr style="background:${i % 2 === 0 ? '#fff' : '#FDFAF8'}">
              ${cells.map(v => `<td style="padding:5px 7px;border-bottom:1px solid #E8D5CB;color:#2C1810">${v}</td>`).join('')}
              ${showStockCols ? `<td style="padding:5px 7px;border-bottom:1px solid #E8D5CB;font-weight:700;color:${estatusColor(r.estatus)}">${r.estatus}</td>` : ''}
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>`
}

function buildInventarioDetalladoHTML({ titulo, reporte, periodo, siteInfo = {} }) {
  const nombre = siteInfo.nombre || siteInfo.nombreEstudio || 'Casa Scarlatta'
  const fechaHoy = hoy()
  const s = reporte.summary || {}

  const statsHTML = [
    { v: s.activeProducts ?? 0, l: 'Productos activos' },
    { v: s.productsWithEntries ?? 0, l: 'Con entradas en el periodo' },
    { v: s.unitsSold ?? 0, l: 'Unidades vendidas' },
    { v: s.currentStockTotal ?? 0, l: 'Existencia actual total' },
  ].map(x => `<div class="stat-card"><div class="stat-value">${x.v}</div><div class="stat-label">${x.l}</div></div>`).join('')

  const warningHTML = reporte.reliabilityWarning
    ? `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:10.5px;color:#92400E">⚠️ ${reporte.reliabilityWarning}</div>`
    : ''

  const periodoStr = periodo ? ` · Período: <strong>${periodo}</strong>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${nombre} — ${titulo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400;1,600&family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${CSS_VARS}
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'DM Sans', sans-serif; color: var(--dark); background: #F0E9E4; min-height: 100vh; padding: 40px 20px 60px; }
    .page { background: white; max-width: 900px; margin: 0 auto; padding: 44px 52px; border-radius: 4px; box-shadow: 0 4px 40px rgba(44,24,16,0.15); }
    ${CSS_SHARED}
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 20px 24px; max-width: 100%; }
      .print-controls { display: none; }
      @page { size: letter portrait; margin: 10mm 8mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${buildHeaderBlock(siteInfo)}
    <div class="report-meta">
      <div class="report-meta-icon">📦</div>
      <div>
        <div class="report-title">${titulo}</div>
        <div class="report-date">Generado el ${fechaHoy}${periodoStr}</div>
      </div>
    </div>
    <div class="stats-grid">${statsHTML}</div>
    ${warningHTML}
    ${buildInventoryTable('Detalle por producto', reporte.detail)}
    ${buildInventoryTable('Top 5 más vendidos', reporte.topSold, { showStockCols: false })}
    ${buildInventoryTable('Sin movimiento en el periodo', reporte.noMovement)}
    ${buildInventoryTable('Agotados actualmente', reporte.outOfStock)}
    <div class="footer">
      <span><strong>${nombre}</strong> Wellness Studio</span>
      <span>Documento generado automáticamente · ${fechaHoy}</span>
    </div>
  </div>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨&nbsp; Guardar como PDF</button>
    <button class="btn-close" onclick="window.close()">Cerrar</button>
  </div>
</body>
</html>`
}

export function abrirInventarioDetalladoPDF({ titulo, reporte, periodo = '', siteInfo = {} }) {
  const html = buildInventarioDetalladoHTML({ titulo, reporte, periodo, siteInfo })
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
export function descargarHTMLReporte({ tipo, titulo, datos, periodo = '', siteInfo = {} }) {
  const html  = construirHTML({ tipo, titulo, datos, periodo, siteInfo })
  const blob  = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  const fecha = hoyLocal()
  a.href     = url
  a.download = 'reporte-' + tipo + '-' + fecha + '.html'
  a.click()
  URL.revokeObjectURL(url)
}
