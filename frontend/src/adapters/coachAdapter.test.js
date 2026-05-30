import { describe, expect, test } from 'vitest'
import { mapBackendCoachToFrontend } from './coachAdapter'

describe('coachAdapter', () => {
  test('mapea id backend a coachId canónico', () => {
    const mapped = mapBackendCoachToFrontend({ id: 7, name: 'Coach API', email: 'coach@test.com' })
    expect(mapped.id).toBe(7)
    expect(mapped.coachId).toBe(7)
    expect(mapped.nombre).toBe('Coach API')
  })
})
