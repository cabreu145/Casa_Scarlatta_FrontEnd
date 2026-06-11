import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/configuracionStore', () => ({
  CONFIG_DEFAULTS: {},
  useConfiguracionStore: () => ({
    get: () => '',
    actualizar: vi.fn(),
  }),
}))

vi.mock('./ConfiguracionCorreoSection', () => ({
  default: () => <div>Correo mock</div>,
}))

vi.mock('../components/rbac/RolesPermissionsSection', () => ({
  default: () => <div>RBAC mock</div>,
}))

describe('ConfiguracionSection', () => {
  it('usuario sin roles.read no ve pestaña roles y permisos', async () => {
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(<ConfiguracionSection currentUser={{ permissions: ['settings.read'] }} />)

    expect(screen.queryByRole('button', { name: 'Roles y permisos' })).not.toBeInTheDocument()
  })

  it('usuario con roles.read si ve pestaña roles y permisos', async () => {
    const { default: ConfiguracionSection } = await import('./ConfiguracionSection')
    render(<ConfiguracionSection currentUser={{ permissions: ['settings.read', 'roles.read'] }} />)

    expect(screen.getByRole('button', { name: 'Roles y permisos' })).toBeInTheDocument()
  })
})
