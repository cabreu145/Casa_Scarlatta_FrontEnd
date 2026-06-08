import { describe, expect, test } from 'vitest'
import { getPublicClassesByDate, getReservationOccurrenceDate } from './classService'

describe('classService reservation occurrence', () => {
  test('retorna null cuando no hay fecha de ocurrencia', () => {
    const occurrence = getReservationOccurrenceDate({
      claseId: 10,
      classStartAt: null,
      classDate: null,
      fecha: null,
    })
    expect(occurrence).toBeNull()
  })

  test('prioriza classDate', () => {
    const occurrence = getReservationOccurrenceDate({
      classDate: '2026-05-30',
      classStartAt: '2026-05-29T09:00:00Z',
    })
    expect(occurrence).toBe('2026-05-30')
  })

  test('usa classStartAt cuando classDate no existe', () => {
    const occurrence = getReservationOccurrenceDate({
      classStartAt: '2026-05-30T09:00:00Z',
    })
    expect(occurrence).toBe('2026-05-30')
  })

  test('getPublicClassesByDate ordena por hora derivada', () => {
    const result = getPublicClassesByDate([
      { id: 1, dia: 'Lunes', hora: null, startAt: '2026-06-02T11:00:00' },
      { id: 2, dia: 'Lunes', start_time: '09:00' },
    ], new Date('2026-06-01T12:00:00'))

    expect(result.map((item) => item.id)).toEqual([2, 1])
  })
})
