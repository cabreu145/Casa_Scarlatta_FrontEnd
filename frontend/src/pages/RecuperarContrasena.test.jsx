import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const requestMutateAsync = vi.fn()
const confirmMutateAsync = vi.fn()

vi.mock('@/hooks/useApiQueries', () => ({
  useRequestPasswordResetMutation: () => ({ mutateAsync: requestMutateAsync, isPending: false }),
  useConfirmPasswordResetMutation: () => ({ mutateAsync: confirmMutateAsync, isPending: false }),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

describe('RecuperarContrasena', () => {
  beforeEach(() => {
    requestMutateAsync.mockReset()
    confirmMutateAsync.mockReset()
    localStorage.clear()
    sessionStorage.clear()
  })

  test('sin token muestra formulario de correo', async () => {
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar instrucciones/i })).toBeInTheDocument()
  })

  test('request reset muestra mensaje genérico', async () => {
    const user = userEvent.setup()
    requestMutateAsync.mockResolvedValueOnce({})
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/correo electrónico/i), 'cliente@demo.local')
    await user.click(screen.getByRole('button', { name: /enviar instrucciones/i }))

    expect(requestMutateAsync).toHaveBeenCalledWith('cliente@demo.local')
    expect(await screen.findByText(/si el correo existe/i)).toBeInTheDocument()
  })

  test('con token muestra formulario de nueva contraseña', async () => {
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena?token=abc123']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /^Nueva contraseña$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nueva contraseña$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Confirmar nueva contraseña$/i)).toBeInTheDocument()
  })

  test('passwords diferentes muestran error', async () => {
    const user = userEvent.setup()
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena?token=abc123']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/^Nueva contraseña$/i), 'NuevaPassword123')
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña$/i), 'OtraPassword123')
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
    expect(confirmMutateAsync).not.toHaveBeenCalled()
  })

  test('password corta muestra error', async () => {
    const user = userEvent.setup()
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena?token=abc123']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/^Nueva contraseña$/i), 'corta')
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña$/i), 'corta')
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    expect(confirmMutateAsync).not.toHaveBeenCalled()
  })

  test('confirm reset llama endpoint correcto y muestra éxito', async () => {
    const user = userEvent.setup()
    confirmMutateAsync.mockResolvedValueOnce({})
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena?token=abc123']}>
        <LocationProbe />
        <RecuperarContrasena />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/^Nueva contraseña$/i), 'NuevaPassword123')
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña$/i), 'NuevaPassword123')
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

    expect(confirmMutateAsync).toHaveBeenCalledWith({ token: 'abc123', newPassword: 'NuevaPassword123' })
    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ir a Iniciar Sesión/i })).toBeInTheDocument()
  })

  test('token expirado muestra mensaje amigable', async () => {
    const user = userEvent.setup()
    confirmMutateAsync.mockRejectedValueOnce({ code: 'RESET_TOKEN_EXPIRED' })
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena?token=abc123']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/^Nueva contraseña$/i), 'NuevaPassword123')
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña$/i), 'NuevaPassword123')
    await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

    expect(await screen.findByText(/el enlace expiró/i)).toBeInTheDocument()
  })

  test('no guarda token en storage', async () => {
    const { default: RecuperarContrasena } = await import('./RecuperarContrasena')

    render(
      <MemoryRouter initialEntries={['/recuperar-contrasena?token=abc123']}>
        <RecuperarContrasena />
      </MemoryRouter>
    )

    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })
})
