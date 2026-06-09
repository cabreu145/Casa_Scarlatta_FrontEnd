import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  mapBackendProductCategoryToFrontend,
  mapBackendProductCategoriesToFrontend,
} from '@/adapters/posCategoryAdapter'

const inFlightCategories = new Map()
const MAX_PAGE_SIZE = 100

function normalizePageSize(value, fallback) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function normalizeStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'inactive' || raw === 'inactivo') return 'inactive'
  if (raw === 'all') return undefined
  return raw || undefined
}

function buildCategoryPayload(form = {}) {
  const name = String(form.name ?? form.nombre ?? '').trim()
  const description = String(form.description ?? form.descripcion ?? '').trim()
  const status = normalizeStatus(form.status ?? form.estado ?? 'active') || 'active'
  return {
    name,
    description: description || null,
    status,
  }
}

function validateCategoryPayload(payload = {}) {
  if (!String(payload.name ?? '').trim()) return 'El nombre de la categoría es obligatorio.'
  if (!['active', 'inactive'].includes(String(payload.status ?? '').trim().toLowerCase())) {
    return 'Estado de categoría inválido.'
  }
  return null
}

export async function getProductCategoriesApi({
  page = 1,
  pageSize = 20,
  search,
  status,
} = {}) {
  if (!ENDPOINTS.productoCategoriesPaginated || !ENDPOINTS.productoCategories) {
    throw new Error('POS_PRODUCT_CATEGORIES_ENDPOINT_MISSING')
  }
  const query = {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizePageSize(pageSize, 20),
    search: String(search ?? '').trim() || undefined,
    status: normalizeStatus(status),
  }
  const cacheKey = JSON.stringify(query)
  if (inFlightCategories.has(cacheKey)) return inFlightCategories.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(ENDPOINTS.productoCategoriesPaginated(query))
    return normalizePaginatedResponse(payload, mapBackendProductCategoryToFrontend)
  })()

  inFlightCategories.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightCategories.delete(cacheKey)
  }
}

export async function createProductCategoryApi(form = {}) {
  if (!ENDPOINTS.productoCategories) throw new Error('POS_PRODUCT_CATEGORIES_ENDPOINT_MISSING')
  const payload = buildCategoryPayload(form)
  const validationError = validateCategoryPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendProductCategoryToFrontend(await httpPost(ENDPOINTS.productoCategories, payload))
}

export async function updateProductCategoryApi(categoryId, form = {}) {
  if (!ENDPOINTS.productCategoryById) throw new Error('POS_PRODUCT_CATEGORIES_ENDPOINT_MISSING')
  const payload = buildCategoryPayload(form)
  const validationError = validateCategoryPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendProductCategoryToFrontend(await httpPut(ENDPOINTS.productCategoryById(categoryId), payload))
}

export async function updateProductCategoryStatusApi(categoryId, status) {
  if (!ENDPOINTS.productCategoryStatusById) throw new Error('POS_PRODUCT_CATEGORIES_ENDPOINT_MISSING')
  const normalized = normalizeStatus(status) || 'active'
  return mapBackendProductCategoryToFrontend(
    await httpPatch(ENDPOINTS.productCategoryStatusById(categoryId), { status: normalized })
  )
}

export async function deleteProductCategoryApi(categoryId) {
  if (!ENDPOINTS.productCategoryById) throw new Error('POS_PRODUCT_CATEGORIES_ENDPOINT_MISSING')
  const response = await httpDelete(ENDPOINTS.productCategoryById(categoryId))
  return response ?? { success: true, id: categoryId }
}

export function buildProductCategoryApiPayload(form = {}) {
  return buildCategoryPayload(form)
}

export function validateProductCategoryApiPayload(payload = {}) {
  return validateCategoryPayload(payload)
}

export function mapBackendProductCategoriesApiResponse(payload = {}) {
  if (Array.isArray(payload)) return mapBackendProductCategoriesToFrontend(payload)
  if (Array.isArray(payload?.items)) {
    return {
      ...payload,
      items: mapBackendProductCategoriesToFrontend(payload.items),
    }
  }
  return payload
}
