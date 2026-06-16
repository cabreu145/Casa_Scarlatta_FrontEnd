import { normalizePaginatedResponse } from './paginationAdapter'

function normalizeMetadata(value) {
  if (value === undefined) return null
  if (value === null) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'object') return { ...value }
  return value
}

function normalizeMetadataDisplay(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      key: item.key ?? null,
      label: item.label ?? null,
      value: item.value ?? '',
      id: item.id ?? null,
    }))
}

export function mapBackendActivityToFrontend(item = {}) {
  return {
    id: item.id ?? null,
    category: item.category ?? 'sistema',
    action: item.action ?? null,
    title: item.title ?? '',
    description: item.description ?? '',
    actorId: item.actor_id ?? item.actorId ?? null,
    actorName: item.actor_name ?? item.actorName ?? null,
    actorRole: item.actor_role ?? item.actorRole ?? null,
    entityType: item.entity_type ?? item.entityType ?? null,
    entityId: item.entity_id ?? item.entityId ?? null,
    entityLabel: item.entity_label ?? item.entityLabel ?? null,
    summary: item.summary ?? null,
    metadataDisplay: normalizeMetadataDisplay(item.metadata_display ?? item.metadataDisplay ?? []),
    metadata: normalizeMetadata(item.metadata ?? null),
    createdAt: item.created_at ?? item.createdAt ?? null,
  }
}

export function mapBackendActivityResponseToFrontend(payload = {}) {
  return normalizePaginatedResponse(payload, mapBackendActivityToFrontend)
}

