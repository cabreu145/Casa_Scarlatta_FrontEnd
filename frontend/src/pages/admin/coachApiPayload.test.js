import { describe, expect, test } from 'vitest'
import { buildCoachApiPayload, validateCoachApiPayload } from './coachApiPayload'

describe('coachApiPayload', () => {
  test('mapea fields admin a payload backend', () => {
    const payload = buildCoachApiPayload({
      nombre: 'Coach Demo',
      email: 'coach@demo.local',
      telefono: '5551234567',
      estado: 'activo',
      disciplina: 'Ambas',
      bio: 'Bio',
      instagram: ' https://instagram.com/demo ',
      avatar_url: ' https://cdn.example.com/coach.png ',
      public_profile_enabled: 'true',
      password: 'secret123',
    }, { isCreate: true })

    expect(payload).toEqual({
      name: 'Coach Demo',
      email: 'coach@demo.local',
      phone: '5551234567',
      status: 'active',
      specialties: ['slow', 'stryde'],
      bio: 'Bio',
      instagram: 'https://instagram.com/demo',
      avatar_url: 'https://cdn.example.com/coach.png',
      public_profile_enabled: true,
      password: 'secret123',
    })
  })

  test('valida payload incompleto', () => {
    expect(validateCoachApiPayload({ name: '', email: '', status: 'active', specialties: [] }, { isCreate: true }))
      .toContain('nombre')
    expect(validateCoachApiPayload({ name: 'Coach', email: '', status: 'active', specialties: [] }, { isCreate: true }))
      .toContain('email')
    expect(validateCoachApiPayload({ name: 'Coach', email: 'a@b.com', status: 'bad', specialties: [] }, { isCreate: true }))
      .toContain('Estado')
    expect(validateCoachApiPayload({ name: 'Coach', email: 'a@b.com', status: 'active', specialties: ['slow'], password: '' }, { isCreate: true }))
      .toContain('contraseña')
  })

  test('update no incluye password', () => {
    const payload = buildCoachApiPayload({
      nombre: 'Coach Edit',
      email: 'edit@demo.local',
      telefono: '5551234567',
      estado: 'inactivo',
      disciplina: 'Slow',
      password: 'should-not-send',
      public_profile_enabled: false,
    }, { isCreate: false })

    expect(payload).toEqual({
      name: 'Coach Edit',
      email: 'edit@demo.local',
      phone: '5551234567',
      status: 'inactive',
      specialties: ['slow'],
      bio: '',
      instagram: null,
      avatar_url: null,
      public_profile_enabled: false,
    })
    expect(Object.prototype.hasOwnProperty.call(payload, 'password')).toBe(false)
  })
})
