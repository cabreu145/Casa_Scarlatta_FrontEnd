import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { mapBackendCoachesToFrontend } from '@/adapters/coachAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import { buildAdminCoachesApiQuery, COACHES_SELECTOR_PAGE_SIZE } from '@/pages/admin/adminCoachesApiUtils'

const inFlightPaginatedCoaches = new Map()

export async function getCoachesApi() {
  const payload = await httpGet(ENDPOINTS.coaches)
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []
  return mapBackendCoachesToFrontend(items)
}

export async function getPublicCoachesApi() {
  const payload = await httpGet(ENDPOINTS.publicCoaches)
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []
  return mapBackendCoachesToFrontend(items)
}

export async function getCoachesPaginatedApi({ page = 1, pageSize = COACHES_SELECTOR_PAGE_SIZE, search, status } = {}) {
  const query = buildAdminCoachesApiQuery({ page, pageSize, search, status })
  const cacheKey = JSON.stringify({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search ?? '',
    status: query.status ?? '',
  })
  if (inFlightPaginatedCoaches.has(cacheKey)) {
    return inFlightPaginatedCoaches.get(cacheKey)
  }

  const request = (async () => {
    const payload = await httpGet(ENDPOINTS.coachesPaginated({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
    }))
    return normalizePaginatedResponse(payload, (item) => mapBackendCoachesToFrontend([item ?? {}])[0])
  })()

  inFlightPaginatedCoaches.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightPaginatedCoaches.delete(cacheKey)
  }
}

export async function createCoachApi(payload) {
  const response = await httpPost(ENDPOINTS.coaches, payload)
  return mapBackendCoachesToFrontend([response ?? {}])[0]
}

export async function updateCoachApi(id, payload) {
  const response = await httpPut(ENDPOINTS.coachById(id), payload)
  return mapBackendCoachesToFrontend([response ?? {}])[0]
}

export async function updateCoachStatusApi(id, status) {
  const response = await httpPatch(ENDPOINTS.coachStatusById(id), { status })
  return mapBackendCoachesToFrontend([response ?? {}])[0]
}

export async function deleteCoachApi(id) {
  const response = await httpDelete(ENDPOINTS.coachById(id))
  return response ?? { success: true, id }
}

export async function uploadCoachAvatarApi(coachId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await httpPost(ENDPOINTS.uploadCoachAvatar(coachId), formData)
  return mapBackendCoachesToFrontend([response ?? {}])[0]
}
