import { describe, expect, test } from 'vitest'
import { getMapCapacityByDiscipline, isMapDiscipline } from './classCapacity'

describe('classCapacity', () => {
  test('deriva cupo para stryde y slow', () => {
    expect(getMapCapacityByDiscipline('stryde')).toBe(15)
    expect(getMapCapacityByDiscipline('slow')).toBe(9)
  })

  test('identifica disciplinas de mapa', () => {
    expect(isMapDiscipline('stryde')).toBe(true)
    expect(isMapDiscipline('slow')).toBe(true)
    expect(isMapDiscipline('yoga')).toBe(false)
  })
})
