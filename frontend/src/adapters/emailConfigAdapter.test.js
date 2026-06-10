import { describe, expect, it } from 'vitest'
import {
  mapBackendEmailConfigToFrontend,
  mapFrontendEmailConfigPayloadToBackend,
} from './emailConfigAdapter'

describe('emailConfigAdapter', () => {
  it('mapea response backend', () => {
    const mapped = mapBackendEmailConfigToFrontend({
      email_enabled: true,
      provider: 'SMTP',
      from_name: 'Casa Scarlatta',
      from_address: 'contacto@casascarlatta.mx',
      smtp_host: 'casascarlatta.mx',
      smtp_port: 465,
      smtp_username: 'contacto@casascarlatta.mx',
      smtp_use_ssl: true,
      smtp_use_tls: false,
      smtp_password_set: true,
      imap_password_set: false,
      pop3_password_set: true,
      updated_at: '2026-06-09T10:00:00-06:00',
    })

    expect(mapped.emailEnabled).toBe(true)
    expect(mapped.provider).toBe('SMTP')
    expect(mapped.smtpPasswordSet).toBe(true)
    expect(mapped.pop3PasswordSet).toBe(true)
    expect(mapped.updatedAt).toBe('2026-06-09T10:00:00-06:00')
  })

  it('omite passwords vacios en payload', () => {
    const payload = mapFrontendEmailConfigPayloadToBackend({
      emailEnabled: true,
      provider: 'SMTP',
      fromName: 'Casa Scarlatta',
      fromAddress: 'contacto@casascarlatta.mx',
      smtpHost: 'casascarlatta.mx',
      smtpPort: 465,
      smtpUsername: 'contacto@casascarlatta.mx',
      smtpPassword: '',
      smtpUseSsl: true,
      smtpUseTls: false,
      imapHost: 'casascarlatta.mx',
      imapPort: 993,
      imapUsername: 'contacto@casascarlatta.mx',
      imapPassword: '',
      imapUseSsl: true,
      pop3Host: 'casascarlatta.mx',
      pop3Port: 995,
      pop3Username: 'contacto@casascarlatta.mx',
      pop3Password: '',
      pop3UseSsl: true,
    })

    expect(payload).not.toHaveProperty('smtp_password')
    expect(payload).not.toHaveProperty('imap_password')
    expect(payload).not.toHaveProperty('pop3_password')
    expect(payload.smtp_use_ssl).toBe(true)
    expect(payload.smtp_use_tls).toBe(false)
  })
})
