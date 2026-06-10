import { describe, expect, it } from 'vitest'
import { buildClientApiPayload, validateClientApiPayload } from './clientApiPayload'

describe('clientApiPayload', () => {
  it('incluye password solo al crear', () => {
    const form = {
      nombre: ' Cliente ',
      email: ' cliente@demo.local ',
      telefono: ' 555 ',
      password: 'Password123',
      estado: 'activo',
      paquete: 'mock',
    }
    expect(buildClientApiPayload(form, { isCreate: true })).toEqual({
      name: 'Cliente',
      email: 'cliente@demo.local',
      phone: '555',
      status: 'active',
      password: 'Password123',
    })
    expect(buildClientApiPayload(form)).not.toHaveProperty('password')
  })

  it('valida password inicial', () => {
    const payload = buildClientApiPayload({ nombre: 'Cliente', email: 'a@b.com', password: '123' }, { isCreate: true })
    expect(validateClientApiPayload(payload, { isCreate: true })).toContain('8')
  })
})
