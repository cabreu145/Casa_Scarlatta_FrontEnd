import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  mapBackendProductToFrontend,
  mapBackendSaleToFrontend,
  resolvePublicTicketImageUrl,
} from '@/adapters/posAdapter'
import {
  buildPosProductApiPayload,
  buildPosSaleApiPayload,
  validatePosProductApiPayload,
  validatePosSaleApiPayload,
} from '@/pages/admin/posApiPayload'
import { buildAdminProductsApiQuery, ADMIN_PRODUCTS_PAGE_SIZE } from '@/pages/admin/adminProductsApiUtils'

const inFlightProducts = new Map()
const inFlightSales = new Map()
const MAX_PAGE_SIZE = 100

function normalizePageSize(value, fallback) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function getItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export async function getProductsApi({
  page = 1,
  pageSize = ADMIN_PRODUCTS_PAGE_SIZE,
  search,
  category,
  status,
} = {}) {
  if (!ENDPOINTS.productosPaginated || !ENDPOINTS.productos) {
    throw new Error('POS_PRODUCTS_ENDPOINT_MISSING')
  }
  const query = buildAdminProductsApiQuery({ page, pageSize, search, category, status })
  const cacheKey = JSON.stringify(query)
  if (inFlightProducts.has(cacheKey)) return inFlightProducts.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(ENDPOINTS.productosPaginated(query))
    return normalizePaginatedResponse(payload, mapBackendProductToFrontend)
  })()
  inFlightProducts.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightProducts.delete(cacheKey)
  }
}

export async function createProductApi(form = {}) {
  if (!ENDPOINTS.productos) {
    throw new Error('POS_PRODUCTS_ENDPOINT_MISSING')
  }
  const payload = buildPosProductApiPayload(form)
  const validationError = validatePosProductApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendProductToFrontend(await httpPost(ENDPOINTS.productos, payload))
}

export async function updateProductApi(productId, form = {}) {
  if (!ENDPOINTS.productoById) {
    throw new Error('POS_PRODUCTS_ENDPOINT_MISSING')
  }
  const payload = buildPosProductApiPayload(form)
  const validationError = validatePosProductApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendProductToFrontend(await httpPut(ENDPOINTS.productoById(productId), payload))
}

export async function updateProductStatusApi(productId, status) {
  if (!ENDPOINTS.productoStatusById) {
    throw new Error('POS_PRODUCTS_ENDPOINT_MISSING')
  }
  return mapBackendProductToFrontend(
    await httpPatch(ENDPOINTS.productoStatusById(productId), { status: String(status ?? 'active').trim().toLowerCase() })
  )
}

export async function deleteProductApi(productId) {
  if (!ENDPOINTS.productoDeleteById) {
    throw new Error('POS_PRODUCTS_ENDPOINT_MISSING')
  }
  const response = await httpDelete(ENDPOINTS.productoDeleteById(productId))
  return response ?? { success: true, id: productId }
}

export async function createSaleApi(form = {}) {
  if (!ENDPOINTS.ventas) {
    throw new Error('POS_SALES_ENDPOINT_MISSING')
  }
  const payload = buildPosSaleApiPayload(form)
  const validationError = validatePosSaleApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendSaleToFrontend(await httpPost(ENDPOINTS.ventas, payload))
}

export async function getSalesApi({
  page = 1,
  pageSize = 10,
  from,
  to,
  paymentMethod,
  status,
} = {}) {
  if (!ENDPOINTS.ventasPaginated) {
    throw new Error('POS_SALES_ENDPOINT_MISSING')
  }
  const query = {
    page,
    pageSize: normalizePageSize(pageSize, 10),
    from,
    to,
    paymentMethod,
    status,
  }
  const cacheKey = JSON.stringify(query)
  if (inFlightSales.has(cacheKey)) return inFlightSales.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(ENDPOINTS.ventasPaginated(query))
    return normalizePaginatedResponse(payload, mapBackendSaleToFrontend)
  })()
  inFlightSales.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightSales.delete(cacheKey)
  }
}

export async function getSaleByIdApi(saleId) {
  if (!ENDPOINTS.ventaById) {
    throw new Error('POS_SALES_ENDPOINT_MISSING')
  }
  return mapBackendSaleToFrontend(await httpGet(ENDPOINTS.ventaById(saleId)))
}

export async function getSaleTicketApi(saleId) {
  if (!ENDPOINTS.ventaTicket) {
    throw new Error('POS_SALES_ENDPOINT_MISSING')
  }
  return httpGet(ENDPOINTS.ventaTicket(saleId))
}

export function getSaleTicketPdfUrl(saleId) {
  return ENDPOINTS.ventaTicketPdf(saleId)
}

export function getPublicTicketUrl(token) {
  return ENDPOINTS.publicTicketByToken(token)
}

export function getPublicTicketImageUrl(token) {
  return ENDPOINTS.publicTicketImageByToken ? ENDPOINTS.publicTicketImageByToken(token) : null
}

export function getSalePublicImageUrl(sale) {
  return resolvePublicTicketImageUrl(sale)
}
