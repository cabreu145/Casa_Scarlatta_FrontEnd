export function normalizeDiscipline(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized.includes('stryde') || normalized.includes('stride')) return 'stryde'
  if (normalized === 'slow' || normalized.includes('slow')) return 'slow'
  return null
}

export function getDisciplineBadgeLabel(value) {
  const normalized = normalizeDiscipline(value)
  if (normalized === 'slow') return 'SLOW'
  if (normalized === 'stryde') return 'STRYDE X'
  return null
}
