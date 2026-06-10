import { normalizePaginatedResponse } from './paginationAdapter'

function normalizeMetadata(value) {
  if (value === undefined || value === null) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'object') return { ...value }
  return value
}

export function mapBackendEmailOutboxToFrontend(item = {}) {
  return {
    id: item.id ?? null,
    toEmail: item.to_email ?? item.toEmail ?? '',
    toName: item.to_name ?? item.toName ?? '',
    subject: item.subject ?? '',
    bodyText: item.body_text ?? item.bodyText ?? '',
    bodyHtml: item.body_html ?? item.bodyHtml ?? '',
    templateKey: item.template_key ?? item.templateKey ?? '',
    providerMessageId: item.provider_message_id ?? item.providerMessageId ?? '',
    status: item.status ?? 'pending',
    attempts: Number(item.attempts ?? 0) || 0,
    errorMessage: item.error_message ?? item.errorMessage ?? '',
    metadata: normalizeMetadata(item.metadata_json ?? item.metadata ?? null),
    lastAttemptAt: item.last_attempt_at ?? item.lastAttemptAt ?? null,
    sentAt: item.sent_at ?? item.sentAt ?? null,
    createdAt: item.created_at ?? item.createdAt ?? null,
  }
}

export function mapBackendEmailOutboxResponseToFrontend(payload = {}) {
  return normalizePaginatedResponse(payload, mapBackendEmailOutboxToFrontend)
}
