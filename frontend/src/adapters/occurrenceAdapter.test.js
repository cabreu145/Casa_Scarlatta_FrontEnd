import { describe, expect, test } from 'vitest'
import { mapBackendOccurrenceToFrontend, mapBackendOccurrencesToFrontend } from './occurrenceAdapter'

describe('occurrenceAdapter', () => {
  test('mapea campos backend a frontend', () => {
    const mapped = mapBackendOccurrenceToFrontend({
      id: 10,
      class_id: 5,
      occurrence_date: '2026-05-30',
      start_at: '2026-05-30T09:00:00-06:00',
      end_at: '2026-05-30T09:50:00-06:00',
      start_time: '09:00:00',
      capacity_max: 20,
      capacity_current: 3,
      coach_id: 9,
      status: 'programada',
      class_name: 'Stryde AM',
    })

    expect(mapped).toMatchObject({
      occurrenceId: 10,
      claseId: 5,
      fecha: '2026-05-30',
      displayDate: expect.any(String),
      cupoMax: 20,
      cupoActual: 3,
      cupoDisponible: 17,
      coachId: 9,
      estado: 'programada',
      claseNombre: 'Stryde AM',
      hora: '09:00',
      displayTime: '09:00',
    })
  })

  test('mapea lista', () => {
    const result = mapBackendOccurrencesToFrontend([{ id: 1 }, { id: 2 }])
    expect(result).toHaveLength(2)
    expect(result[0].occurrenceId).toBe(1)
  })
})

