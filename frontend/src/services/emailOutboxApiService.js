import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import { mapBackendEmailOutboxResponseToFrontend, mapBackendEmailOutboxToFrontend } from '@/adapters/emailOutboxAdapter'

function buildUrl(endpoint, query = {}) {
  const url = new URL(endpoint)
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    url.searchParams.set(key, String(value))
  })
  return `${url.origin}${url.pathname}${url.search}`
}

export async function getEmailOutboxApi({ page = 1, pageSize = 20, status } = {}) {
  const url = buildUrl(ENDPOINTS.emailOutbox, {
    page,
    page_size: pageSize,
    status,
  })
  return mapBackendEmailOutboxResponseToFrontend(await httpGet(url))
}

export async function retryEmailOutboxApi(id) {
  return mapBackendEmailOutboxToFrontend(await httpPost(ENDPOINTS.emailOutboxRetryById(id), {}))
}
