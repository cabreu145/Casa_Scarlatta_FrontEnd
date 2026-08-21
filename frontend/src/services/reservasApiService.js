import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import {
  mapBackendReservationToFrontend,
  mapBackendReservationsToFrontend,
  mapCreateReservationPayload,
} from '@/adapters/reservationAdapter'
import { mapBackendOccurrenceRosterToFrontend } from '@/adapters/occurrenceRosterAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import { useClasesStore } from '@/stores/clasesStore'

function buildClassesById() {
  const clases = useClasesStore.getState().clases ?? []
  return Object.fromEntries(clases.map((c) => [c.id, c]))
}

function getCancellationField(payload, reservation, camelCase, snakeCase) {
  return reservation?.[camelCase] ??
    reservation?.[snakeCase] ??
    payload?.[camelCase] ??
    payload?.[snakeCase] ??
    payload?.data?.[camelCase] ??
    payload?.data?.[snakeCase] ??
    null
}

function mapCancellationResponse(payload) {
  const reservation = payload?.reservation ?? payload?.data?.reservation ?? payload?.data ?? payload ?? {}
  const mappedReservation = mapBackendReservationToFrontend(reservation, buildClassesById())
  return {
    ...mappedReservation,
    refundApplied: Boolean(getCancellationField(payload, reservation, 'refundApplied', 'refund_applied')),
    refundedCredits: Number(getCancellationField(payload, reservation, 'refundedCredits', 'refunded_credits') ?? 0),
    cancelledByAdmin: Boolean(getCancellationField(payload, reservation, 'cancelledByAdmin', 'cancelled_by_admin')),
    cancellationReason: getCancellationField(payload, reservation, 'cancellationReason', 'cancellation_reason'),
    cancelledAt: getCancellationField(payload, reservation, 'cancelledAt', 'cancelled_at'),
  }
}

export async function getMisReservasApi() {
  const payload = await httpGet(ENDPOINTS.reservasMe)
  return mapBackendReservationsToFrontend(Array.isArray(payload) ? payload : [], buildClassesById())
}

export async function getMisReservasPaginatedApi({ page = 1, pageSize = 20, status, from, to } = {}) {
  const payload = await httpGet(ENDPOINTS.reservasMePaginated({ page, pageSize, status, from, to }))
  return normalizePaginatedResponse(
    payload,
    (item) => mapBackendReservationToFrontend(item ?? {}, buildClassesById())
  )
}

export async function getReservaByIdApi(id) {
  const payload = await httpGet(ENDPOINTS.reservaById(id))
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function crearReservaApi({ claseId, userId, asiento, occurrenceId, spotId, holdId, spotIds, holdIds }) {
  const requestPayload = mapCreateReservationPayload({ claseId, userId, asiento, occurrenceId, spotId, holdId, spotIds, holdIds })
  const payload = await httpPost(ENDPOINTS.crearReserva, requestPayload)
  if (Array.isArray(payload?.reservations)) {
    const classesById = buildClassesById()
    const reservations = payload.reservations.map((row) => mapBackendReservationToFrontend({
      ...row,
      class_id: row?.class_id ?? payload?.class_id ?? claseId,
      class_name: row?.class_name ?? payload?.class_name ?? null,
      occurrence_id: row?.occurrence_id ?? payload?.occurrence_id ?? occurrenceId,
    }, classesById))
    const firstReservation = reservations[0] ?? null
    return {
      occurrenceId: payload?.occurrence_id ?? occurrenceId ?? null,
      userId: payload?.user_id ?? userId ?? null,
      creditsCharged: payload?.credits_charged ?? payload?.creditsCharged ?? reservations.length,
      reservations,
      id: firstReservation?.id ?? null,
      spotId: firstReservation?.spotId ?? null,
      holdId: firstReservation?.holdId ?? null,
      status: firstReservation?.estado ?? null,
    }
  }
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function getOccurrenceRosterApi(occurrenceId, { includeCanceled = false } = {}) {
  if (!occurrenceId) {
    throw new Error('OCCURRENCE_REQUIRED')
  }
  const payload = await httpGet(ENDPOINTS.occurrenceAlumnos(occurrenceId, { includeCanceled }))
  return mapBackendOccurrenceRosterToFrontend(payload ?? {})
}

export async function cancelarReservaApi(id, { reason, refundCredit } = {}) {
  const requestPayload = {
    ...(String(reason ?? '').trim() ? { reason: String(reason).trim() } : {}),
    ...(refundCredit === true ? { refundCredit: true } : {}),
  }
  const payload = await httpPost(ENDPOINTS.cancelarReserva(id), requestPayload)
  return mapCancellationResponse(payload)
}

export async function cancelarReservasMultipleApi({ reservationIds, userId, reason, refundCredit } = {}) {
  const payload = await httpPost(ENDPOINTS.cancelarReservasMultiple, {
    reservation_ids: Array.isArray(reservationIds) ? reservationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [],
    ...(userId !== undefined && userId !== null && userId !== '' ? { user_id: Number(userId) } : {}),
    ...(String(reason ?? '').trim() ? { reason: String(reason).trim() } : {}),
    ...(refundCredit === true ? { refundCredit: true } : {}),
  })

  return {
    cancelledCount: payload?.cancelled_count ?? payload?.cancelledCount ?? 0,
    creditsRefunded: payload?.credits_refunded ?? payload?.creditsRefunded ?? 0,
    reservations: Array.isArray(payload?.reservations)
      ? payload.reservations.map((row) => mapBackendReservationToFrontend(row ?? {}, buildClassesById()))
      : [],
    raw: payload ?? {},
  }
}

export async function marcarNoAsistioApi(id) {
  const payload = await httpPost(ENDPOINTS.marcarNoAsistio(id), {})
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function completarReservaApi(id) {
  const payload = await httpPost(ENDPOINTS.completarReserva(id), {})
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}
