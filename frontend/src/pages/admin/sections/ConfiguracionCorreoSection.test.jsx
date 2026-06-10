import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const updateMutateAsync = vi.fn()
const testMutateAsync = vi.fn()
const retryMutateAsync = vi.fn()
const toastError = vi.fn()
const toastSuccess = vi.fn()
const toastInfo = vi.fn()

const configQueryState = {
  data: {
    emailEnabled: true,
    provider: 'smtp',
    fromName: 'Casa Scarlatta',
    fromAddress: 'contacto@casascarlatta.mx',
    smtpHost: 'casascarlatta.mx',
    smtpPort: 465,
    smtpUsername: 'contacto@casascarlatta.mx',
    smtpUseSsl: true,
    smtpUseTls: false,
    smtpPasswordSet: true,
    imapHost: 'casascarlatta.mx',
    imapPort: 993,
    imapUsername: 'contacto@casascarlatta.mx',
    imapUseSsl: true,
    imapPasswordSet: true,
    pop3Host: 'casascarlatta.mx',
    pop3Port: 995,
    pop3Username: 'contacto@casascarlatta.mx',
    pop3UseSsl: true,
    pop3PasswordSet: true,
  },
  isLoading: false,
  isFetching: false,
  error: null,
}

const outboxQueryState = {
  data: {
    page: 1,
    pageSize: 10,
    total: 1,
    items: [
      {
        id: 1,
        toEmail: 'cliente@demo.local',
        toName: 'Cliente Demo',
        subject: 'Prueba',
        templateKey: 'welcome',
        status: 'failed',
        attempts: 2,
        errorMessage: 'SMTP error',
        createdAt: '2026-06-09T10:00:00',
      },
    ],
  },
  isLoading: false,
  isFetching: false,
  error: null,
}

vi.mock('react-hot-toast', () => ({
  default: Object.assign((...args) => toastInfo(...args), {
    success: (...args) => toastSuccess(...args),
    error: (...args) => toastError(...args),
  }),
  success: (...args) => toastSuccess(...args),
  error: (...args) => toastError(...args),
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useEmailConfigQuery: () => configQueryState,
  useUpdateEmailConfigMutation: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useSendTestEmailMutation: () => ({ mutateAsync: testMutateAsync, isPending: false }),
  useEmailOutboxQuery: () => outboxQueryState,
  useRetryEmailOutboxMutation: () => ({ mutateAsync: retryMutateAsync, isPending: false }),
}))

async function renderSection() {
  vi.stubEnv('VITE_USE_API_AUTH', 'true')
  vi.resetModules()
  const { default: ConfiguracionCorreoSection } = await import('./ConfiguracionCorreoSection')
  return render(<ConfiguracionCorreoSection />)
}

describe('ConfiguracionCorreoSection', () => {
  beforeEach(() => {
    updateMutateAsync.mockReset()
    testMutateAsync.mockReset()
    retryMutateAsync.mockReset()
    toastError.mockReset()
    toastSuccess.mockReset()
    toastInfo.mockReset()
  })

  test('muestra solo SMTP y oculta IMAP POP3', async () => {
    await renderSection()

    expect(screen.getByText('Configuración de correo')).toBeInTheDocument()
    expect(screen.getByText('Proveedor de Email')).toBeInTheDocument()
    expect(screen.getByText('Configuración SMTP')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gmail' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outlook' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Servidor propio' })).toBeInTheDocument()
    expect(screen.queryByText('IMAP host')).not.toBeInTheDocument()
    expect(screen.queryByText('POP3 host')).not.toBeInTheDocument()
  })

  test('preset servidor propio llena smtp casa scarlatta', async () => {
    const user = userEvent.setup()
    await renderSection()

    await user.click(screen.getByRole('button', { name: 'Servidor propio' }))

    expect(screen.getByDisplayValue('casascarlatta.mx')).toBeInTheDocument()
    expect(screen.getByDisplayValue(465)).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('ssl')
  })

  test('preset gmail y outlook llenan campos correctos', async () => {
    const user = userEvent.setup()
    await renderSection()

    await user.click(screen.getByRole('button', { name: 'Gmail' }))
    expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('ssl')
    expect(screen.getByText('Para Gmail normalmente se requiere contraseña de aplicación.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outlook' }))
    expect(screen.getByDisplayValue('smtp.office365.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue(587)).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('starttls')
  })

  test('password vacío no pisa contraseña actual y password nuevo viaja', async () => {
    const user = userEvent.setup()
    updateMutateAsync.mockResolvedValue({})

    await renderSection()

    expect(screen.getAllByText('Contraseña configurada')).toHaveLength(1)
    const passwordInput = screen.getByPlaceholderText('••••••••••••••')
    await user.type(passwordInput, 'NuevaClave123')
    await user.click(screen.getByRole('button', { name: /Guardar configuración/i }))

    expect(updateMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      smtpPassword: 'NuevaClave123',
      smtpUseSsl: true,
      smtpUseTls: false,
    }))
  })

  test('timeout smtp muestra mensaje claro', async () => {
    const user = userEvent.setup()
    testMutateAsync.mockRejectedValue({
      response: { data: { error_message: 'Connection unexpectedly closed: timed out' } },
      message: 'Connection unexpectedly closed: timed out',
    })

    await renderSection()

    const testEmailInput = screen.getByPlaceholderText('cabreu145@gmail.com')
    await user.clear(testEmailInput)
    await user.type(testEmailInput, 'prueba@demo.local')
    await user.click(screen.getByRole('button', { name: /Enviar correo de prueba/i }))

    expect(toastError).toHaveBeenCalledWith(
      'No se pudo conectar al servidor SMTP. Revisa servidor, puerto, seguridad SSL/TLS, usuario, contraseña o firewall.'
    )
  })

  test('correo de prueba llama endpoint correcto', async () => {
    const user = userEvent.setup()
    testMutateAsync.mockResolvedValue({ status: 'sent' })

    await renderSection()

    const testEmailInput = screen.getByPlaceholderText('cabreu145@gmail.com')
    await user.clear(testEmailInput)
    await user.type(testEmailInput, 'cabreu145@gmail.com')
    await user.click(screen.getByRole('button', { name: /Enviar correo de prueba/i }))

    expect(testMutateAsync).toHaveBeenCalledWith({ toEmail: 'cabreu145@gmail.com' })
    expect(toastSuccess).toHaveBeenCalledWith('Correo enviado correctamente.')
  })

  test('outbox renderiza historial y retry', async () => {
    await renderSection()

    expect(screen.getByText(/cliente@demo\.local/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeEnabled()
  })
})
