export function getMapCapacityByDiscipline(discipline) {
  const raw = String(discipline ?? '').trim().toLowerCase()
  if (raw === 'stryde' || raw === 'stryde x' || raw === 'stride') return 15
  if (raw === 'slow') return 9
  return null
}

export function isMapDiscipline(discipline) {
  return getMapCapacityByDiscipline(discipline) !== null
}
