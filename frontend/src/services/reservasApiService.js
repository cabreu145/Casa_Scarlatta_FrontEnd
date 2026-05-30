import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import {
  mapBackendReservationToFrontend,
  mapBackendReservationsToFrontend,
  mapCreateReservationPayload,
} from '@/adapters/reservationAdapter'
import { useClasesStore } from '@/stores/clasesStore'

function buildClassesById() {
  const clases = useClasesStore.getState().clases ?? []
  return Object.fromEntries(clases.map((c) => [c.id, c]))
}

export async function getMisReservasApi() {
  const payload = await httpGet(ENDPOINTS.reservasMe)
  return mapBackendReservationsToFrontend(Array.isArray(payload) ? payload : [], buildClassesById())
}

export async function getReservaByIdApi(id) {
  const payload = await httpGet(ENDPOINTS.reservaById(id))
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function crearReservaApi({ claseId, userId, asiento, occurrenceId }) {
  const requestPayload = mapCreateReservationPayload({ claseId, userId, asiento, occurrenceId })
  const payload = await httpPost(ENDPOINTS.crearReserva, requestPayload)
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function cancelarReservaApi(id) {
  const payload = await httpPost(ENDPOINTS.cancelarReserva(id), {})
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function marcarNoAsistioApi(id) {
  const payload = await httpPost(ENDPOINTS.marcarNoAsistio(id), {})
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}

export async function completarReservaApi(id) {
  const payload = await httpPost(ENDPOINTS.completarReserva(id), {})
  return mapBackendReservationToFrontend(payload ?? {}, buildClassesById())
}
