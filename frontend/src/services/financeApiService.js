import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import {
  mapBackendFinanceCategoriesToFrontend,
  mapBackendFinanceDaySummaryToFrontend,
  mapBackendFinanceKpisToFrontend,
  mapBackendLowStockToFrontend,
  mapBackendRecentFinanceSalesToFrontend,
} from '@/adapters/financeAdapter'

const inFlight = {
  kpis: new Map(),
  day: new Map(),
  categories: new Map(),
  lowStock: new Map(),
  recentSales: new Map(),
}

const MAX_LIMIT = 100

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
