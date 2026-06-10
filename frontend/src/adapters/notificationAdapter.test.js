import { describe, expect, it } from 'vitest'
import {
  mapBackendNotificationToFrontend,
  mapBackendNotificationsResponseToFrontend,
  mapBackendUnreadCountToFrontend,
} from './notificationAdapter'

describe('notificationAdapter', () => {
  it('mapea item backend', () => {
    const mapped = mapBackendNotificationToFrontend({
      id: 10,
      title: 'Nueva reserva',
      message: 'Se registró una reserva',
      category: 'reservas',
      entity_type: 'reservation',
      entity_id: 6,
      read_at: '2026-06-09T10:00:00-06:00',
      created_at: '2026-06-09T09:00:00-06:00',
      metadata: { reservation_id: 6 },
    })

    expect(mapped.entityType).toBe('reservation')
    expect(mapped.entityId).toBe(6)
    expect(mapped.createdAt).toBe('2026-06-09T09:00:00-06:00')
    expect(mapped.metadata).toEqual({ reservation_id: 6 })
  })

  it('mapea response paginada y unread count', () => {
    const mapped = mapBackendNotificationsResponseToFrontend({
      page: 1,
      page_size: 10,
      total: 1,
      unread_count: 3,
      items: [{ id: 1, title: 'Hola' }],
    })

    expect(mapped.items).toHaveLength(1)
    expect(mapped.unreadCount).toBe(3)
  })

  it('mapea unread count standalone', () => {
    expect(mapBackendUnreadCountToFrontend({ unread_count: 4 })).toEqual({ unreadCount: 4 })
    expect(mapBackendUnreadCountToFrontend(2)).toEqual({ unreadCount: 2 })
  })
})
