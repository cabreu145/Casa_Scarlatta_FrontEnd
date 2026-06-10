import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adjustClientCreditsApi,
  assignClientPackageApi,
  createClientApi,
  deleteClientApi,
  getClientByIdApi,
  getClientsPaginatedApi,
  updateClientApi,
} from './clientsApiService'
import * as http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpPut: vi.fn(),
  httpDelete: vi.fn(),
}))

describe('clientsApiService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista con filtros y limita page_size', async () => {
    http.httpGet.mockResolvedValue({ page: 1, page_size: 100, total: 1, items: [{ id: 1, name: 'Cliente' }] })
    const response = await getClientsPaginatedApi({
      page: 1,
      pageSize: 1000,
      search: 'Cliente',
      status: 'active',
      membershipStatus: 'none',
    })
    expect(http.httpGet).toHaveBeenCalledWith(expect.stringContaining('page_size=100'))
    expect(http.httpGet).toHaveBeenCalledWith(expect.stringContaining('membership_status=none'))
    expect(response.items[0].nombre).toBe('Cliente')
  })

  it('ejecuta CRUD y detalle', async () => {
    http.httpPost.mockResolvedValue({ id: 1, name: 'Cliente' })
    http.httpGet.mockResolvedValue({ id: 1, name: 'Cliente' })
    http.httpPut.mockResolvedValue({ id: 1, name: 'Editado' })
    http.httpDelete.mockResolvedValue({ success: true })
    await createClientApi({ name: 'Cliente', password: 'Password123' })
    await getClientByIdApi(1)
    await updateClientApi(1, { name: 'Editado' })
    await deleteClientApi(1)
    expect(http.httpPost).toHaveBeenCalledWith(expect.stringMatching(/\/clientes$/), expect.any(Object))
    expect(http.httpGet).toHaveBeenCalledWith(expect.stringMatching(/\/clientes\/1$/))
    expect(http.httpPut).toHaveBeenCalledWith(expect.stringMatching(/\/clientes\/1$/), { name: 'Editado' })
    expect(http.httpDelete).toHaveBeenCalledWith(expect.stringMatching(/\/clientes\/1$/))
  })

  it('asigna paquete y ajusta creditos', async () => {
    http.httpPost.mockResolvedValue({ id: 1 })
    await assignClientPackageApi(1, { packageId: 4, notes: 'Admin' })
    expect(http.httpPost).toHaveBeenLastCalledWith(expect.stringMatching(/\/clientes\/1\/paquetes$/), {
      package_id: 4,
      notes: 'Admin',
    })
    await adjustClientCreditsApi(1, { amount: -2, notes: 'Correccion' })
    expect(http.httpPost).toHaveBeenLastCalledWith(expect.stringMatching(/\/clientes\/1\/credits$/), {
      amount: -2,
      reason: 'manual_adjustment',
      notes: 'Correccion',
    })
  })
})
