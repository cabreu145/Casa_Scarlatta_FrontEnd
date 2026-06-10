import { normalizePaginatedResponse } from './paginationAdapter'

function normalizeMetadata(value) {
  if (value === undefined || value === null) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'object') return { ...value }
  return value
}

export function mapBackendNotificationToFrontend(item = {}) {
  return {
    id: item.id ?? null,
    title: item.title ?? item.titulo ?? '',
    message: item.message ?? item.mensaje ?? item.description ?? '',
    category: item.category ?? item.categoria ?? 'sistema',
    entityType: item.entity_type ?? item.entityType ?? null,
    entityId: item.entity_id ?? item.entityId ?? null,
    read: Boolean(item.read ?? item.is_read ?? item.leida ?? false),
    readAt: item.read_at ?? item.readAt ?? null,
    createdAt: item.created_at ?? item.createdAt ?? null,
    actorName: item.actor_name ?? item.actorName ?? null,
    actorRole: item.actor_role ?? item.actorRole ?? null,
    metadata: normalizeMetadata(item.metadata ?? item.metadata_json ?? null),
  }
}

export function mapBackendNotificationsResponseToFrontend(payload = {}) {
  const normalized = normalizePaginatedResponse(payload, mapBackendNotificationToFrontend)
  return {
    ...normalized,
    unreadCount: Number(payload?.unread_count ?? payload?.unreadCount ?? 0) || 0,
  }
}

export function mapBackendUnreadCountToFrontend(payload = {}) {
  if (typeof payload === 'number') return { unreadCount: Number(payload) || 0 }
  return { unreadCount: Number(payload?.unread_count ?? payload?.unreadCount ?? 0) || 0 }
}
