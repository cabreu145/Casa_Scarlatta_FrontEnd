import { ESTADOS_RESERVA } from '@/data/mockData'

function toIsoDateFromDateTime(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

function toIsoDateSafe(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return toIsoDateFromDateTime(value)
}

export function mapCreateReservationPayload({ claseId, userId, asiento, occurrenceId }) {
  if (!occurrenceId) {
    throw new Error('OCCURRENCE_REQUIRED')
  }
  const payload = {
    clase_id: Number(claseId),
    user_id: Number(userId),
    occurrence_id: Number(occurrenceId),
  }
  if (asiento !== undefined && asiento !== null && asiento !== '') {
    const seatNumber = Number(asiento)
    if (Number.isFinite(seatNumber)) payload.seat_number = seatNumber
  }
  return payload
}

export function mapBackendReservationToFrontend(reservation = {}, classesById = {}) {
  const claseId = reservation.class_id ?? reservation.clase_id ?? reservation.classId ?? reservation.claseId
  const occurrenceId = reservation.occurrence_id ?? reservation.occurrenceId ?? null
  const classData = classesById?.[claseId] ?? null

  const fechaCreacionReserva = toIsoDateFromDateTime(reservation.reserved_at)
  const classStartAt = reservation.class_start_at ?? reservation.classStartAt ?? null
  const classDateRaw = reservation.class_date ?? reservation.classDate ?? null
  const classDate = toIsoDateSafe(classDateRaw)
  const classStartTime = reservation.class_start_time ?? reservation.classStartTime ?? null
  const classNameSnapshot = reservation.class_name ?? reservation.className ?? null
  const classStatusSnapshot = reservation.class_status ?? reservation.classStatus ?? null

  const fechaSesion = classDate ?? toIsoDateFromDateTime(classStartAt) ?? classData?.fecha ?? null

  return {
    id: reservation.id,
    userId: reservation.user_id ?? reservation.userId ?? null,
    claseId,
    occurrenceId,
    claseNombre: classNameSnapshot ?? classData?.nombre ?? classData?.name ?? `Clase #${claseId ?? 'N/A'}`,
    claseHora: classStartTime ?? classData?.hora ?? '00:00',
    claseDia: classData?.dia ?? null,
    coachNombre: classData?.coachNombre ?? 'Sin coach',
    tipo: classData?.tipo ?? 'Stryde X',
    asiento: reservation.seat_number ?? reservation.seatNumber ?? null,
    estado: reservation.status ?? ESTADOS_RESERVA.CONFIRMADA,
    fecha: fechaSesion,
    fechaSesion,
    classStartAt,
    classDate,
    classStartTime,
    classStatus: classStatusSnapshot,
    fechaCreacionReserva,
    fechaReserva: fechaCreacionReserva,
  }
}

export function mapBackendReservationsToFrontend(reservations = [], classesById = {}) {
  return reservations.map((row) => mapBackendReservationToFrontend(row, classesById))
}
