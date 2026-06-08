import { describe, expect, test } from 'vitest'
import {
  buildAdminClasesApiQuery,
  normalizeAdminClassCoachFilter,
  normalizeAdminClassStatusFilter,
} from './adminClassesApiUtils'

describe('adminClassesApiUtils', () => {
  test('status UI activa se traduce a programada', () => {
    expect(normalizeAdminClassStatusFilter('activa')).toBe('programada')
    expect(normalizeAdminClassStatusFilter('programada')).toBe('programada')
    expect(normalizeAdminClassStatusFilter('cancelada')).toBe('cancelada')
  })

  test('coach filter rechaza ids mock no numéricos', () => {
    expect(normalizeAdminClassCoachFilter('coach-1')).toBeUndefined()
    expect(normalizeAdminClassCoachFilter(7)).toBe(7)
  })

  test('buildAdminClasesApiQuery normaliza search, status y coachId', () => {
    expect(
      buildAdminClasesApiQuery({
        page: 1,
        pageSize: 12,
        search: '  demo ',
        discipline: 'slow',
        status: 'activa',
        coachId: 'coach-1',
      })
    ).toEqual({
      page: 1,
      pageSize: 12,
      search: 'demo',
      discipline: 'slow',
      status: 'programada',
      coachId: undefined,
    })
  })
})
