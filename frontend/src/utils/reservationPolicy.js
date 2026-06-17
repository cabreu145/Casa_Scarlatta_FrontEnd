export function resolveLimitOneSpotPerOccurrence(source = null) {
  if (!source || typeof source !== 'object') return false
  return Boolean(
    source.limitOneSpotPerOccurrence ??
    source.limit_one_spot_per_occurrence ??
    false
  )
}

export function isActiveReservationStatus(status) {
  const normalized = String(status ?? '').trim().toLowerCase()
  return normalized === 'confirmada' || normalized === 'confirmed'
}

export function hasActiveReservationInOccurrenceForUser({
  reservations = [],
  userId = null,
  occurrenceId = null,
} = {}) {
  const numericUserId = Number(userId)
  const numericOccurrenceId = Number(occurrenceId)

  if (!Number.isFinite(numericUserId) || !Number.isFinite(numericOccurrenceId)) return false

  return (Array.isArray(reservations) ? reservations : []).some((reservation) => {
    const reservationUserId = Number(reservation?.userId ?? reservation?.user_id)
    const reservationOccurrenceId = Number(reservation?.occurrenceId ?? reservation?.occurrence_id)
    const reservationStatus = reservation?.status ?? reservation?.estado

    return (
      reservationUserId === numericUserId &&
      reservationOccurrenceId === numericOccurrenceId &&
      isActiveReservationStatus(reservationStatus)
    )
  })
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
