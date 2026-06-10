function toIntegerOrUndefined(value) {
  const n = Number(value)
  return Number.isInteger(n) ? n : undefined
}

export const COACHES_SELECTOR_PAGE_SIZE = 100

export function normalizeAdminCoachStatusFilter(status) {
  const raw = String(status ?? '').trim().toLowerCase()
  if (!raw || raw === 'todos') return undefined
  if (raw === 'active' || raw === 'activo' || raw === 'activos') return 'active'
  if (raw === 'inactive' || raw === 'inactivo' || raw === 'inactivos') return 'inactive'
  return raw
}

export function buildAdminCoachesApiQuery({
  page = 1,
  pageSize = COACHES_SELECTOR_PAGE_SIZE,
  search,
  status,
} = {}) {
  return {
    page,
    pageSize,
    search: String(search ?? '').trim() || undefined,
    status: normalizeAdminCoachStatusFilter(status),
  }
}

export function normalizeCoachId(value) {
  return toIntegerOrUndefined(value)
}
