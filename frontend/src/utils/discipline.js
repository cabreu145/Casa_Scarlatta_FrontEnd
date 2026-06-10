export function normalizeDiscipline(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'stryde' || normalized === 'stride') return 'stryde'
  if (normalized === 'slow') return 'slow'
  return null
}

export function getDisciplineBadgeLabel(value) {
  const normalized = normalizeDiscipline(value)
  if (normalized === 'slow') return 'SLOW'
  if (normalized === 'stryde') return 'STRYDE'
  return null
}
