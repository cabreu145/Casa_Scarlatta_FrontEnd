import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  mapBackendExpenseToFrontend,
  mapBackendExpensesToFrontend,
} from '@/adapters/expenseAdapter'
import { buildExpenseApiPayload, validateExpenseApiPayload } from '@/pages/admin/expenseApiPayload'

const inFlightList = new Map()
const MAX_PAGE_SIZE = 100

function resolveEndpoints() {
  const endpoints = {
    list: ENDPOINTS.gastosPaginated,
    detail: ENDPOINTS.gastoById,
    create: ENDPOINTS.gastos,
    update: ENDPOINTS.gastoById,
    cancel: ENDPOINTS.gastoCancelarById,
    remove: ENDPOINTS.gastoById,
  }

  if (
    typeof endpoints.list !== 'function' ||
    !endpoints.create ||
    typeof endpoints.detail !== 'function' ||
    typeof endpoints.update !== 'function' ||
    typeof endpoints.cancel !== 'function' ||
    typeof endpoints.remove !== 'function'
  ) {
    throw new Error('EXPENSES_ENDPOINT_MISSING')
  }

  return endpoints
}

function normalizePageSize(value, fallback) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, MAX_PAGE_SIZE)
}

export async function listExpenses({
  page = 1,
  pageSize = 20,
  from,
  to,
  category,
  status,
  paymentMethod,
} = {}) {
  const endpoints = resolveEndpoints()
  const query = {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizePageSize(pageSize, 20),
    from: String(from ?? '').trim() || undefined,
    to: String(to ?? '').trim() || undefined,
    category: String(category ?? '').trim() || undefined,
    status: String(status ?? '').trim() || undefined,
    paymentMethod: String(paymentMethod ?? '').trim() || undefined,
  }

  const cacheKey = JSON.stringify(query)
  if (inFlightList.has(cacheKey)) return inFlightList.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(endpoints.list(query))
    return normalizePaginatedResponse(payload, mapBackendExpenseToFrontend)
  })()

  inFlightList.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightList.delete(cacheKey)
  }
}

export async function getExpenseDetail(id) {
  const endpoints = resolveEndpoints()
  return mapBackendExpenseToFrontend(await httpGet(endpoints.detail(id)))
}

export async function createExpense(form = {}) {
  const endpoints = resolveEndpoints()
  const payload = buildExpenseApiPayload(form)
  const validationError = validateExpenseApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendExpenseToFrontend(await httpPost(endpoints.create, payload))
}

export async function updateExpense(id, form = {}) {
  const endpoints = resolveEndpoints()
  const payload = buildExpenseApiPayload(form)
  const validationError = validateExpenseApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendExpenseToFrontend(await httpPut(endpoints.update(id), payload))
}

export async function cancelExpense(id, reason = '') {
  const endpoints = resolveEndpoints()
  const payload = String(reason ?? '').trim()
    ? { reason: String(reason ?? '').trim() }
    : {}
  return mapBackendExpenseToFrontend(await httpPatch(endpoints.cancel(id), payload))
}

export async function deleteExpense(id) {
  const endpoints = resolveEndpoints()
  const response = await httpDelete(endpoints.remove(id))
  return response ?? { success: true, id }
}

export function mapBackendExpensesApiResponse(payload = {}) {
  if (Array.isArray(payload)) return mapBackendExpensesToFrontend(payload)
  if (Array.isArray(payload?.items)) {
    return {
      ...payload,
      items: mapBackendExpensesToFrontend(payload.items),
    }
  }
  return payload
}
