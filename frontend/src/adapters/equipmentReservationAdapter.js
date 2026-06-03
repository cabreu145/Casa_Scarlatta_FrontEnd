function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function padLabel(label) {
  const value = String(label ?? '').trim()
  if (!value) return ''
  if (/^\d+$/.test(value)) return value.padStart(2, '0')
  return value
}

export function mapEquipmentSpotToFrontend(item = {}) {
  return {
    spotId: item.spot_id ?? item.spotId ?? null,
    label: padLabel(item.label),
    equipmentType: item.equipment_type ?? item.equipmentType ?? null,
    row: item.row ?? null,
    col: item.col ?? null,
    x: item.x ?? null,
    y: item.y ?? null,
    status: item.status ?? 'inactive',
    heldUntil: item.held_until ?? item.heldUntil ?? null,
    heldByMe: Boolean(item.held_by_me ?? item.heldByMe ?? false),
    reservationId: item.reservation_id ?? item.reservationId ?? null,
    raw: item ?? {},
  }
}

export function mapOccurrenceSpotsResponseToFrontend(payload = {}) {
  const spots = Array.isArray(payload.spots) ? payload.spots.map((item) => mapEquipmentSpotToFrontend(item ?? {})) : []
  return {
    occurrenceId: payload.occurrence_id ?? payload.occurrenceId ?? null,
    discipline: payload.discipline ?? null,
    className: payload.class_name ?? payload.className ?? null,
    coachName: payload.coach_name ?? payload.coachName ?? null,
    occurrenceDate: payload.occurrence_date ?? payload.occurrenceDate ?? null,
    startAt: payload.start_at ?? payload.startAt ?? null,
    endAt: payload.end_at ?? payload.endAt ?? null,
    serverNow: payload.server_now ?? payload.serverNow ?? null,
    spots,
    raw: payload ?? {},
  }
}

export function mapSpotHoldResponseToFrontend(payload = {}) {
  return {
    holdId: payload.hold_id ?? payload.holdId ?? null,
    occurrenceId: payload.occurrence_id ?? payload.occurrenceId ?? null,
    spotId: payload.spot_id ?? payload.spotId ?? null,
    status: payload.status ?? 'held',
    expiresAt: payload.expires_at ?? payload.expiresAt ?? null,
    serverNow: payload.server_now ?? payload.serverNow ?? null,
    raw: payload ?? {},
  }
}

export function mapReservationHoldPayload({ occurrenceId, spotId }) {
  const payload = {
    occurrence_id: toNumberOrNull(occurrenceId),
    spot_id: toNumberOrNull(spotId),
  }
  return payload
}
