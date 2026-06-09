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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
  toast.success('CSV exportado')
  return true
}
