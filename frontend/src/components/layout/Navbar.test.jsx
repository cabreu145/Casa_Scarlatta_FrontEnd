import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

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
  useAuth: () => ({
    isAuthenticated: false,
    usuario: null,
    logout: vi.fn(),
  }),
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
})
