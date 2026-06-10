export const ADMIN_PRODUCTS_PAGE_SIZE = 20
export const ADMIN_PRODUCTS_MAX_PAGE_SIZE = 100

export function normalizeAdminProductsPageSize(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return ADMIN_PRODUCTS_PAGE_SIZE
  return Math.min(parsed, ADMIN_PRODUCTS_MAX_PAGE_SIZE)
}

export function buildAdminProductsApiQuery({
  page = 1,
  pageSize = ADMIN_PRODUCTS_PAGE_SIZE,
  search,
  category,
  status,
} = {}) {
  return {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizeAdminProductsPageSize(pageSize),
    search: String(search ?? '').trim() || undefined,
    category: String(category ?? '').trim() || undefined,
    status: String(status ?? '').trim() || undefined,
  }
}
