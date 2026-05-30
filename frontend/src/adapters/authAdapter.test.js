import { describe, expect, test } from 'vitest'
import {
  mapAuthPayloadToSession,
  mapBackendUserToFrontendUser,
  mapRegisterRequestToApiPayload,
} from './authAdapter'

describe('authAdapter register mapping', () => {
  test('registro minimo', () => {
    const payload = mapRegisterRequestToApiPayload({
      email: 'ana@test.com',
      nombre: 'Ana Perez',
      password: 'secret123',
    })

    expect(payload).toEqual({
      email: 'ana@test.com',
      name: 'Ana Perez',
      password: 'secret123',
    })
  })

  test('registro extendido desde campos frontend', () => {
    const payload = mapRegisterRequestToApiPayload({
      email: 'ana@test.com',
      nombre: 'Ana Perez',
      password: 'secret123',
      telefono: '5512345678',
      fechaNacimiento: '1998-01-01',
      genero: 'Mujer',
    })

    expect(payload).toEqual({
      email: 'ana@test.com',
      name: 'Ana Perez',
      password: 'secret123',
      phone: '5512345678',
      birth_date: '1998-01-01',
      gender: 'femenino',
    })
  })

  test('registro extendido desde campos backend', () => {
    const payload = mapRegisterRequestToApiPayload({
      email: 'ana@test.com',
      name: 'Ana Perez',
      password: 'secret123',
      phone: '5512345678',
      birth_date: '1998-01-01',
      gender: 'prefiero_no_decir',
    })

    expect(payload).toEqual({
      email: 'ana@test.com',
      name: 'Ana Perez',
      password: 'secret123',
      phone: '5512345678',
      birth_date: '1998-01-01',
      gender: 'prefiero_no_decir',
    })
  })

  test('/auth/me mapea phone, birthDate, gender', () => {
    const user = mapBackendUserToFrontendUser({
      id: 10,
      email: 'ana@test.com',
      name: 'Ana Perez',
      role: 'cliente',
      is_active: true,
      phone: '5512345678',
      birthDate: '1998-01-01',
      gender: 'masculino',
    })

    expect(user).toMatchObject({
      id: 10,
      nombre: 'Ana Perez',
      telefono: '5512345678',
      phone: '5512345678',
      fechaNacimiento: '1998-01-01',
      birthDate: '1998-01-01',
      genero: 'masculino',
      gender: 'masculino',
    })
  })

  test('mapAuthPayloadToSession maps user_data response', () => {
    const session = mapAuthPayloadToSession({
      access_token: 'token-x',
      user_data: {
        id: 10,
        email: 'ana@test.com',
        name: 'Ana Perez',
        role: 'cliente',
        is_active: true,
      },
    })

    expect(session.token).toBe('token-x')
    expect(session.user).toMatchObject({
      id: 10,
      nombre: 'Ana Perez',
      rol: 'cliente',
      email: 'ana@test.com',
    })
  })
})
