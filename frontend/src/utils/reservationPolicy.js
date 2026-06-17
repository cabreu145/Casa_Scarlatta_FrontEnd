export function resolveLimitOneSpotPerOccurrence(source = null) {
  if (!source || typeof source !== 'object') return false
  return Boolean(
    source.limitOneSpotPerOccurrence ??
    source.limit_one_spot_per_occurrence ??
    false
  )
}

export function canReserveAnotherSpotInOccurrence({
  isMapClass = false,
  hasActiveReservationInOccurrence = false,
  activeMembership = null,
} = {}) {
  if (!isMapClass || !hasActiveReservationInOccurrence) return false
  return !resolveLimitOneSpotPerOccurrence(activeMembership)
}

export function getOneSpotPerOccurrenceMessage({ admin = false } = {}) {
  return admin
    ? 'El paquete de este cliente permite solo un lugar por clase.'
    : 'Tu paquete permite solo un lugar por clase.'
}
