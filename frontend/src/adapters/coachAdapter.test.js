import { describe, expect, test } from 'vitest'
import { mapBackendCoachToFrontend } from './coachAdapter'

describe('coachAdapter', () => {
  test('mapea id backend a coachId canónico', () => {
    const mapped = mapBackendCoachToFrontend({
      coach_id: 7,
      user_id: 11,
      name: 'Coach API',
      email: 'coach@test.com',
      phone: '5551234567',
      status: 'active',
      specialties: ['slow', 'stryde'],
      avatar_url: null,
      bio: 'Bio demo',
      instagram: '@coach',
      public_profile_enabled: true,
      primary_discipline: 'slow',
    })
    expect(mapped.id).toBe(7)
    expect(mapped.coachId).toBe(7)
    expect(mapped.userId).toBe(11)
    expect(mapped.nombre).toBe('Coach API')
    expect(mapped.specialties).toEqual(['slow', 'stryde'])
    expect(mapped.especialidad).toBe('Ambas')
    expect(mapped.primaryDiscipline).toBe('slow')
    expect(mapped.bio).toBe('Bio demo')
    expect(mapped.instagram).toBe('@coach')
    expect(mapped.publicProfileEnabled).toBe(true)
    expect(mapped.status).toBe('active')
    expect(mapped.activo).toBe(true)
  })
})
