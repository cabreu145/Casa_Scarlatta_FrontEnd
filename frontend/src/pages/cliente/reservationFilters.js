const LEGACY_STATUS_MAP = {
  confirmed: 'confirmada',
  cancelled: 'cancelada',
  completed: 'completada',
  no_show: 'no_asistio',
  noShow: 'no_asistio',
}

export function normalizeReservationStatus(status) {
  if (!status || typeof status !== 'string') return null
  const trimmed = status.trim()
  if (!trimmed) return null
  return LEGACY_STATUS_MAP[trimmed] ?? trimmed
}

export function filterReservationsByStatus(reservas = [], statusFilter = 'all') {
  const source = Array.isArray(reservas) ? reservas : []
  if (statusFilter === 'all') return source
  return source.filter((r) => normalizeReservationStatus(r?.estado) === statusFilter)
}
