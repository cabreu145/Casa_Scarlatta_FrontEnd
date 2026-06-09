export function getFilenameFromContentDisposition(headerValue) {
  if (!headerValue) return null
  const value = String(headerValue)
  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''))
  const match = value.match(/filename\s*=\s*("?)([^";]+)\1/i)
  return match?.[2]?.trim() ?? null
}

export function downloadBlob(blob, filename) {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
