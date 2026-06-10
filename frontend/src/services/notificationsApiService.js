import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPatch } from '@/lib/http'
import {
  mapBackendNotificationToFrontend,
  mapBackendNotificationsResponseToFrontend,
  mapBackendUnreadCountToFrontend,
} from '@/adapters/notificationAdapter'

function buildUrl(endpoint, query = {}) {
  const url = new URL(endpoint)
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    url.searchParams.set(key, String(value))
  })
  return `${url.origin}${url.pathname}${url.search}`
}

export async function getNotificationsApi({ page = 1, pageSize = 20, unreadOnly, category } = {}) {
  const url = buildUrl(ENDPOINTS.notificaciones, {
    page,
    page_size: pageSize,
    unread_only: unreadOnly ? 'true' : undefined,
    category,
  })
  return mapBackendNotificationsResponseToFrontend(await httpGet(url))
}

export async function getUnreadNotificationsCountApi() {
  return mapBackendUnreadCountToFrontend(await httpGet(ENDPOINTS.notificacionesUnreadCount))
}

export async function markNotificationReadApi(id) {
  return mapBackendNotificationToFrontend(await httpPatch(ENDPOINTS.notificacionReadById(id), {}))
}

export async function markAllNotificationsReadApi() {
  return mapBackendNotificationsResponseToFrontend(await httpPatch(ENDPOINTS.notificacionesReadAll, {}))
}
