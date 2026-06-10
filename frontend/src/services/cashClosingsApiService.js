import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  mapBackendCashClosingToFrontend,
  mapBackendCashClosingsToFrontend,
} from '@/adapters/cashClosingAdapter'

const inFlightToday = new Map()
const inFlightList = new Map()
const MAX_PAGE_SIZE = 100

function resolveEndpoints() {
  const endpoints = {
    today: ENDPOINTS.cortesHoy,
    execute: ENDPOINTS.ejecutarCorte,
    list: ENDPOINTS.cortesPaginated,
    detail: ENDPOINTS.corteById,
  }

  if (
    !endpoints.today ||
    !endpoints.execute ||
    typeof endpoints.list !== 'function' ||
    typeof endpoints.detail !== 'function'
  ) {
    throw new Error('CASH_CLOSINGS_ENDPOINT_MISSING')
  }

  return endpoints
}

function normalizePageSize(value, fallback) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function buildExecutePayload(form = {}) {
  const payload = {}
  const date = String(form.date ?? form.fecha ?? '').trim()
  const notes = String(form.notes ?? form.notas ?? '').trim()
  if (date) payload.date = date
  if (notes) payload.notes = notes
  return payload
}

export async function getTodayCashClosingSummary() {
  const endpoints = resolveEndpoints()
  const cacheKey = 'today'
  if (inFlightToday.has(cacheKey)) return inFlightToday.get(cacheKey)

  const request = (async () => mapBackendCashClosingToFrontend(await httpGet(endpoints.today)))()
  inFlightToday.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightToday.delete(cacheKey)
  }
}

export async function executeCashClosing(form = {}) {
  const endpoints = resolveEndpoints()
  const payload = buildExecutePayload(form)
  return mapBackendCashClosingToFrontend(await httpPost(endpoints.execute, payload))
}

export async function listCashClosings({
  page = 1,
  pageSize = 20,
  from,
  to,
} = {}) {
  const endpoints = resolveEndpoints()
  const query = {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizePageSize(pageSize, 20),
    from: String(from ?? '').trim() || undefined,
    to: String(to ?? '').trim() || undefined,
  }
  const cacheKey = JSON.stringify(query)
  if (inFlightList.has(cacheKey)) return inFlightList.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(endpoints.list(query))
    return normalizePaginatedResponse(payload, mapBackendCashClosingToFrontend)
  })()

  inFlightList.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightList.delete(cacheKey)
  }
}

export async function getCashClosingDetail(id) {
  const endpoints = resolveEndpoints()
  return mapBackendCashClosingToFrontend(await httpGet(endpoints.detail(id)))
}
