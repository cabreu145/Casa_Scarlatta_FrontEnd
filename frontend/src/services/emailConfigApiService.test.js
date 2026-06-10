import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
  httpPut: (...args) => httpPut(...args),
}))

describe('emailConfigApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
  })

  it('carga configuración', async () => {
    httpGet.mockResolvedValueOnce({
      email_enabled: true,
      from_address: 'contacto@casascarlatta.mx',
      smtp_password_set: true,
    })

    const { getEmailConfigApi } = await import('./emailConfigApiService')
    const result = await getEmailConfigApi()

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('/api/v1/configuracion/email'))
    expect(result.emailEnabled).toBe(true)
    expect(result.smtpPasswordSet).toBe(true)
  })

  it('actualiza configuración sin passwords vacíos', async () => {
    httpPut.mockResolvedValueOnce({ email_enabled: true, smtp_password_set: true })
    const { updateEmailConfigApi } = await import('./emailConfigApiService')

    await updateEmailConfigApi({
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

    expect(httpPut).toHaveBeenCalledWith(expect.stringContaining('/api/v1/configuracion/email'), expect.objectContaining({
      email_enabled: true,
      smtp_use_ssl: true,
      smtp_use_tls: false,
    }))
    expect(httpPut.mock.calls[0][1]).not.toHaveProperty('smtp_password')
    expect(httpPut.mock.calls[0][1]).not.toHaveProperty('imap_password')
    expect(httpPut.mock.calls[0][1]).not.toHaveProperty('pop3_password')
  })

  it('envía test email', async () => {
    httpPost.mockResolvedValueOnce({ status: 'sent' })
    const { sendTestEmailApi } = await import('./emailConfigApiService')

    await sendTestEmailApi({ toEmail: 'prueba@demo.local' })

    expect(httpPost).toHaveBeenCalledWith(expect.stringContaining('/api/v1/email/test'), { to_email: 'prueba@demo.local' })
  })
})
