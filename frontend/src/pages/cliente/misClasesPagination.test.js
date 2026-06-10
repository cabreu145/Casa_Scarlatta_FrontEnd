import { describe, expect, test } from 'vitest'
import { buildMisClasesApiFilters } from './misClasesPagination'

describe('buildMisClasesApiFilters', () => {
  const weekDays = [
    { isoDate: '2026-06-01' },
    { isoDate: '2026-06-02' },
    { isoDate: '2026-06-07' },
  ]

  test('all no envía status', () => {
    const result = buildMisClasesApiFilters('all', weekDays)
    expect(result).toEqual({
      status: undefined,
      from: '2026-06-01',
      to: '2026-06-07',
    })
  })

  test('confirmada envía status', () => {
    const result = buildMisClasesApiFilters('confirmada', weekDays)
    expect(result.status).toBe('confirmada')
    expect(result.from).toBe('2026-06-01')
    expect(result.to).toBe('2026-06-07')
  })
})
