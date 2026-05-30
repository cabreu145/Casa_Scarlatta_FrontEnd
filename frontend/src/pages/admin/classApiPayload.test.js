import { describe, expect, test } from 'vitest'
import { buildClaseApiPayload, resolveCoachIdByName } from './classApiPayload'

describe('classApiPayload', () => {
  test('resuelve coach_id canónico por nombre', () => {
    const coaches = [{ id: 3, nombre: 'Coach Demo' }]
    expect(resolveCoachIdByName(coaches, 'Coach Demo')).toBe(3)
  })

  test('build payload API usa coach_id y no coachNombre como identidad', () => {
    const payload = buildClaseApiPayload({
      form: { nombre: 'Clase 1', tipo: 'Stryde X', coach: 'Coach Demo', dia: 'Lunes', hora: '07:00', duracion: '50' },
      coaches: [{ id: 9, nombre: 'Coach Demo' }],
    })
    expect(payload.coach_id).toBe(9)
    expect(payload.name).toBe('Clase 1')
    expect(payload.start_time).toBe('07:00')
  })
})
