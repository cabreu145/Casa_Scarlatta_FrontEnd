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

function normalizeNumberArray(values = []) {
  return values
    .map((value) => {
      if (value === null || value === undefined || value === '') return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    })
    .filter((value) => value != null)
}

function buildEquipmentLabel(equipmentType) {
  const normalized = String(equipmentType ?? '').trim().toLowerCase()
  if (normalized === 'mat') return 'Tapete'
  if (normalized === 'bench') return 'Banco'
  if (normalized === 'treadmill') return 'Caminadora'
  return equipmentType ? String(equipmentType) : null
}

export function mapCreateReservationPayload({ claseId, userId, asiento, occurrenceId, spotId, holdId, spotIds, holdIds }) {
  if (!occurrenceId) {
    throw new Error('OCCURRENCE_REQUIRED')
  }
  const payload = {
    clase_id: Number(claseId),
    occurrence_id: Number(occurrenceId),
  }
  if (userId !== undefined && userId !== null && userId !== '') {
    payload.user_id = Number(userId)
  }

  const normalizedSpotIds = Array.isArray(spotIds) ? normalizeNumberArray(spotIds) : []
  const normalizedHoldIds = Array.isArray(holdIds) ? normalizeNumberArray(holdIds) : []

  if (normalizedSpotIds.length > 0) {
    if (normalizedHoldIds.length === 0) {
      throw new Error('HOLD_REQUIRED')
    }
    if (normalizedSpotIds.length !== normalizedHoldIds.length) {
      throw new Error('SPOT_HOLD_COUNT_MISMATCH')
    }
    payload.spot_ids = normalizedSpotIds
    payload.hold_ids = normalizedHoldIds
    return payload
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
  const startAt = reservation.start_at ?? reservation.startAt ?? null
  const classStartAt = reservation.class_start_at ?? reservation.classStartAt ?? startAt ?? null
  const occurrenceDate = reservation.occurrence_date ?? reservation.occurrenceDate ?? null
  const classDateRaw = reservation.class_date ?? reservation.classDate ?? null
  const classDate = toIsoDateSafe(classDateRaw) ?? toIsoDateSafe(occurrenceDate)
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
  const spotLabel = reservation.spot_label ?? reservation.spotLabel ?? null
  const spotEquipmentType = reservation.spot_equipment_type ?? reservation.spotEquipmentType ?? reservation.equipment_type ?? reservation.equipmentType ?? null
  const equipmentLabel = buildEquipmentLabel(spotEquipmentType)

  const fechaSesion = classDate ?? toIsoDateFromDateTime(classStartAt) ?? toIsoDateFromDateTime(startAt) ?? classData?.fecha ?? null
  const displayDate = formatClassDate(getClassDisplayDate({
    classDate,
    occurrenceDate,
    classStartAt,
    startAt,
    fecha: fechaSesion,
  }))

  return {
    id: reservation.id ?? reservation.reservation_id ?? reservation.reservationId ?? null,
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
      classData?.tipo,
      classNameSnapshot ??
      classData?.nombre ??
      classData?.name ??
      reservation.title ??
      reservation.nombre
    ),
    spotLabel,
    spotEquipmentType,
    equipmentType: spotEquipmentType,
    equipmentLabel,
    asiento: reservation.seat_number ?? reservation.seatNumber ?? null,
    estado: reservation.status ?? ESTADOS_RESERVA.CONFIRMADA,
    fecha: fechaSesion,
    fechaSesion,
    occurrenceDate,
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
