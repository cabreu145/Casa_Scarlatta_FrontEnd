import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  mapBackendCashClosingToFrontend,
  normalizeCashClosing,
} from '@/adapters/cashClosingAdapter'

const inFlightToday = new Map()
const inFlightList = new Map()
const inFlightSummary = new Map()
const MAX_PAGE_SIZE = 100

function resolveEndpoints() {
  const endpoints = {
    today: ENDPOINTS.cortesHoy,
    execute: ENDPOINTS.ejecutarCorte,
    list: ENDPOINTS.cortesPaginated,
    detail: ENDPOINTS.corteById,
    resumen: ENDPOINTS.cortesResumen,
    apertura: ENDPOINTS.cortesApertura,
  }

  if (
    !endpoints.today ||
    !endpoints.execute ||
    !endpoints.apertura ||
    typeof endpoints.list !== 'function' ||
    typeof endpoints.detail !== 'function' ||
    typeof endpoints.resumen !== 'function'
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
  const shiftKey = String(form.shiftKey ?? form.shift_key ?? '').trim()
  const countedCash = form.counted_cash_mxn ?? form.countedCashMxn
  const notes = String(form.notes ?? form.notas ?? '').trim()
  const responsibleName = String(form.responsibleName ?? form.responsible_name ?? '').trim()
  if (date) payload.date = date
  if (shiftKey) payload.shiftKey = shiftKey
  if (countedCash !== undefined && countedCash !== null) payload.counted_cash_mxn = Number(countedCash)
  if (notes) payload.notes = notes
  if (responsibleName) payload.responsibleName = responsibleName
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

export async function getCashShiftSummary({ date, shiftKey } = {}) {
  const endpoints = resolveEndpoints()
  const cacheKey = `${date}|${shiftKey}`
  if (inFlightSummary.has(cacheKey)) return inFlightSummary.get(cacheKey)

  const request = (async () => normalizeCashClosing(await httpGet(endpoints.resumen({ date, shiftKey }))))()
  inFlightSummary.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightSummary.delete(cacheKey)
  }
}

export async function openCashShift({ date, shiftKey, opening_cash_mxn, notes, responsibleName } = {}) {
  const endpoints = resolveEndpoints()
  const payload = { date, shiftKey }
  if (opening_cash_mxn !== undefined) payload.opening_cash_mxn = Number(opening_cash_mxn)
  const trimmedNotes = String(notes ?? '').trim()
  if (trimmedNotes) payload.notes = trimmedNotes
  const trimmedName = String(responsibleName ?? '').trim()
  if (trimmedName) payload.responsibleName = trimmedName
  return normalizeCashClosing(await httpPost(endpoints.apertura, payload))
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
  shiftKey,
} = {}) {
  const endpoints = resolveEndpoints()
  const query = {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizePageSize(pageSize, 20),
    from: String(from ?? '').trim() || undefined,
    to: String(to ?? '').trim() || undefined,
    shiftKey: String(shiftKey ?? '').trim() || undefined,
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
