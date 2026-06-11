import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()
const httpPatch = vi.fn()
const httpDelete = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
  httpPut: (...args) => httpPut(...args),
  httpPatch: (...args) => httpPatch(...args),
  httpDelete: (...args) => httpDelete(...args),
}))

describe('rbacApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista permisos desde API', async () => {
    httpGet.mockResolvedValueOnce([{ id: 1, key: 'roles.read', module: 'roles', action: 'read', is_active: true }])
    const { getPermissionsApi } = await import('./rbacApiService')
    const result = await getPermissionsApi()

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('/api/v1/rbac/permissions'))
    expect(result[0]).toMatchObject({ key: 'roles.read', module: 'roles', isActive: true })
  })

  it('lista roles paginados', async () => {
    httpGet.mockResolvedValueOnce({
      page: 1,
      page_size: 20,
      total: 1,
      items: [{ id: 9, code: 'recepcion', name: 'Recepción', base_role: 'cajero_pos', is_system: false, is_active: true, permissions_count: 3 }],
    })
    const { getRolesApi } = await import('./rbacApiService')
    const result = await getRolesApi({ page: 1, pageSize: 20, search: 'recep', status: 'active' })

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('/api/v1/rbac/roles?page=1&page_size=20&search=recep&status=active'))
    expect(result.items[0]).toMatchObject({ code: 'recepcion', baseRole: 'cajero_pos', isSystem: false, isActive: true })
  })

  it('crea rol con permission_keys', async () => {
    httpPost.mockResolvedValueOnce({ id: 5, code: 'recepcion', name: 'Recepción', permissions_count: 2 })
    const { createRoleApi } = await import('./rbacApiService')

    await createRoleApi({
      code: 'recepcion',
      name: 'Recepción',
      description: 'Operación',
      baseRole: 'cajero_pos',
      isActive: true,
      permissionKeys: ['clients.read', 'reservations.read'],
    })

    expect(httpPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rbac/roles'),
      expect.objectContaining({
        code: 'recepcion',
        base_role: 'cajero_pos',
        permission_keys: ['clients.read', 'reservations.read'],
      })
    )
  })

  it('actualiza rol de usuario por role_code', async () => {
    httpPatch.mockResolvedValueOnce({ success: true })
    const { updateUserRoleApi } = await import('./rbacApiService')

    await updateUserRoleApi(12, { roleCode: 'recepcion' })

    expect(httpPatch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rbac/users/12/role'),
      { role_code: 'recepcion' }
    )
  })

  it('actualiza overrides de usuario', async () => {
    httpPut.mockResolvedValueOnce({
      user_id: 3,
      role: 'recepcion',
      role_permissions: ['clients.read'],
      overrides: [{ permission_key: 'clients.read', effect: 'deny' }],
      effective_permissions: [],
    })
    const { updateUserPermissionOverridesApi } = await import('./rbacApiService')
    const result = await updateUserPermissionOverridesApi(3, {
      overrides: [{ permissionKey: 'clients.read', effect: 'deny' }],
    })

    expect(httpPut).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rbac/users/3/permissions'),
      { overrides: [{ permission_key: 'clients.read', effect: 'deny' }] }
    )
    expect(result.overrides[0]).toMatchObject({ permissionKey: 'clients.read', effect: 'deny' })
  })
})
