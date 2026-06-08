export const ADMIN_CLIENTS_PAGE_SIZE = 20
export const ADMIN_CLIENTS_MAX_PAGE_SIZE = 100

export function normalizeAdminClientsPageSize(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return ADMIN_CLIENTS_PAGE_SIZE
  return Math.min(parsed, ADMIN_CLIENTS_MAX_PAGE_SIZE)
}

export function buildAdminClientsApiQuery({
  page = 1,
  pageSize = ADMIN_CLIENTS_PAGE_SIZE,
  search,
  filter = 'Todos',
} = {}) {
  const normalizedFilter = String(filter ?? '').trim().toLowerCase()
  return {
    page: Math.max(1, Number(page) || 1),
    pageSize: normalizeAdminClientsPageSize(pageSize),
    search: String(search ?? '').trim() || undefined,
    status: normalizedFilter === 'activos' ? 'active' : undefined,
    membershipStatus: normalizedFilter === 'sin paquete'
      ? 'none'
      : normalizedFilter === 'por vencer'
        ? 'expired'
        : undefined,
  }
}
