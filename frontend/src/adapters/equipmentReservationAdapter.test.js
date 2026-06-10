import { describe, expect, test } from 'vitest'
import {
  mapEquipmentSpotToFrontend,
  mapOccurrenceSpotsResponseToFrontend,
  mapSpotHoldResponseToFrontend,
} from './equipmentReservationAdapter'
import { buildSpotLookup, getEquipmentSpotKey } from '@/features/reservas/equipmentLayoutConfig'

describe('equipmentReservationAdapter', () => {
  test('adapta spot backend real', () => {
    const mapped = mapEquipmentSpotToFrontend({
      spot_id: 1,
      label: '01',
      equipment_type: 'bench',
      row: 1,
      col: 2,
      x: 10,
      y: 20,
      status: 'available',
      held_until: null,
      held_by_me: false,
      reservation_id: null,
    })

    expect(mapped).toEqual({
      spotId: 1,
      label: '01',
      equipmentType: 'bench',
      row: 1,
      col: 2,
      x: 10,
      y: 20,
      status: 'available',
      heldUntil: null,
      heldByMe: false,
      reservationId: null,
      raw: expect.any(Object),
    })
  })

  test('tolera nulls y labels repetidos por type', () => {
    const bench = mapEquipmentSpotToFrontend({ spot_id: 1, label: '01', equipment_type: 'bench' })
    const treadmill = mapEquipmentSpotToFrontend({ spot_id: 10, label: '01', equipment_type: 'treadmill' })

    expect(getEquipmentSpotKey(bench)).toBe('bench:01')
    expect(getEquipmentSpotKey(treadmill)).toBe('treadmill:01')
    expect(bench.label).toBe('01')
    expect(treadmill.label).toBe('01')
  })

  test('adapta respuesta occurrence + hold', () => {
    const mapped = mapOccurrenceSpotsResponseToFrontend({
      occurrence_id: 5,
      discipline: 'stryde',
      class_name: 'Clase Demo',
      coach_name: 'Coach Demo',
      occurrence_date: '2026-06-05',
      start_at: '2026-06-05T16:00:00',
      end_at: '2026-06-05T16:50:00',
      server_now: '2026-06-03T02:30:00',
      spots: [{ spot_id: 1, label: '01', equipment_type: 'bench', status: 'available' }],
    })

    expect(mapped.occurrenceId).toBe(5)
    expect(mapped.spots).toHaveLength(1)
    expect(mapped.spots[0].spotId).toBe(1)
  })

  test('adapta hold backend', () => {
    expect(mapSpotHoldResponseToFrontend({
      hold_id: 123,
      occurrence_id: 5,
      spot_id: 1,
      status: 'held',
      expires_at: '2026-06-03T02:35:00',
      server_now: '2026-06-03T02:30:00',
    })).toEqual({
      holdId: 123,
      occurrenceId: 5,
      spotId: 1,
      status: 'held',
      expiresAt: '2026-06-03T02:35:00',
      serverNow: '2026-06-03T02:30:00',
      raw: expect.any(Object),
    })
  })

  test('buildSpotLookup no deduplica por label', () => {
    const lookup = buildSpotLookup([
      { spotId: 1, equipmentType: 'bench', label: '01' },
      { spotId: 10, equipmentType: 'treadmill', label: '01' },
    ])

    expect(lookup.get('bench:01').spotId).toBe(1)
    expect(lookup.get('treadmill:01').spotId).toBe(10)
  })
})
