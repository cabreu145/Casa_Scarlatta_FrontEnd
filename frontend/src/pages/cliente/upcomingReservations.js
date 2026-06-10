const ACTIVE_UPCOMING_STATUS = new Set(['confirmada'])

export const UPCOMING_RESERVATIONS_LIMIT = 4

function toIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function toIsoTime(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : null
}

export function buildUpcomingReservationDateTime(reserva, options = {}) {
  const useApiReservations = options.useApiReservations === true
  const getOccurrenceDate = options.getOccurrenceDate ?? (() => null)
  const getLocalDate = options.getLocalDate ?? (() => null)
  const localHour = options.getLocalHour ?? (() => null)

  if (useApiReservations) {
    if (typeof reserva?.classStartAt === 'string' && reserva.classStartAt) {
      const parsed = new Date(reserva.classStartAt)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const classDate = toIsoDate(getOccurrenceDate(reserva))
    if (!classDate) return null
    const classTime = toIsoTime(reserva?.classStartTime ?? reserva?.displayTime ?? reserva?.claseHora)
    const isoDateTime = classTime ? `${classDate}T${classTime}:00` : `${classDate}T00:00:00`
    const parsed = new Date(isoDateTime)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const classDate = toIsoDate(getLocalDate(reserva))
  if (!classDate) return null
  const classTime = toIsoTime(localHour(reserva))
  const isoDateTime = classTime ? `${classDate}T${classTime}:00` : `${classDate}T00:00:00`
  const parsed = new Date(isoDateTime)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getUpcomingReservations(reservas = [], options = {}) {
  const source = Array.isArray(reservas) ? reservas : []
  const now = options.now instanceof Date ? options.now : new Date()
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? options.limit
    : UPCOMING_RESERVATIONS_LIMIT

  const withDate = source
    .filter((r) => ACTIVE_UPCOMING_STATUS.has(r?.estado))
    .map((r) => ({
      reservation: r,
      dateTime: buildUpcomingReservationDateTime(r, options),
    }))
    .filter((item) => item.dateTime && item.dateTime >= now)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())

  return {
    total: withDate.length,
    items: withDate.slice(0, limit).map((item) => item.reservation),
  }
}
