import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryMocks = {
  permissions: { data: [{ id: 1, key: 'roles.read', module: 'roles', label: 'Ver roles', description: '', isActive: true }], isLoading: false, error: null },
  roles: { data: { items: [{ id: 1, code: 'admin', name: 'Admin', baseRole: 'admin', isSystem: true, isActive: true, permissionsCount: 1, permissionKeys: ['roles.read'] }], page: 1, pageSize: 20, total: 1 }, isLoading: false, error: null },
  roleDetail: { data: null, isLoading: false, error: null },
  users: { data: { items: [{ id: 3, name: 'Caja Demo', email: 'caja@demo.local', roleName: 'Cajero POS', roleCode: 'cajero_pos', status: 'active', permissionOverridesCount: 0 }], page: 1, pageSize: 20, total: 1 }, isLoading: false, error: null },
  userPermissions: { data: { userId: 3, roleName: 'Cajero POS', rolePermissions: ['pos.sell'], overrides: [], effectivePermissions: ['pos.sell'] }, isLoading: false, error: null },
}

vi.mock('@/hooks/useApiQueries', () => ({
  useRbacPermissionsQuery: () => queryMocks.permissions,
  useRbacRolesQuery: () => queryMocks.roles,
  useRbacRoleDetailQuery: () => queryMocks.roleDetail,
  useRbacUsersQuery: () => queryMocks.users,
  useRbacUserPermissionsQuery: () => queryMocks.userPermissions,
  useCreateRbacRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRbacRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRbacRolePermissionsMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteRbacRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRbacUserRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRbacUserPermissionOverridesMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe('RolesPermissionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usuario con roles.read ve modulo', async () => {
    const { default: RolesPermissionsSection } = await import('./RolesPermissionsSection')
    render(<RolesPermissionsSection currentUser={{ permissions: ['roles.read'] }} />)

    expect(screen.getByText('Roles y permisos')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('usuario sin roles.read ve acceso denegado', async () => {
    const { default: RolesPermissionsSection } = await import('./RolesPermissionsSection')
    render(<RolesPermissionsSection currentUser={{ permissions: [] }} />)

    expect(screen.getByText('No tienes permisos para esta acción.')).toBeInTheDocument()
  })

  it('cambia a tab usuarios', async () => {
    const user = userEvent.setup()
    const { default: RolesPermissionsSection } = await import('./RolesPermissionsSection')
    render(<RolesPermissionsSection currentUser={{ permissions: ['roles.read'] }} />)

    await user.click(screen.getByRole('button', { name: 'Usuarios' }))
    expect(screen.getByText('Caja Demo')).toBeInTheDocument()
  })
})
