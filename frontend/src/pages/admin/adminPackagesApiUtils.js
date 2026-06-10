export const ADMIN_PACKAGES_PAGE_SIZE = 20
export const ADMIN_PACKAGES_MAX_PAGE_SIZE = 100

export function normalizeAdminPackagesPageSize(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return ADMIN_PACKAGES_PAGE_SIZE
  return Math.min(parsed, ADMIN_PACKAGES_MAX_PAGE_SIZE)
}

export function buildAdminPackagesApiQuery({ page = 1, pageSize = ADMIN_PACKAGES_PAGE_SIZE, search, status } = {}) {
  const normalizedStatus = String(status ?? 'all').trim().toLowerCase()
  return {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizeAdminPackagesPageSize(pageSize),
    search: String(search ?? '').trim() || undefined,
    status: normalizedStatus === 'all' ? undefined : normalizedStatus,
  }
}
