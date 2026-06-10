import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  mapBackendProductCategoryToFrontend,
  mapBackendProductCategoriesToFrontend,
} from '@/adapters/posCategoryAdapter'

const inFlightCategories = new Map()
const MAX_PAGE_SIZE = 100

function resolveCategoryEndpoints() {
  const endpoints = {
    list: ENDPOINTS.productCategoriesPaginated ?? ENDPOINTS.productoCategoriesPaginated,
    create: ENDPOINTS.productCategories ?? ENDPOINTS.productoCategories,
    update: ENDPOINTS.productCategoryById ?? ENDPOINTS.productoCategoryById,
    remove: ENDPOINTS.productCategoryById ?? ENDPOINTS.productoCategoryById,
    status: ENDPOINTS.productCategoryStatusById ?? ENDPOINTS.productoCategoryStatusById,
  }

  if (
    typeof endpoints.list !== 'function' ||
    !endpoints.create ||
    typeof endpoints.update !== 'function' ||
    typeof endpoints.remove !== 'function' ||
    typeof endpoints.status !== 'function'
  ) {
    throw new Error('POS_PRODUCT_CATEGORIES_API_NOT_CONFIGURED')
  }

  return endpoints
}

function normalizePageSize(value, fallback) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function normalizeActiveFlag(value, fallback = true) {
  if (typeof value === 'boolean') return value
  const raw = String(value ?? '').trim().toLowerCase()
  if (['active', 'activo', 'true', '1', 'si', 'sí', 'yes'].includes(raw)) return true
  if (['inactive', 'inactivo', 'false', '0', 'no', 'off'].includes(raw)) return false
  return fallback
}

function normalizeStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw || raw === 'all') return undefined
  return normalizeActiveFlag(raw, true) ? 'active' : 'inactive'
}

function buildCategoryPayload(form = {}) {
  const name = String(form.name ?? form.nombre ?? '').trim()
  const description = String(form.description ?? form.descripcion ?? '').trim()
  const isActive = normalizeActiveFlag(
    form.is_active ?? form.isActive ?? form.activo ?? form.status,
    true
  )

  return {
    name,
    description: description || null,
    is_active: isActive,
  }
}

function validateCategoryPayload(payload = {}) {
  if (!String(payload.name ?? '').trim()) return 'El nombre de la categoría es obligatorio.'
  if (typeof payload.is_active !== 'boolean') return 'Estado de categoría inválido.'
  return null
}

export async function getProductCategoriesApi({
  page = 1,
  pageSize = 20,
  search,
  status,
} = {}) {
  const endpoints = resolveCategoryEndpoints()
  const query = {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizePageSize(pageSize, 20),
    search: String(search ?? '').trim() || undefined,
    status: normalizeStatus(status),
  }
  const cacheKey = JSON.stringify(query)
  if (inFlightCategories.has(cacheKey)) return inFlightCategories.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(endpoints.list(query))
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
  const endpoints = resolveCategoryEndpoints()
  const payload = buildCategoryPayload(form)
  const validationError = validateCategoryPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendProductCategoryToFrontend(await httpPost(endpoints.create, payload))
}

export async function updateProductCategoryApi(categoryId, form = {}) {
  const endpoints = resolveCategoryEndpoints()
  const payload = buildCategoryPayload(form)
  const validationError = validateCategoryPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendProductCategoryToFrontend(await httpPut(endpoints.update(categoryId), payload))
}

export async function updateProductCategoryStatusApi(categoryId, isActive) {
  const endpoints = resolveCategoryEndpoints()
  return mapBackendProductCategoryToFrontend(
    await httpPatch(endpoints.status(categoryId), {
      is_active: normalizeActiveFlag(isActive, true),
    })
  )
}

export async function deleteProductCategoryApi(categoryId) {
  const endpoints = resolveCategoryEndpoints()
  const response = await httpDelete(endpoints.remove(categoryId))
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
