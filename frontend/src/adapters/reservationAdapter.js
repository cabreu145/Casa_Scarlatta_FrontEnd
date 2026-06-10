import { ESTADOS_RESERVA } from '@/data/mockData'
import { normalizeDiscipline } from '@/utils/discipline'
import { formatClassDate, getClassDisplayDate, getClassDisplayTime, getClassTimeToken } from '@/utils/classSchedule'

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

export function mapCreateReservationPayload({ claseId, userId, asiento, occurrenceId, spotId, holdId }) {
  if (!occurrenceId) {
    throw new Error('OCCURRENCE_REQUIRED')
  }
  const payload = {
    clase_id: Number(claseId),
    user_id: Number(userId),
    occurrence_id: Number(occurrenceId),
  }
  if (spotId !== undefined && spotId !== null && spotId !== '') {
    if (!holdId) {
      throw new Error('HOLD_REQUIRED')
    }
    payload.spot_id = Number(spotId)
    payload.hold_id = Number(holdId)
    return payload
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
  const occurrenceDate = reservation.occurrence_date ?? reservation.occurrenceDate ?? null
  const classDateRaw = reservation.class_date ?? reservation.classDate ?? null
  const classDate = toIsoDateSafe(classDateRaw)
  const classStartTime = getClassTimeToken({
    startTime: reservation.class_start_time ?? reservation.classStartTime ?? null,
    startAt: classStartAt,
    class_start_time: reservation.class_start_time ?? reservation.classStartTime ?? null,
    class_start_at: classStartAt,
    hora: classData?.hora ?? null,
    time: classData?.time ?? null,
  })
  const classNameSnapshot = reservation.class_name ?? reservation.className ?? null
  const classStatusSnapshot = reservation.class_status ?? reservation.classStatus ?? null

  const fechaSesion = classDate ?? toIsoDateFromDateTime(classStartAt) ?? classData?.fecha ?? null
  const displayDate = formatClassDate(getClassDisplayDate({
    classDate,
    occurrenceDate,
    classStartAt,
    startAt: reservation.start_at ?? reservation.startAt ?? null,
    fecha: fechaSesion,
  }))

  return {
    id: reservation.id,
    userId: reservation.user_id ?? reservation.userId ?? null,
    claseId,
    occurrenceId,
    spotId: reservation.spot_id ?? reservation.spotId ?? null,
    holdId: reservation.hold_id ?? reservation.holdId ?? null,
    claseNombre: classNameSnapshot ?? classData?.nombre ?? classData?.name ?? `Clase #${claseId ?? 'N/A'}`,
    coachId: classData?.coachId ?? reservation.coach_id ?? reservation.coachId ?? null,
    claseHora: classStartTime ?? getClassTimeToken(classData ?? {}) ?? null,
    displayTime: getClassDisplayTime({
      classStartTime,
      classStartAt,
      startTime: classData?.hora ?? classData?.time ?? null,
      hora: classData?.hora ?? null,
    }),
    displayDate,
    claseDia: classData?.dia ?? null,
    coachNombre: classData?.coachNombre ?? 'Sin coach',
    coachAvatarUrl: classData?.coachAvatarUrl ?? reservation.coach_avatar_url ?? reservation.coachAvatarUrl ?? null,
    tipo: classData?.tipo ?? 'Stryde X',
    discipline: normalizeDiscipline(
      reservation.discipline ??
      reservation.class_discipline ??
      classData?.discipline ??
      classData?.classDiscipline ??
      classData?.tipo
    ),
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
