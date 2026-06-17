import { describe, expect, test } from 'vitest'
import {
  canReserveAnotherSpotInOccurrence,
  hasActiveReservationInOccurrenceForUser,
  isActiveReservationStatus,
  resolveLimitOneSpotPerOccurrence,
} from './reservationPolicy'

describe('reservationPolicy', () => {
  test('devuelve false si reservations está vacío', () => {
    expect(
      hasActiveReservationInOccurrenceForUser({
        userId: 26,
        occurrenceId: 100,
        reservations: [],
      })
    ).toBe(false)
  })

  test('normaliza limit_one_spot_per_occurrence snake_case', () => {
    expect(resolveLimitOneSpotPerOccurrence({ limit_one_spot_per_occurrence: true })).toBe(true)
  })

  test('normaliza limitOneSpotPerOccurrence camelCase', () => {
    expect(resolveLimitOneSpotPerOccurrence({ limitOneSpotPerOccurrence: true })).toBe(true)
  })

  test('default false si campo no viene', () => {
    expect(resolveLimitOneSpotPerOccurrence({})).toBe(false)
  })

  test('no usa créditos o nombre para bloquear segundo spot', () => {
    expect(
      canReserveAnotherSpotInOccurrence({
        isMapClass: true,
        hasActiveReservationInOccurrence: true,
        activeMembership: {
          creditsAvailable: 999,
          packageName: 'Plan ilimitado visual legacy',
        },
      })
    ).toBe(true)
  })

  test('detecta reserva activa solo en misma occurrence para usuario', () => {
    expect(
      hasActiveReservationInOccurrenceForUser({
        userId: 26,
        occurrenceId: 100,
        reservations: [
          { userId: 26, occurrenceId: 100, status: 'confirmada' },
          { userId: 26, occurrenceId: 101, status: 'confirmada' },
        ],
      })
    ).toBe(true)
  })

  test('no bloquea otra occurrence distinta para usuario restringido', () => {
    expect(
      hasActiveReservationInOccurrenceForUser({
        userId: 26,
        occurrenceId: 101,
        reservations: [
          { userId: 26, occurrenceId: 100, status: 'confirmada' },
        ],
      })
    ).toBe(false)
  })

  test('devuelve false si occurrence coincide pero userId es otro', () => {
    expect(
      hasActiveReservationInOccurrenceForUser({
        userId: 26,
        occurrenceId: 100,
        reservations: [
          { userId: 99, occurrenceId: 100, status: 'confirmada' },
        ],
      })
    ).toBe(false)
  })

  test('ignora reservas canceladas o completadas', () => {
    expect(isActiveReservationStatus('cancelada')).toBe(false)
    expect(isActiveReservationStatus('completada')).toBe(false)
    expect(isActiveReservationStatus('confirmada')).toBe(true)
    expect(
      hasActiveReservationInOccurrenceForUser({
        userId: 26,
        occurrenceId: 100,
        reservations: [
          { userId: 26, occurrenceId: 100, status: 'cancelada' },
        ],
      })
    ).toBe(false)
  })
})
