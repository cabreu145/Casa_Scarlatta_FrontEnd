import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const unreadCount = { unreadCount: 0 }
const notificationsQuery = {
  data: {
    page: 1,
    pageSize: 10,
    total: 1,
    items: [
      {
        id: 1,
        title: 'Reserva creada',
        message: 'Tu reserva quedó confirmada',
        category: 'reservas',
        createdAt: '2026-06-09T10:00:00',
        read: false,
        metadata: { reservationId: 12 },
      },
    ],
  },
  isLoading: false,
  isFetching: false,
  error: null,
}

vi.mock('@paper-design/shaders-react', () => ({
  Dithering: () => null,
}))

vi.mock('@/components/ui/LiquidButton', () => ({
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => globalThis.__navbarAuthState ?? {
    isAuthenticated: false,
    usuario: null,
    logout: vi.fn(),
  },
}))

vi.mock('@/hooks/useApiQueries', () => ({
  usePublicCoachesQuery: () => ({ data: [] }),
  useUnreadNotificationsCountQuery: () => ({ data: unreadCount }),
  useNotificationsQuery: () => notificationsQuery,
  useMarkNotificationReadMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMarkAllNotificationsReadMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 })
  window.dispatchEvent(new Event('resize'))
}

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
    </MemoryRouter>
  )
}

describe('Navbar mobile behavior', () => {
  beforeEach(() => {
    globalThis.__navbarAuthState = {
      isAuthenticated: false,
      usuario: null,
      logout: vi.fn(),
    }
    unreadCount.unreadCount = 0
  })

  test('renders correctly in mobile viewport', () => {
    setMobileViewport()
    renderNavbar()

    expect(screen.getByLabelText(/abrir men/i)).toBeInTheDocument()
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
  })

  test('opens mobile navigation when hamburger is clicked', async () => {
    setMobileViewport()
    renderNavbar()
    const user = userEvent.setup()

    const openButton = screen.getByLabelText(/abrir men/i)
    const dialog = screen.getByRole('dialog', { hidden: true })

    await user.click(openButton)

    expect(openButton).toHaveAttribute('aria-expanded', 'true')
    expect(dialog).toHaveAttribute('aria-hidden', 'false')
  })

  test('closes when close button is clicked', async () => {
    setMobileViewport()
    renderNavbar()
    const user = userEvent.setup()

    const openButton = screen.getByLabelText(/abrir men/i)
    const dialog = screen.getByRole('dialog', { hidden: true })

    await user.click(openButton)
    await user.click(screen.getByLabelText(/cerrar men/i))

    expect(openButton).toHaveAttribute('aria-expanded', 'false')
    expect(dialog).toHaveAttribute('aria-hidden', 'true')
  })

  test('closes when a navigation link is clicked', async () => {
    setMobileViewport()
    renderNavbar()
    const user = userEvent.setup()

    const openButton = screen.getByLabelText(/abrir men/i)
    const dialog = screen.getByRole('dialog', { hidden: true })
    await user.click(openButton)

    const mobileClasesLink = within(dialog).getByRole('link', { name: 'Clases' })
    await user.click(mobileClasesLink)

    expect(openButton).toHaveAttribute('aria-expanded', 'false')
    expect(dialog).toHaveAttribute('aria-hidden', 'true')
  })

  test('shows unread badge and opens notifications panel for authenticated user', async () => {
    setMobileViewport()
    globalThis.__navbarAuthState = {
      isAuthenticated: true,
      usuario: { nombre: 'Admin Demo', rol: 'admin' },
      logout: vi.fn(),
    }
    unreadCount.unreadCount = 3
    renderNavbar()
    const user = userEvent.setup()

    expect(screen.getByLabelText(/notificaciones/i)).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/notificaciones/i))

    expect(screen.getByRole('dialog', { name: /notificaciones/i })).toBeInTheDocument()
    expect(screen.getByText('Reserva creada')).toBeInTheDocument()
  })
})
