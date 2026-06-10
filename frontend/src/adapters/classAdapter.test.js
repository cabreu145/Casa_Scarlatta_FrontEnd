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
      discipline: 'stryde',
      coach_id: 3,
      coach_avatar_url: '/media/coaches/demo.png',
      capacity_max: 20,
      capacity_current: 8,
      duration_minutes: 50,
      start_time: '07:00',
      start_at: '2026-06-02T07:00:00',
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
      startTime: '07:00',
      startAt: '2026-06-02T07:00:00',
      displayTime: '07:00',
      displayDate: expect.any(String),
      estado: 'programada',
      statusDisplay: 'activa',
      estadoDisplay: 'activa',
      coachNombre: 'Coach #3',
      coachAvatarUrl: '/media/coaches/demo.png',
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
      hora: null,
      displayTime: 'Horario por definir',
      displayDate: 'Fecha por definir',
      estado: 'programada',
      statusDisplay: 'activa',
    })
  })

  test('mapea Slow desde discipline y description', () => {
    const result = mapBackendClassToFrontendClass({
      id: 9,
      name: 'Slow Core',
      discipline: 'slow',
      duration_min: 60,
      description: 'Clase calma',
    })

    expect(result).toMatchObject({
      tipo: 'Slow',
      discipline: 'slow',
      duracion: 60,
      description: 'Clase calma',
      descripcion: 'Clase calma',
    })
  })

  test('mapea cancelada y finalizada a display correcto', () => {
    const cancelada = mapBackendClassToFrontendClass({ id: 1, name: 'Cancel', status: 'cancelada' })
    const finalizada = mapBackendClassToFrontendClass({ id: 2, name: 'Final', status: 'finalizada' })
    expect(cancelada.statusDisplay).toBe('cancelada')
    expect(finalizada.statusDisplay).toBe('finalizada')
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
