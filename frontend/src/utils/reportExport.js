import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

function ensureArray(rows) {
  return Array.isArray(rows) ? rows : []
}

export function buildReportFilename(prefix, from, to, ext = 'csv') {
  const safeFrom = String(from || 'inicio').trim()
  const safeTo = String(to || 'hoy').trim()
  return `${prefix}-${safeFrom}_${safeTo}.${ext}`
}

// Un CSV con varios bloques (cada uno con su propio título y encabezados),
// separados por una fila en blanco — para reportes que en pantalla/PDF se ven
// como varias tablas distintas (ej. resumen + detalle) y deben leerse igual
// en Excel, en vez de mezclarse en una sola tabla con columnas vacías.
export function downloadCsvFromBlocks({ blocks, filename = 'reporte.csv', emptyMessage = 'Sin datos para exportar' }) {
  const nonEmptyBlocks = ensureArray(blocks).filter((b) => b?.rows?.length)
  if (!nonEmptyBlocks.length) {
    toast.error(emptyMessage)
    return false
  }

  const aoa = []
  nonEmptyBlocks.forEach((block, idx) => {
    if (idx > 0) aoa.push([])
    if (block.title) aoa.push([block.title])
    aoa.push(...block.rows)
  })

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
  toast.success('CSV exportado')
  return true
}

export function downloadCsvFromRows({ rows, headers = [], filename = 'reporte.csv', emptyMessage = 'Sin datos para exportar' }) {
  const data = ensureArray(rows)
  if (!headers.length && !data.length) {
    toast.error(emptyMessage)
    return false
  }

  const worksheet = data.length
    ? XLSX.utils.json_to_sheet(data, { header: headers.length ? headers : undefined })
    : XLSX.utils.aoa_to_sheet([headers])

  const csv = XLSX.utils.sheet_to_csv(worksheet)
  // BOM (0xFEFF) tells Excel to open the file as UTF-8, preventing garbled accents
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
  toast.success('CSV exportado')
  return true
}
