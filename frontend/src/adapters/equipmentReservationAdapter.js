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
    userId: payload.user_id ?? payload.userId ?? null,
    spotId: payload.spot_id ?? payload.spotId ?? null,
    status: payload.status ?? 'held',
    expiresAt: payload.expires_at ?? payload.expiresAt ?? null,
    serverNow: payload.server_now ?? payload.serverNow ?? null,
    raw: payload ?? {},
  }
}

export function mapSpotHoldBatchResponseToFrontend(payload = {}) {
  const holds = Array.isArray(payload.holds)
    ? payload.holds.map((hold) => mapSpotHoldResponseToFrontend({
      ...hold,
      occurrence_id: hold?.occurrence_id ?? payload.occurrence_id ?? payload.occurrenceId ?? null,
      occurrenceId: hold?.occurrenceId ?? payload.occurrence_id ?? payload.occurrenceId ?? null,
      user_id: hold?.user_id ?? payload.user_id ?? payload.userId ?? null,
      userId: hold?.userId ?? payload.user_id ?? payload.userId ?? null,
      server_now: hold?.server_now ?? payload.server_now ?? payload.serverNow ?? null,
      serverNow: hold?.serverNow ?? payload.server_now ?? payload.serverNow ?? null,
    }))
    : []

  if (holds.length > 0) {
    const firstHold = holds[0]
    return {
      occurrenceId: payload.occurrence_id ?? payload.occurrenceId ?? firstHold?.occurrenceId ?? null,
      userId: payload.user_id ?? payload.userId ?? firstHold?.userId ?? null,
      serverNow: payload.server_now ?? payload.serverNow ?? firstHold?.serverNow ?? null,
      holds,
      holdId: firstHold?.holdId ?? null,
      spotId: firstHold?.spotId ?? null,
      expiresAt: firstHold?.expiresAt ?? null,
      status: firstHold?.status ?? 'held',
      raw: payload ?? {},
    }
  }

  const singleHold = mapSpotHoldResponseToFrontend(payload)
  return {
    occurrenceId: singleHold.occurrenceId,
    userId: singleHold.userId,
    serverNow: singleHold.serverNow,
    holds: singleHold.holdId ? [singleHold] : [],
    holdId: singleHold.holdId,
    spotId: singleHold.spotId,
    expiresAt: singleHold.expiresAt,
    status: singleHold.status,
    raw: payload ?? {},
  }
}

export function mapReservationHoldPayload({ occurrenceId, spotId, spotIds, userId }) {
  const payload = {
    occurrence_id: toNumberOrNull(occurrenceId),
  }
  const normalizedSpotIds = Array.isArray(spotIds)
    ? spotIds
      .map((value) => toNumberOrNull(value))
      .filter((value) => value != null)
    : []

  if (normalizedSpotIds.length > 0) {
    payload.spot_ids = normalizedSpotIds
  } else {
    payload.spot_id = toNumberOrNull(spotId)
  }
  if (userId !== undefined && userId !== null && userId !== '') {
    payload.user_id = toNumberOrNull(userId)
  }
  return payload
}
