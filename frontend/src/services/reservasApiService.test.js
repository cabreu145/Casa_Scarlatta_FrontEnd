import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    reservasMe: '/api/v1/reservas/me',
    reservasMePaginated: ({ page, pageSize, status, from, to }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (status) params.set('status', status)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return `/api/v1/reservas/me?${params.toString()}`
    },
    reservaById: (id) => `/api/v1/reservas/${id}`,
    crearReserva: '/api/v1/reservas',
    cancelarReserva: (id) => `/api/v1/reservas/${id}/cancelar`,
    marcarNoAsistio: (id) => `/api/v1/reservas/${id}/no-asistio`,
    completarReserva: (id) => `/api/v1/reservas/${id}/completar`,
    occurrenceAlumnos: (occurrenceId, { includeCanceled } = {}) =>
      `/api/v1/reservas/ocurrencias/${occurrenceId}/alumnos${includeCanceled ? '?includeCanceled=true' : ''}`,
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

  test('crearReservaApi envia payload con occurrence_id', async () => {
    httpPost.mockResolvedValue({ id: 10, user_id: 5, class_id: 7, occurrence_id: 70, status: 'confirmada' })
    const { crearReservaApi } = await import('./reservasApiService')
    await crearReservaApi({ claseId: 7, userId: 5, asiento: null, occurrenceId: 70 })

    expect(httpPost).toHaveBeenCalledWith('/api/v1/reservas', {
      clase_id: 7,
      user_id: 5,
      occurrence_id: 70,
    })
  })

  test('crearReservaApi envia payload con spot_id y hold_id', async () => {
    httpPost.mockResolvedValue({
      id: 11,
      user_id: 5,
      class_id: 7,
      occurrence_id: 70,
      spot_id: 8,
      hold_id: 123,
      status: 'confirmada',
    })
    const { crearReservaApi } = await import('./reservasApiService')
    await crearReservaApi({ claseId: 7, userId: 5, occurrenceId: 70, spotId: 8, holdId: 123 })

    expect(httpPost).toHaveBeenCalledWith('/api/v1/reservas', {
      clase_id: 7,
      user_id: 5,
      occurrence_id: 70,
      spot_id: 8,
      hold_id: 123,
    })
  })

  test('cancelarReservaApi usa endpoint cancelar alias', async () => {
    httpPost.mockResolvedValue({ id: 10, user_id: 5, class_id: 7, status: 'cancelada' })
    const { cancelarReservaApi } = await import('./reservasApiService')
    await cancelarReservaApi(10)

    expect(httpPost).toHaveBeenCalledWith('/api/v1/reservas/10/cancelar', {})
  })

  test('getMisReservasPaginatedApi llama endpoint con filtros', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 20, total: 1, items: [{ id: 10, user_id: 5, class_id: 7, status: 'confirmada' }] })
    const { getMisReservasPaginatedApi } = await import('./reservasApiService')
    const result = await getMisReservasPaginatedApi({ page: 1, pageSize: 20, status: 'confirmada', from: '2026-06-01', to: '2026-06-30' })

    expect(httpGet).toHaveBeenCalledWith('/api/v1/reservas/me?page=1&page_size=20&status=confirmada&from=2026-06-01&to=2026-06-30')
    expect(result.isPaginated).toBe(true)
    expect(result.total).toBe(1)
  })

  test('getOccurrenceRosterApi llama endpoint privado con token y mapea roster', async () => {
    httpGet.mockResolvedValue({
      occurrence_id: 10,
      class_id: 3,
      class_name: 'Clase Demo STRYDE Semana QA',
      discipline: 'stryde',
      date: '2026-06-09',
      start_time: '07:00',
      end_time: '07:50',
      coach_id: 1,
      coach_name: 'Coach Demo',
      capacity_max: 15,
      capacity_current: 2,
      students: [{ reservation_id: 100, user_id: 5, name: 'Cliente Demo', status: 'confirmada', equipment_type: 'bench' }],
    })
    const { getOccurrenceRosterApi } = await import('./reservasApiService')
    const roster = await getOccurrenceRosterApi(10, { includeCanceled: true })

    expect(httpGet).toHaveBeenCalledWith('/api/v1/reservas/ocurrencias/10/alumnos?includeCanceled=true')
    expect(roster.occurrenceId).toBe(10)
    expect(roster.students[0]).toMatchObject({ reservationId: 100, equipmentLabel: 'Banco' })
  })
})
