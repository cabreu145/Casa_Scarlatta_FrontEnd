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

  test('mapCreateReservationPayload crea contrato backend con spot_id y hold_id', () => {
    const payload = mapCreateReservationPayload({
      claseId: 12,
      userId: 7,
      occurrenceId: 22,
      spotId: 8,
      holdId: 123,
    })
    expect(payload).toEqual({
      clase_id: 12,
      user_id: 7,
      occurrence_id: 22,
      spot_id: 8,
      hold_id: 123,
    })
  })

  test('mapCreateReservationPayload crea contrato backend multi con spot_ids y hold_ids', () => {
    const payload = mapCreateReservationPayload({
      claseId: 12,
      userId: 7,
      occurrenceId: 22,
      spotIds: [8, 9],
      holdIds: [123, 124],
    })
    expect(payload).toEqual({
      clase_id: 12,
      user_id: 7,
      occurrence_id: 22,
      spot_ids: [8, 9],
      hold_ids: [123, 124],
    })
  })

  test('mapCreateReservationPayload exige hold cuando se usa spot_id', () => {
    expect(() => mapCreateReservationPayload({
      claseId: 12,
      userId: 7,
      occurrenceId: 22,
      spotId: 8,
    })).toThrow('HOLD_REQUIRED')
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
        coach_avatar_url: '/media/coaches/demo.png',
      },
      {}
    )

    expect(mapped.occurrenceId).toBe(33)
    expect(mapped.claseNombre).toBe('Clase Demo Reservable API')
    expect(mapped.coachAvatarUrl).toContain('/media/coaches/demo.png')
    expect(mapped.classStartTime).toBe('09:00')
    expect(mapped.displayTime).toBe('09:00')
    expect(mapped.displayDate).toBe('Fecha por definir')
    expect(mapped.classStatus).toBe('programada')
  })

  test('prioriza coach de reserva/occurrence sobre coach de clase base', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        id: 101,
        class_id: 3,
        occurrence_id: 33,
        coach_id: 9,
        coach_name: 'Mali',
        coach_avatar_url: '/media/coaches/mali.png',
      },
      {
        3: {
          coachId: 1,
          coachNombre: 'Coach anterior',
          coachAvatarUrl: '/media/coaches/anterior.png',
        },
      }
    )

    expect(mapped.coachId).toBe(9)
    expect(mapped.coachNombre).toBe('Mali')
    expect(mapped.coachAvatarUrl).toContain('/media/coaches/mali.png')
  })

  test('deriva discipline desde class_name cuando backend no manda discipline canónico', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        id: 102,
        user_id: 9,
        class_id: 4,
        occurrence_id: 44,
        status: 'confirmada',
        class_name: 'STRYDE X - COMMUNITY',
      },
      {}
    )

    expect(mapped.discipline).toBe('stryde')
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
    expect(mapped.displayDate).toMatch(/30|may/i)
  })

  test('usa occurrence_date cuando backend no manda class_date ni class_start_at', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        id: 103,
        user_id: 9,
        class_id: 4,
        occurrence_id: 45,
        occurrence_date: '2026-06-22',
        status: 'confirmada',
        class_name: 'STRYDE X - COMMUNITY',
      },
      {}
    )

    expect(mapped.occurrenceDate).toBe('2026-06-22')
    expect(mapped.classDate).toBe('2026-06-22')
    expect(mapped.fechaSesion).toBe('2026-06-22')
    expect(mapped.fecha).toBe('2026-06-22')
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

  test('mapea reservation_id, spot_label y equipment label en respuesta multi', () => {
    const mapped = mapBackendReservationToFrontend(
      {
        reservation_id: 30,
        user_id: 7,
        class_id: 2,
        occurrence_id: 22,
        status: 'confirmada',
        spot_label: '03',
        spot_equipment_type: 'treadmill',
      },
      {}
    )

    expect(mapped.id).toBe(30)
    expect(mapped.spotLabel).toBe('03')
    expect(mapped.equipmentLabel).toBe('Caminadora')
  })
})

