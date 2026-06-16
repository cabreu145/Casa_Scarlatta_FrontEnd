import { describe, expect, test } from 'vitest'
import { mapBackendActivityResponseToFrontend, mapBackendActivityToFrontend } from './activityAdapter'

describe('activityAdapter', () => {
  test('mapea snake_case a camelCase', () => {
    const row = mapBackendActivityToFrontend({
      id: 36,
      category: 'cancelaciones',
      action: 'cancel_reservation',
      title: 'Actividad de cancelaciones',
      description: 'Se cancelo una reserva',
      actor_id: 3,
      actor_name: 'Cliente Demo',
      actor_role: 'cliente',
      entity_type: 'reservation',
      entity_id: 6,
      entity_label: 'Reserva #6 · Cliente Demo',
      summary: 'Cliente Demo canceló su reserva.',
      metadata_display: [
        { key: 'target_user_id', label: 'Cliente', value: 'Cliente Demo', id: 3 },
      ],
      metadata: { reservation_id: 6 },
      created_at: '2026-06-09T19:52:07.371772',
    })

    expect(row.actorId).toBe(3)
    expect(row.actorName).toBe('Cliente Demo')
    expect(row.actorRole).toBe('cliente')
    expect(row.entityType).toBe('reservation')
    expect(row.entityId).toBe(6)
    expect(row.entityLabel).toBe('Reserva #6 · Cliente Demo')
    expect(row.summary).toBe('Cliente Demo canceló su reserva.')
    expect(row.metadataDisplay).toEqual([
      { key: 'target_user_id', label: 'Cliente', value: 'Cliente Demo', id: 3 },
    ])
    expect(row.metadata).toEqual({ reservation_id: 6 })
    expect(row.createdAt).toBe('2026-06-09T19:52:07.371772')
  })

  test('soporta metadata null y items vacios', () => {
    const response = mapBackendActivityResponseToFrontend({
      page: 1,
      page_size: 20,
      total: 0,
      items: [],
    })

    expect(response.items).toEqual([])
    expect(response.total).toBe(0)
  })

  test('soporta entity_type null y metadata vacia', () => {
    const row = mapBackendActivityToFrontend({
      category: 'sistema',
      title: 'Evento',
      description: 'Descripcion',
      entity_type: null,
      entity_id: null,
      metadata: null,
      created_at: '2026-06-09T19:52:07.371772',
    })

    expect(row.entityType).toBeNull()
    expect(row.entityId).toBeNull()
    expect(row.entityLabel).toBeNull()
    expect(row.summary).toBeNull()
    expect(row.metadataDisplay).toEqual([])
    expect(row.metadata).toBeNull()
  })
})

