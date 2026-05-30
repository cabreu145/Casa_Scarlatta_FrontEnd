import { describe, expect, test } from 'vitest'
import {
  mapBackendWaitlistEntryToFrontend,
  mapBackendWaitlistListToFrontend,
  mapJoinWaitlistPayload,
} from './waitlistAdapter'

describe('waitlistAdapter', () => {
  test('mapea entry backend a frontend con occurrence', () => {
    const mapped = mapBackendWaitlistEntryToFrontend({
      id: 10,
      class_id: 7,
      occurrence_id: 77,
      user_id: 5,
      position: 2,
      status: 'esperando',
      joined_at: '2026-05-29T10:00:00Z',
    })
    expect(mapped).toMatchObject({
      id: 10,
      claseId: 7,
      occurrenceId: 77,
      userId: 5,
      posicion: 2,
      estado: 'esperando',
      fechaIngreso: '2026-05-29T10:00:00Z',
    })
  })

  test('mapea lista backend a lista frontend', () => {
    const mapped = mapBackendWaitlistListToFrontend({
      class_id: 9,
      occurrence_id: 99,
      entries: [{ id: 1, class_id: 9, occurrence_id: 99, user_id: 2, position: 1 }],
    })
    expect(mapped.classId).toBe(9)
    expect(mapped.occurrenceId).toBe(99)
    expect(mapped.entries).toHaveLength(1)
    expect(mapped.entries[0].occurrenceId).toBe(99)
  })

  test('arma payload join por occurrence_id', () => {
    expect(mapJoinWaitlistPayload({ occurrenceId: 44, userId: 8 })).toEqual({
      occurrence_id: 44,
      user_id: 8,
    })
  })
})

