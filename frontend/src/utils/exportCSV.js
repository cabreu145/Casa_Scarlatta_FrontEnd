// UTF-8 BOM ensures Excel opens the file without garbled characters
const BOM = '\uFEFF'

export function exportCSV(datos, nombreArchivo, columnas) {
  const headers = columnas.map((c) => c.label).join(',')
  const filas = datos.map((row) =>
    columnas
      .map((c) => {
        const val = c.key ? row[c.key] : c.render(row)
        const str = val == null ? '' : String(val)
        // wrap in quotes if the value contains commas or quotes
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      })
      .join(',')
  )
  const csv = BOM + [headers, ...filas].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
