import { describe, expect, test } from 'vitest'
import {
  mapBackendReservationToFrontend,
  mapBackendReservationsToFrontend,
  mapCreateReservationPayload,
} from './reservationAdapter'

describe('reservationAdapter', () => {
  test('mapCreateReservationPayload crea contrato backend con occurrence', () => {
    const payload = mapCreateReservationPayload({ claseId: 12, userId: 7, asiento: null, occurrenceId: 22 })
    expect(payload).toEqual({ clase_id: 12, user_id: 7, occurrence_id: 22 })
  })

  test('mapCreateReservationPayload exige occurrence', () => {
    expect(() => mapCreateReservationPayload({ claseId: 12, userId: 7, asiento: null })).toThrow('OCCURRENCE_REQUIRED')
  })

  test('preserva reserved_at como fechaCreacionReserva y no como fecha de sesion', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        id: 99,
        user_id: 7,
        class_id: 2,
        status: 'confirmada',
        reserved_at: '2026-05-28T10:00:00Z',
        class_date: null,
        class_start_at: null,
      },
      {}
    )

    expect(mapped.fechaCreacionReserva).toBe('2026-05-28')
    expect(mapped.fechaSesion).toBeNull()
    expect(mapped.fecha).toBeNull()
  })

  test('mapea occurrence_id y snapshots de clase', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        id: 100,
        user_id: 8,
        class_id: 3,
        occurrence_id: 33,
        status: 'confirmada',
        class_name: 'Clase Demo Reservable API',
        class_start_time: '09:00',
        class_status: 'programada',
      },
      {}
    )

    expect(mapped.occurrenceId).toBe(33)
    expect(mapped.claseNombre).toBe('Clase Demo Reservable API')
    expect(mapped.classStartTime).toBe('09:00')
    expect(mapped.classStatus).toBe('programada')
  })

  test('usa class_start_at para fecha de sesión cuando existe', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        id: 101,
        user_id: 9,
        class_id: 4,
        occurrence_id: 44,
        status: 'confirmada',
        class_start_at: '2026-05-30T09:00:00Z',
      },
      {}
    )

    expect(mapped.fechaSesion).toBe('2026-05-30')
    expect(mapped.fecha).toBe('2026-05-30')
  })

  test('mapBackendReservationsToFrontend transforma lista', () => {
    const result = mapBackendReservationsToFrontend(
      [{ id: 1, user_id: 3, class_id: 50, occurrence_id: 500, status: 'cancelada' }],
      {}
    )
    expect(result).toHaveLength(1)
    expect(result[0].occurrenceId).toBe(500)
    expect(result[0].claseNombre).toBe('Clase #50')
  })
})

