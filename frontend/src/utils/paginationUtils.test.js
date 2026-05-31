import { describe, expect, test } from 'vitest'
import { clampPage, getTotalPages, paginateArray } from './paginationUtils'

describe('paginationUtils', () => {
  test('getTotalPages calcula correctamente', () => {
    expect(getTotalPages(0, 10)).toBe(1)
    expect(getTotalPages(25, 10)).toBe(3)
  })

  test('clampPage controla límites', () => {
    expect(clampPage(0, 4)).toBe(1)
    expect(clampPage(6, 4)).toBe(4)
    expect(clampPage(2, 4)).toBe(2)
  })

  test('paginateArray devuelve página correcta y no muta arreglo original', () => {
    const original = [1, 2, 3, 4, 5]
    const snapshot = [...original]
    const result = paginateArray(original, { page: 2, pageSize: 2 })
    expect(result.items).toEqual([3, 4])
    expect(result.totalItems).toBe(5)
    expect(result.totalPages).toBe(3)
    expect(original).toEqual(snapshot)
  })

  test('paginateArray tolera null/undefined', () => {
    const result = paginateArray(null, { page: -1, pageSize: 0 })
    expect(result.items).toEqual([])
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })
})
