import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const assignarPaqueteServiceMock = vi.fn()
const createCheckoutPreferenceMock = vi.fn()

vi.mock('@/services/usuariosService', () => ({
  asignarPaqueteService: (...args) => assignarPaqueteServiceMock(...args),
}))

vi.mock('@/services/paymentsApiService', () => ({
  createCheckoutPreferenceApi: (...args) => createCheckoutPreferenceMock(...args),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id: 3, nombre: 'Cliente Demo' },
    actualizarClasesPaquete: vi.fn(),
    actualizarPerfil: vi.fn(),
  }),
}))

vi.mock('@/stores/usuariosStore', () => ({
  useUsuariosStore: () => ({
    asignarPaquete: vi.fn(),
    asignarPaqueteCompartido: vi.fn(),
  }),
}))

vi.mock('@/services/actividadService', () => ({ logPaqueteVendido: vi.fn() }))

const paquete = { id: 2, nombre: 'Plan', precio: 1500, clases: 8, vigencia: 'Mensual', beneficios: [] }

describe('PagoModal', () => {
  beforeEach(() => {
    vi.resetModules()
    assignarPaqueteServiceMock.mockReset()
    createCheckoutPreferenceMock.mockReset()
    sessionStorage.clear()
  })

  test('API mode crea checkout y redirige sin flujo local', async () => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    createCheckoutPreferenceMock.mockResolvedValue({
      checkoutUrl: 'https://checkout.test',
      externalReference: 'ref123',
    })
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/' },
    })

    const { default: PagoModal } = await import('./PagoModal')
    render(<PagoModal paquete={paquete} onClose={vi.fn()} onSuccess={vi.fn()} />)

    await userEvent.click(screen.getByText('Continuar al pago'))
    await userEvent.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '4242424242424242')
    await userEvent.type(screen.getByPlaceholderText('Como aparece en la tarjeta'), 'Cliente Demo')
    await userEvent.type(screen.getByPlaceholderText('MM/AA'), '1228')
    await userEvent.type(screen.getByPlaceholderText('123'), '123')
    await userEvent.click(screen.getByRole('button', { name: /Pagar \$1,500 MXN/i }))

    await waitFor(() => {
      expect(createCheckoutPreferenceMock).toHaveBeenCalledWith({ packageId: 2 })
      expect(assignarPaqueteServiceMock).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('last_payment_external_reference')).toBe('ref123')
      expect(window.location.href).toBe('https://checkout.test')
    })

    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  test('fallback mock mantiene flujo local (sin checkout backend)', async () => {
    vi.stubEnv('VITE_USE_API_AUTH', 'false')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'false')

    const { default: PagoModal } = await import('./PagoModal')
    render(<PagoModal paquete={paquete} onClose={vi.fn()} onSuccess={vi.fn()} />)

    await userEvent.click(screen.getByText('Continuar al pago'))
    await userEvent.click(screen.getByRole('button', { name: /Pagar \$1,500 MXN/i }))

    await waitFor(() => {
      expect(screen.getByText(/Número de tarjeta inválido/i)).toBeInTheDocument()
      expect(createCheckoutPreferenceMock).not.toHaveBeenCalled()
    })
  })
})
