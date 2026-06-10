import { describe, expect, test } from 'vitest'
import { filterReservationsByStatus, normalizeReservationStatus } from './reservationFilters'

describe('reservationFilters', () => {
  const reservas = [
    { id: 1, estado: 'confirmada' },
    { id: 2, estado: 'cancelada' },
    { id: 3, estado: 'completada' },
    { id: 4, estado: 'no_asistio' },
    { id: 5, estado: 'confirmed' },
    { id: 6, estado: null },
  ]

  test('all devuelve todas', () => {
    expect(filterReservationsByStatus(reservas, 'all')).toHaveLength(6)
  })

  test('filtro confirmada devuelve confirmadas y legacy confirmed', () => {
    const result = filterReservationsByStatus(reservas, 'confirmada')
    expect(result.map((r) => r.id)).toEqual([1, 5])
  })

  test('filtro cancelada devuelve solo canceladas', () => {
    const result = filterReservationsByStatus(reservas, 'cancelada')
    expect(result.map((r) => r.id)).toEqual([2])
  })

  test('filtro completada devuelve solo completadas', () => {
    const result = filterReservationsByStatus(reservas, 'completada')
    expect(result.map((r) => r.id)).toEqual([3])
  })

  test('filtro no_asistio devuelve solo no_asistio', () => {
    const result = filterReservationsByStatus(reservas, 'no_asistio')
    expect(result.map((r) => r.id)).toEqual([4])
  })

  test('tolera estado faltante', () => {
    expect(normalizeReservationStatus(undefined)).toBeNull()
    expect(normalizeReservationStatus('')).toBeNull()
  })
})
