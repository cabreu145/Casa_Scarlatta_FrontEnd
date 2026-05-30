import { describe, expect, test } from 'vitest'
import { getReservationOccurrenceDate } from './classService'

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
})
