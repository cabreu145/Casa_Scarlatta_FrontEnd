import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    reservasMe: '/api/v1/reservas/me',
    reservaById: (id) => `/api/v1/reservas/${id}`,
    crearReserva: '/api/v1/reservas',
    cancelarReserva: (id) => `/api/v1/reservas/${id}/cancelar`,
    marcarNoAsistio: (id) => `/api/v1/reservas/${id}/no-asistio`,
    completarReserva: (id) => `/api/v1/reservas/${id}/completar`,
  },
}))

const httpGet = vi.fn()
const httpPost = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
}))

const clasesState = { clases: [] }
vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: {
    getState: () => clasesState,
  },
}))

describe('reservasApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    clasesState.clases = []
  })

  test('crearReservaApi envía payload con occurrence_id', async () => {
    httpPost.mockResolvedValue({ id: 10, user_id: 5, class_id: 7, occurrence_id: 70, status: 'confirmada' })
    const { crearReservaApi } = await import('./reservasApiService')
    await crearReservaApi({ claseId: 7, userId: 5, asiento: null, occurrenceId: 70 })

    expect(httpPost).toHaveBeenCalledWith('/api/v1/reservas', {
      clase_id: 7,
      user_id: 5,
      occurrence_id: 70,
    })
  })

  test('cancelarReservaApi usa endpoint cancelar alias', async () => {
    httpPost.mockResolvedValue({ id: 10, user_id: 5, class_id: 7, status: 'cancelada' })
    const { cancelarReservaApi } = await import('./reservasApiService')
    await cancelarReservaApi(10)

    expect(httpPost).toHaveBeenCalledWith('/api/v1/reservas/10/cancelar', {})
  })
})

