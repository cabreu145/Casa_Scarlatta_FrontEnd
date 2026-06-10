import { describe, expect, it } from 'vitest'
import {
  mapBackendEmailOutboxResponseToFrontend,
  mapBackendEmailOutboxToFrontend,
} from './emailOutboxAdapter'

describe('emailOutboxAdapter', () => {
  it('mapea item backend', () => {
    const mapped = mapBackendEmailOutboxToFrontend({
      id: 7,
      to_email: 'cliente@demo.local',
      to_name: 'Cliente Demo',
      subject: 'Prueba',
      template_key: 'welcome',
      provider_message_id: 'msg-1',
      status: 'skipped',
      attempts: 2,
      error_message: 'EMAIL_ENABLED=false',
      metadata: { skipped: true },
      last_attempt_at: '2026-06-09T10:00:00-06:00',
      sent_at: null,
      created_at: '2026-06-09T09:00:00-06:00',
    })

    expect(mapped.toEmail).toBe('cliente@demo.local')
    expect(mapped.status).toBe('skipped')
    expect(mapped.errorMessage).toBe('EMAIL_ENABLED=false')
    expect(mapped.metadata).toEqual({ skipped: true })
  })

  it('mapea response paginada', () => {
    const mapped = mapBackendEmailOutboxResponseToFrontend({
      page: 1,
      page_size: 10,
      total: 1,
      items: [{ id: 1, to_email: 'a@b.com' }],
    })

    expect(mapped.items).toHaveLength(1)
    expect(mapped.total).toBe(1)
  })
})
