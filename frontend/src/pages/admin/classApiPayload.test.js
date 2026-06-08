import { describe, expect, test } from 'vitest'
import { buildClaseApiPayload, resolveApiClassStatus, resolveCoachIdByName } from './classApiPayload'

describe('classApiPayload', () => {
  test('resuelve coach_id canónico por nombre', () => {
    const coaches = [{ id: 3, nombre: 'Coach Demo' }]
    expect(resolveCoachIdByName(coaches, 'Coach Demo')).toBe(3)
  })

  test('build payload API usa coach_id y no coachNombre como identidad', () => {
    const payload = buildClaseApiPayload({
      form: { nombre: 'Clase 1', tipo: 'Stryde X', coach: 'Coach Demo', dia: 'Lunes', hora: '07:00', duracion: '50', status: 'activa' },
      coaches: [{ id: 9, nombre: 'Coach Demo' }],
    })
    expect(payload.coach_id).toBe(9)
    expect(payload.name).toBe('Clase 1')
    expect(payload.discipline).toBe('stryde')
    expect(payload.duration_minutes).toBe(50)
    expect(payload.status).toBe('programada')
    expect(payload.start_time).toBe('07:00')
  })

  test('build payload API traduce Slow y soporta coach_id/name alias', () => {
    const payload = buildClaseApiPayload({
      form: { nombre: 'Clase 2', tipo: 'Slow', coach: 'Coach API', duracion: '60', cupoMax: '10' },
      coaches: [{ coach_id: 12, name: 'Coach API' }],
    })
    expect(payload.coach_id).toBe(12)
    expect(payload.discipline).toBe('slow')
    expect(payload.capacity_max).toBe(10)
    expect(payload.duration_minutes).toBe(60)
  })

  test('resolveApiClassStatus traduce activa a programada', () => {
    expect(resolveApiClassStatus('activa')).toBe('programada')
    expect(resolveApiClassStatus('programada')).toBe('programada')
    expect(resolveApiClassStatus('cancelada')).toBe('cancelada')
  })

  test('resolveCoachIdByName rechaza ids mock no numéricos', () => {
    const coaches = [{ id: 'coach-1', nombre: 'Coach Demo' }]
    expect(resolveCoachIdByName(coaches, 'Coach Demo')).toBeNull()
  })
})
