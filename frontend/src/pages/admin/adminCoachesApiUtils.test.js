import { describe, expect, test } from 'vitest'
import { buildAdminCoachesApiQuery, normalizeAdminCoachStatusFilter, normalizeCoachId } from './adminCoachesApiUtils'

describe('adminCoachesApiUtils', () => {
  test('normaliza status y coach id', () => {
    expect(normalizeAdminCoachStatusFilter('Todos')).toBeUndefined()
    expect(normalizeAdminCoachStatusFilter('activo')).toBe('active')
    expect(normalizeAdminCoachStatusFilter('inactive')).toBe('inactive')
    expect(normalizeCoachId('7')).toBe(7)
    expect(normalizeCoachId('coach-7')).toBeUndefined()
  })

  test('build query normaliza filtros', () => {
    expect(buildAdminCoachesApiQuery({
      page: 2,
      pageSize: 25,
      search: '  demo ',
      status: 'Activos',
    })).toEqual({
      page: 2,
      pageSize: 25,
      search: 'demo',
      status: 'active',
    })
  })

  test('build query usa page size seguro por defecto', () => {
    expect(buildAdminCoachesApiQuery()).toEqual({
      page: 1,
      pageSize: 100,
      search: undefined,
      status: undefined,
    })
  })
})
