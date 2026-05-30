import { describe, expect, test } from 'vitest'
import {
  mapBackendAvailabilityToFrontend,
  mapBackendClassToFrontendClass,
  mapBackendClassesToFrontend,
} from './classAdapter'

describe('classAdapter', () => {
  test('mapBackendClassToFrontendClass mapea contrato base', () => {
    const result = mapBackendClassToFrontendClass({
      id: 5,
      name: 'Stryde AM',
      coach_id: 3,
      capacity_max: 20,
      capacity_current: 8,
      duration_min: 50,
      start_time: '07:00',
      status: 'programada',
      cupo_disponible: 12,
    })

    expect(result).toMatchObject({
      id: 5,
      nombre: 'Stryde AM',
      coachId: 3,
      cupoMax: 20,
      cupoActual: 8,
      cupoDisponible: 12,
      duracion: 50,
      hora: '07:00',
      estado: 'programada',
      coachNombre: 'Coach #3',
    })
  })

  test('tolera campos faltantes sin romper UI', () => {
    const result = mapBackendClassToFrontendClass({ id: 1, name: 'Clase X' })
    expect(result).toMatchObject({
      id: 1,
      nombre: 'Clase X',
      tipo: 'Stryde X',
      cupoMax: 0,
      cupoActual: 0,
      duracion: 50,
      hora: '08:00',
      estado: 'programada',
    })
  })

  test('mapBackendClassesToFrontend transforma arreglo', () => {
    const list = mapBackendClassesToFrontend([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    expect(list).toHaveLength(2)
    expect(list[0].nombre).toBe('A')
    expect(list[1].nombre).toBe('B')
  })

  test('mapBackendAvailabilityToFrontend mapea disponibilidad', () => {
    const result = mapBackendAvailabilityToFrontend({
      class_id: 9,
      capacity_max: 14,
      capacity_current: 11,
      cupo_disponible: 3,
    })
    expect(result).toEqual({
      classId: 9,
      cupoMax: 14,
      cupoActual: 11,
      cupoDisponible: 3,
    })
  })
})
