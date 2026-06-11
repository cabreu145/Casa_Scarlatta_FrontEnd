import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import {
  useCreateRbacRoleMutation,
  useUpdateRbacRolePermissionsMutation,
  useUpdateRbacUserPermissionOverridesMutation,
  useUpdateRbacUserRoleMutation,
} from './useApiQueries'

vi.mock('@/services/rbacApiService', () => ({
  createRoleApi: vi.fn(),
  deleteRoleApi: vi.fn(),
  getPermissionsApi: vi.fn(),
  getRbacUsersApi: vi.fn(),
  getRoleByIdApi: vi.fn(),
  getRolesApi: vi.fn(),
  getUserEffectivePermissionsApi: vi.fn(),
  updateRoleApi: vi.fn(),
  updateRolePermissionsApi: vi.fn(),
  updateUserPermissionOverridesApi: vi.fn(),
  updateUserRoleApi: vi.fn(),
}))

import {
  createRoleApi,
  updateRolePermissionsApi,
  updateUserPermissionOverridesApi,
  updateUserRoleApi,
} from '@/services/rbacApiService'

function wrapper(queryClient) {
  return ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useRbacQueries', () => {
  let queryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  })

  it('crear rol invalida rbac.roles y activity', async () => {
    createRoleApi.mockResolvedValue({ id: 99, code: 'recepcion' })
    queryClient.setQueryData(queryKeys.rbac.roles({ page: 1 }), { items: [] })
    queryClient.setQueryData(queryKeys.activity.list({ page: 1 }), { items: [] })
    const { result } = renderHook(() => useCreateRbacRoleMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ code: 'recepcion', name: 'Recepción' })
    })

    expect(queryClient.getQueryState(queryKeys.rbac.roles({ page: 1 }))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.activity.list({ page: 1 }))?.isInvalidated).toBe(true)
  })

  it('editar permisos de rol invalida roles, roleDetail, users y auth.me', async () => {
    updateRolePermissionsApi.mockResolvedValue({ id: 5 })
    queryClient.setQueryData(queryKeys.rbac.roles({ page: 1 }), { items: [] })
    queryClient.setQueryData(queryKeys.rbac.roleDetail(5), { id: 5 })
    queryClient.setQueryData(queryKeys.rbac.users({ page: 1 }), { items: [] })
    queryClient.setQueryData(queryKeys.auth.me, { id: 1 })
    const { result } = renderHook(() => useUpdateRbacRolePermissionsMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ roleId: 5, permissionKeys: ['roles.read'] })
    })

    expect(queryClient.getQueryState(queryKeys.rbac.roles({ page: 1 }))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.rbac.roleDetail(5))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.rbac.users({ page: 1 }))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.auth.me)?.isInvalidated).toBe(true)
  })

  it('cambiar rol de usuario invalida users, userPermissions y auth.me', async () => {
    updateUserRoleApi.mockResolvedValue({ success: true })
    queryClient.setQueryData(queryKeys.rbac.users({ page: 1 }), { items: [] })
    queryClient.setQueryData(queryKeys.rbac.userPermissions(7), { userId: 7 })
    queryClient.setQueryData(queryKeys.auth.me, { id: 1 })
    const { result } = renderHook(() => useUpdateRbacUserRoleMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ userId: 7, payload: { roleCode: 'recepcion' } })
    })

    expect(queryClient.getQueryState(queryKeys.rbac.users({ page: 1 }))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.rbac.userPermissions(7))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.auth.me)?.isInvalidated).toBe(true)
  })

  it('editar overrides invalida userPermissions y auth.me', async () => {
    updateUserPermissionOverridesApi.mockResolvedValue({ userId: 7 })
    queryClient.setQueryData(queryKeys.rbac.userPermissions(7), { userId: 7 })
    queryClient.setQueryData(queryKeys.auth.me, { id: 7 })
    const { result } = renderHook(() => useUpdateRbacUserPermissionOverridesMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ userId: 7, overrides: [{ permissionKey: 'roles.read', effect: 'deny' }] })
    })

    expect(queryClient.getQueryState(queryKeys.rbac.userPermissions(7))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.auth.me)?.isInvalidated).toBe(true)
  })
})
