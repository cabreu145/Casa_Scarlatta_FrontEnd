const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

function toPositiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function getTotalPages(totalItems, pageSize = DEFAULT_PAGE_SIZE) {
  const total = Math.max(0, Number(totalItems) || 0)
  const size = toPositiveInt(pageSize, DEFAULT_PAGE_SIZE)
  return Math.max(1, Math.ceil(total / size))
}

export function clampPage(page, totalPages) {
  const current = toPositiveInt(page, DEFAULT_PAGE)
  const maxPages = toPositiveInt(totalPages, 1)
  return Math.min(Math.max(1, current), maxPages)
}

export function paginateArray(items, { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const source = Array.isArray(items) ? items : []
  const size = toPositiveInt(pageSize, DEFAULT_PAGE_SIZE)
  const totalItems = source.length
  const totalPages = getTotalPages(totalItems, size)
  const currentPage = clampPage(page, totalPages)
  const start = (currentPage - 1) * size
  const end = start + size
  return {
    items: source.slice(start, end),
    page: currentPage,
    pageSize: size,
    totalItems,
    totalPages,
  }
}
