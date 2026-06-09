import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpRequestRaw } from '@/lib/http'
import {
  mapBackendFinanceCategoriesToFrontend,
  mapBackendFinanceDaySummaryToFrontend,
  mapBackendFinanceKpisToFrontend,
  mapBackendLowStockToFrontend,
  mapBackendRecentFinanceSalesToFrontend,
} from '@/adapters/financeAdapter'
import { downloadBlob, getFilenameFromContentDisposition } from '@/utils/downloadCsv'

const inFlight = {
  kpis: new Map(),
  day: new Map(),
  categories: new Map(),
  lowStock: new Map(),
  recentSales: new Map(),
}

const MAX_LIMIT = 100
const EXPORT_TYPES = new Set(['summary', 'sales', 'expenses', 'cash_closings'])

function normalizeLimit(value, fallback = 10) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, MAX_LIMIT)
}

function dedupe(map, key, factory) {
  if (map.has(key)) return map.get(key)
  const request = (async () => {
    try {
      return await factory()
    } finally {
      map.delete(key)
    }
  })()
  map.set(key, request)
  return request
}

function fallbackCsvFilename(type, from, to) {
  return `finanzas-${type}-${from}_${to}.csv`
}

export async function getFinanceKpis(params = {}) {
  const query = {
    from: params.from || undefined,
    to: params.to || undefined,
  }
  const key = JSON.stringify(query)
  return dedupe(inFlight.kpis, key, async () =>
    mapBackendFinanceKpisToFrontend(await httpGet(ENDPOINTS.finanzasKpis(query)))
  )
}

export async function getFinanceDaySummary(date) {
  const query = { date: date || undefined }
  const key = JSON.stringify(query)
  return dedupe(inFlight.day, key, async () =>
    mapBackendFinanceDaySummaryToFrontend(await httpGet(ENDPOINTS.finanzasDia(query)))
  )
}

export async function getFinanceCategories(params = {}) {
  const query = {
    from: params.from || undefined,
    to: params.to || undefined,
  }
  const key = JSON.stringify(query)
  return dedupe(inFlight.categories, key, async () =>
    mapBackendFinanceCategoriesToFrontend(await httpGet(ENDPOINTS.finanzasCategorias(query)))
  )
}

export async function getLowStock(params = {}) {
  const query = {
    threshold: Number.isFinite(Number(params.threshold)) ? Number(params.threshold) : 5,
  }
  const key = JSON.stringify(query)
  return dedupe(inFlight.lowStock, key, async () =>
    mapBackendLowStockToFrontend(await httpGet(ENDPOINTS.finanzasStockBajo(query)))
  )
}

export async function getRecentFinanceSales(params = {}) {
  const query = {
    limit: normalizeLimit(params.limit, 10),
  }
  const key = JSON.stringify(query)
  return dedupe(inFlight.recentSales, key, async () =>
    mapBackendRecentFinanceSalesToFrontend(await httpGet(ENDPOINTS.finanzasVentasRecientes(query)))
  )
}

async function parseExportError(response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const payload = await response.json()
    const backendError = payload?.error ?? payload?.detail
    const message = backendError?.message ?? payload?.message ?? `Error HTTP ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.code = backendError?.code ?? backendError?.error ?? null
    error.details = backendError?.details ?? payload?.detail ?? null
    error.payload = payload
    throw error
  }
  const text = await response.text()
  const error = new Error(text || `Error HTTP ${response.status}`)
  error.status = response.status
  error.code = null
  error.payload = text
  throw error
}

export async function exportFinanceCsv({ from, to, type }) {
  if (!EXPORT_TYPES.has(type)) {
    throw new Error('FINANCE_EXPORT_TYPE_INVALID')
  }
  if (!from || !to) {
    throw new Error('FINANCE_EXPORT_RANGE_REQUIRED')
  }

  const response = await httpRequestRaw('GET', ENDPOINTS.finanzasExportar({ from, to, type }))
  if (!response.ok) {
    await parseExportError(response)
  }

  const blob = await response.blob()
  const filenameFromHeader = getFilenameFromContentDisposition(
    response.headers.get('content-disposition')
  )
  const filename = filenameFromHeader || fallbackCsvFilename(type, from, to)
  downloadBlob(blob, filename)
  return { filename }
}
