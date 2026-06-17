import { describe, expect, test } from 'vitest'
import {
  canReserveAnotherSpotInOccurrence,
  resolveLimitOneSpotPerOccurrence,
} from './reservationPolicy'

describe('reservationPolicy', () => {
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
})
