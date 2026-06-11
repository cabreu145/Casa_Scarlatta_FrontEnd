import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { savePendingPackagePurchaseIntent } from '@/utils/packagePurchaseIntent'

const mockLogin = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

function LocationProbe() {
  const location = useLocation()
  useEffect(() => {
    window.__lastLocation = `${location.pathname}${location.search}`
  }, [location])
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

describe('Login redirect flow', () => {
  beforeEach(() => {
    localStorage.clear()
    mockLogin.mockReset()
    window.__lastLocation = ''
  })

  test('respeta redirect interno seguro', async () => {
    mockLogin.mockResolvedValueOnce({ nombre: 'Cliente Demo', rol: 'cliente' })
    const user = userEvent.setup()
    const { default: Login } = await import('./Login')

    render(
      <MemoryRouter initialEntries={['/login?redirect=%2Fcliente%2Fdashboard%3Fsection%3Dpagos%26packageId%3D12']}>
        <LocationProbe />
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/correo/i), 'cliente@casascarlatta.local')
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'cliente999')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/cliente/dashboard&packageId=12')
    })
  })

  test('usa pending intent de compra', async () => {
    savePendingPackagePurchaseIntent(16)
    mockLogin.mockResolvedValueOnce({ nombre: 'Cliente Demo', rol: 'cliente' })
    const user = userEvent.setup()
    const { default: Login } = await import('./Login')

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LocationProbe />
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/correo/i), 'cliente@casascarlatta.local')
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'cliente999')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/cliente/dashboard&packageId=16')
    })
    expect(localStorage.getItem('pending_package_purchase_id')).toBeNull()
  })

  test('rechaza redirect externo', async () => {
    mockLogin.mockResolvedValueOnce({ nombre: 'Cliente Demo', rol: 'cliente' })
    const user = userEvent.setup()
    const { default: Login } = await import('./Login')

    render(
      <MemoryRouter initialEntries={['/login?redirect=https://evil.com']}>
        <LocationProbe />
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/correo/i), 'cliente@casascarlatta.local')
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), 'cliente999')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/cliente/dashboard')
    })
    expect(screen.getByTestId('location')).not.toHaveTextContent('evil.com')
  })

  test('link de recuperar contraseña lleva a ruta oficial', async () => {
    const { default: Login } = await import('./Login')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LocationProbe />
        <Login />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('link', { name: /olvidaste tu contraseña/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/recuperar-contrasena')
    })
  })
})
