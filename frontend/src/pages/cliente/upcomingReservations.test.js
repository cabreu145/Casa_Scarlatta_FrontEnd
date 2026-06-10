import { describe, expect, test } from 'vitest'
import {
  buildUpcomingReservationDateTime,
  getUpcomingReservations,
} from './upcomingReservations'

describe('upcomingReservations', () => {
  test('incluye solo confirmadas futuras/hoy y ordena ascendente', () => {
    const now = new Date('2026-05-30T09:00:00')
    const reservas = [
      { id: 1, estado: 'confirmada', classDate: '2026-05-30', classStartTime: '10:00' },
      { id: 2, estado: 'cancelada', classDate: '2026-05-30', classStartTime: '11:00' },
      { id: 3, estado: 'confirmada', classDate: '2026-05-31', classStartTime: '08:00' },
      { id: 4, estado: 'completada', classDate: '2026-06-01', classStartTime: '07:00' },
    ]

    const result = getUpcomingReservations(reservas, {
      useApiReservations: true,
      now,
      getOccurrenceDate: (r) => r.classDate,
    })

    expect(result.total).toBe(2)
    expect(result.items.map((r) => r.id)).toEqual([1, 3])
  })

  test('excluye reservas sin fecha real de sesión en API mode', () => {
    const now = new Date('2026-05-30T09:00:00')
    const reservas = [
      { id: 1, estado: 'confirmada', reservedAt: '2026-05-30T07:00:00' },
      { id: 2, estado: 'confirmada', classDate: '2026-05-30', classStartTime: '10:00' },
    ]

    const result = getUpcomingReservations(reservas, {
      useApiReservations: true,
      now,
      getOccurrenceDate: (r) => r.classDate ?? null,
    })

    expect(result.items.map((r) => r.id)).toEqual([2])
  })

  test('no muta arreglo original y aplica límite configurable', () => {
    const now = new Date('2026-05-30T09:00:00')
    const reservas = [
      { id: 1, estado: 'confirmada', classDate: '2026-05-30', classStartTime: '10:00' },
      { id: 2, estado: 'confirmada', classDate: '2026-05-30', classStartTime: '11:00' },
      { id: 3, estado: 'confirmada', classDate: '2026-05-30', classStartTime: '12:00' },
    ]
    const snapshot = JSON.parse(JSON.stringify(reservas))

    const result = getUpcomingReservations(reservas, {
      useApiReservations: true,
      now,
      limit: 2,
      getOccurrenceDate: (r) => r.classDate,
    })

    expect(result.total).toBe(3)
    expect(result.items).toHaveLength(2)
    expect(reservas).toEqual(snapshot)
  })

  test('buildUpcomingReservationDateTime no usa reserved_at como fecha de sesión', () => {
    const parsed = buildUpcomingReservationDateTime(
      { estado: 'confirmada', reservedAt: '2026-05-30T10:00:00' },
      { useApiReservations: true, getOccurrenceDate: () => null },
    )
    expect(parsed).toBeNull()
  })
})
