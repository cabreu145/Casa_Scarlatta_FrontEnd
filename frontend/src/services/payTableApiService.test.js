import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    tabulador: '/api/v1/tabulador',
    tabuladorById: (id) => `/api/v1/tabulador/${id}`,
  },
}))

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()
const httpDelete = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
  httpPut: (...args) => httpPut(...args),
  httpDelete: (...args) => httpDelete(...args),
}))

describe('payTableApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpDelete.mockReset()
  })

  test('lista, crea, actualiza y elimina rangos', async () => {
    httpGet.mockResolvedValueOnce([
      { id: 1, discipline: 'slow', min_attendees: 1, max_attendees: 6, pay_mxn: 200, is_active: true },
    ])
    httpPost.mockResolvedValueOnce({ id: 2, discipline: 'slow', min_attendees: 7, max_attendees: 12, pay_mxn: 350, is_active: true })
    httpPut.mockResolvedValueOnce({ id: 2, discipline: 'slow', min_attendees: 7, max_attendees: 12, pay_mxn: 400, is_active: false })
    httpDelete.mockResolvedValueOnce({ success: true })

    const service = await import('./payTableApiService')

    const list = await service.getPayTableApi()
    const created = await service.createPayTableApi({
      discipline: 'slow',
      minAttendees: 7,
      maxAttendees: 12,
      payMxn: 350,
      isActive: true,
    })
    const updated = await service.updatePayTableApi(2, {
      discipline: 'slow',
      minAttendees: 7,
      maxAttendees: 12,
      payMxn: 400,
      isActive: false,
    })
    const deleted = await service.deletePayTableApi(2)

    expect(httpGet).toHaveBeenCalledWith('/api/v1/tabulador')
    expect(httpPost).toHaveBeenCalledWith('/api/v1/tabulador', {
      discipline: 'slow',
      min_attendees: 7,
      max_attendees: 12,
      pay_mxn: 350,
      is_active: true,
    })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/tabulador/2', {
      discipline: 'slow',
      min_attendees: 7,
      max_attendees: 12,
      pay_mxn: 400,
      is_active: false,
    })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/tabulador/2')
    expect(list.items[0]).toMatchObject({ discipline: 'slow', payMxn: 200 })
    expect(created).toMatchObject({ id: 2, payMxn: 350 })
    expect(updated).toMatchObject({ id: 2, payMxn: 400, isActive: false })
    expect(deleted).toEqual({ success: true })
  })
})
