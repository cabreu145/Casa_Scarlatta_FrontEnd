import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockNavigateLocation = { pathname: '/', search: '' }
const toastError = vi.fn()
const mockAuth = {
  usuario: null,
  isAuthenticated: false,
  loading: false,
}

const mockApiPackages = [
  {
    id: 12,
    nombre: 'Mensual 12',
    precio: 2100,
    creditos: 12,
    vigencia: 'Mensual',
    descripcion: 'Pack demo',
    beneficios: ['12 créditos', 'Acceso prioritario'],
    destacado: true,
  },
]

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('@/stores/paquetesStore', () => ({
  usePaquetesStore: (selector) => selector({ paquetes: [] }),
}))

vi.mock('@/services/membershipPackagesApiService', () => ({
  getMembershipPackagesApi: vi.fn().mockResolvedValue(mockApiPackages),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args) => toastError(...args),
  },
}))

function LocationProbe() {
  const location = useLocation()
  useEffect(() => {
    mockNavigateLocation.pathname = location.pathname
    mockNavigateLocation.search = location.search
  }, [location])
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

describe('PricingSection', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    localStorage.clear()
    mockAuth.usuario = null
    mockAuth.isAuthenticated = false
    mockAuth.loading = false
    mockNavigateLocation.pathname = '/'
    mockNavigateLocation.search = ''
    toastError.mockClear()
  })

  test('carga catálogo backend y manda login con redirect cuando no hay sesión', async () => {
    const { default: PricingSection } = await import('./PricingSection')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <LocationProbe />
        <PricingSection />
      </MemoryRouter>
    )

    expect(await screen.findByText('Mensual 12')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /comprar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/login?redirect=%2Fcliente%2Fdashboard%3Fsection%3Dpagos%26packageId%3D12'
      )
    })
    expect(localStorage.getItem('pending_package_purchase_id')).toBe('12')
  })

  test('si cliente autenticado, va directo a dashboard pagos', async () => {
    mockAuth.usuario = { rol: 'cliente', nombre: 'Cliente Demo' }
    mockAuth.isAuthenticated = true

    const { default: PricingSection } = await import('./PricingSection')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <LocationProbe />
        <PricingSection />
      </MemoryRouter>
    )

    expect(await screen.findByText('Mensual 12')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /comprar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/cliente/dashboard?section=pagos&packageId=12')
    })
  })

  test('admin o coach no inicia compra', async () => {
    mockAuth.usuario = { rol: 'admin', nombre: 'Admin Demo' }
    mockAuth.isAuthenticated = true

    const { default: PricingSection } = await import('./PricingSection')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <LocationProbe />
        <PricingSection />
      </MemoryRouter>
    )

    expect(await screen.findByText('Mensual 12')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /comprar/i }))

    expect(toastError).toHaveBeenCalledWith('Inicia sesión con una cuenta de cliente para comprar paquetes.')
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
