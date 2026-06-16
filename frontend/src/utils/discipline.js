export function normalizeDiscipline(value, fallbackText = '') {
  const raw = String(value ?? fallbackText ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const compact = raw.replace(/[^a-z0-9]/g, '')

  if (compact.includes('stryde') || compact.includes('stride')) return 'stryde'
  if (compact.includes('slow')) return 'slow'
  return null
}

export function getDisciplineBadgeLabel(value, fallbackText = '') {
  const normalized = normalizeDiscipline(value, fallbackText)
  if (normalized === 'slow') return 'SLOW'
  if (normalized === 'stryde') return 'STRYDE X'
  return null
}
