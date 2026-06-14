import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPost, httpPut } from '@/lib/http'
import {
  mapBackendAvailabilityToFrontend,
  mapBackendClassToFrontendClass,
  mapBackendClassesToFrontend,
} from '@/adapters/classAdapter'
import { mapBackendOccurrenceToFrontend } from '@/adapters/occurrenceAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import { buildAdminClasesApiQuery } from '@/pages/admin/adminClassesApiUtils'

function buildClassesEndpoint({ status } = {}) {
  const normalizedStatus = String(status ?? '').trim()
  if (!normalizedStatus) return ENDPOINTS.clasesList
  const separator = ENDPOINTS.clasesList.includes('?') ? '&' : '?'
  return `${ENDPOINTS.clasesList}${separator}status=${encodeURIComponent(normalizedStatus)}`
}

export async function getClasesApi({ status = 'programada' } = {}) {
  const payload = await httpGet(buildClassesEndpoint({ status }))
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []
  return mapBackendClassesToFrontend(items)
}

export async function getClasesPaginatedApi({ page = 1, pageSize = 20, search, discipline, status, coachId } = {}) {
  const query = buildAdminClasesApiQuery({ page, pageSize, search, discipline, status, coachId })
  const payload = await httpGet(ENDPOINTS.clasesPaginated({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    discipline: query.discipline,
    status: query.status,
    coach_id: query.coachId,
  }))
  return normalizePaginatedResponse(payload, (item) => mapBackendClassToFrontendClass(item ?? {}))
}

export async function getClaseByIdApi(id) {
  const payload = await httpGet(ENDPOINTS.claseById(id))
  return mapBackendClassToFrontendClass(payload ?? {})
}

export async function getDisponibilidadClaseApi(id) {
  const payload = await httpGet(ENDPOINTS.claseDisponibilidad(id))
  return mapBackendAvailabilityToFrontend(payload ?? {})
}

export async function createClaseApi(payload) {
  const response = await httpPost(ENDPOINTS.clases, payload)
  return mapBackendClassToFrontendClass(response ?? {})
}

export async function createClassOccurrenceApi(classId, payload) {
  const response = await httpPost(ENDPOINTS.claseOcurrenciasCreate(classId), payload)
  return mapBackendOccurrenceToFrontend(response ?? {})
}

export async function updateClaseApi(id, payload) {
  const response = await httpPut(ENDPOINTS.claseById(id), payload)
  return mapBackendClassToFrontendClass(response ?? {})
}

export async function deleteClaseApi(id) {
  const response = await httpDelete(ENDPOINTS.claseById(id))
  return response ?? { success: true, id }
}
