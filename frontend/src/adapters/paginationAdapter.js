const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

function toPositiveInt(value, fallback) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

export function normalizePaginatedResponse(payload, mapItem = (item) => item) {
  if (Array.isArray(payload)) {
    const items = payload.map((item) => mapItem(item))
    return {
      items,
      page: DEFAULT_PAGE,
      pageSize: items.length || DEFAULT_PAGE_SIZE,
      total: items.length,
      isPaginated: false,
    }
  }

  const source = payload ?? {}
  const rawItems = Array.isArray(source.items) ? source.items : []
  const items = rawItems.map((item) => mapItem(item))
  const pageSize = toPositiveInt(source.page_size ?? source.pageSize, DEFAULT_PAGE_SIZE)
  const total = Number.isFinite(Number(source.total)) ? Number(source.total) : items.length

  return {
    items,
    page: toPositiveInt(source.page, DEFAULT_PAGE),
    pageSize,
    total,
    isPaginated: Array.isArray(source.items),
  }
}
