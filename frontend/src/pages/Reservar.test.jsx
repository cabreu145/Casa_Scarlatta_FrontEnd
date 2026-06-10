import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockClasses = [
  {
    id: 9,
    occurrenceId: 5,
    nombre: 'Clase Demo SLOW API',
    tipo: 'Slow',
    discipline: 'slow',
    hora: '16:00',
    duracion: 50,
    coachNombre: 'Coach Demo',
    cupoMax: 10,
    cupoActual: 2,
  },
]

const mockLoadClasesFromApi = vi.fn().mockResolvedValue(mockClasses)
const mockNavigateLocation = { pathname: '/reservar', search: '' }
const mockToastError = vi.fn()

let authState = {
  usuario: null,
  isAuthenticated: false,
}

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: () => ({
    clases: mockClasses,
    loadClasesFromApi: mockLoadClasesFromApi,
  }),
}))

vi.mock('@/features/clases/WeeklyCalendar', () => ({
  default: ({ classes, onSelectClass }) => (
    <div>
      <div>WeeklyCalendar Mock {classes.length}</div>
      <button type="button" onClick={() => onSelectClass(classes[0])}>
        Clase Demo SLOW API
      </button>
    </div>
  ),
}))

vi.mock('@/features/clases/SeatSelector', () => ({
  default: () => <div>SeatSelector Mock</div>,
}))

vi.mock('@/features/reservas/EquipmentReservationPanel', () => ({
  default: () => <div>EquipmentReservationPanel Mock</div>,
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args) => mockToastError(...args),
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

describe('Reservar page', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_CLASSES', 'true')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    localStorage.clear()
    authState = { usuario: null, isAuthenticated: false }
    mockNavigateLocation.pathname = '/reservar'
    mockNavigateLocation.search = ''
    mockToastError.mockClear()
    mockLoadClasesFromApi.mockClear()
    mockLoadClasesFromApi.mockResolvedValue(mockClasses)
    window.history.pushState({}, '', '/reservar')
  })

  test('muestra cards STRYDE y SLOW y avanza a calendario', async () => {
    const { default: Reservar } = await import('./Reservar')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/reservar']}>
        <LocationProbe />
        <Reservar />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/reservar clase de stryde x/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reservar clase de slow/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/reservar clase de slow/i))

    expect(await screen.findByText(/WeeklyCalendar Mock/i)).toBeInTheDocument()
    expect(screen.getByText('Clase Demo SLOW API')).toBeInTheDocument()
  })

  test('anonimo pide login al continuar reserva', async () => {
    const { default: Reservar } = await import('./Reservar')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/reservar']}>
        <LocationProbe />
        <Reservar />
      </MemoryRouter>
    )

    await user.click(await screen.findByLabelText(/reservar clase de slow/i))
    await user.click(screen.getByRole('button', { name: /clase demo slow api/i }))
    await user.click(screen.getByRole('button', { name: /iniciar sesi/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/login?redirect=%2Freservar%3Ftipo%3Dslow%26classId%3D9'
      )
    })
  })

  test('cliente abre panel real de reserva', async () => {
    authState = {
      usuario: { id: 3, rol: 'cliente', nombre: 'Cliente Demo' },
      isAuthenticated: true,
    }

    const { default: Reservar } = await import('./Reservar')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/reservar']}>
        <LocationProbe />
        <Reservar />
      </MemoryRouter>
    )

    await user.click(await screen.findByLabelText(/reservar clase de slow/i))
    await user.click(screen.getByRole('button', { name: /clase demo slow api/i }))
    await user.click(screen.getByRole('button', { name: /elegir lugar/i }))

    expect(await screen.findByText('EquipmentReservationPanel Mock')).toBeInTheDocument()
  })
})
