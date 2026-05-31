import { describe, expect, test } from 'vitest'
import { normalizePaginatedResponse } from './paginationAdapter'

describe('paginationAdapter', () => {
  test('normaliza array legacy', () => {
    const result = normalizePaginatedResponse([{ id: 1 }, { id: 2 }], (x) => ({ ...x, ok: true }))
    expect(result.isPaginated).toBe(false)
    expect(result.total).toBe(2)
    expect(result.items[0].ok).toBe(true)
  })

  test('normaliza respuesta paginada', () => {
    const result = normalizePaginatedResponse(
      { page: 2, page_size: 10, total: 25, items: [{ id: 11 }] },
      (x) => ({ ...x, mapped: true })
    )
    expect(result.isPaginated).toBe(true)
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
    expect(result.total).toBe(25)
    expect(result.items[0].mapped).toBe(true)
  })
})
