import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    clases: '/api/v1/clases',
    clasesList: '/api/v1/clases',
    clasesPaginated: ({ page, pageSize, search, discipline, status, coach_id }) =>
      `/api/v1/clases?page=${page}&page_size=${pageSize}${search ? `&search=${search}` : ''}${discipline ? `&discipline=${discipline}` : ''}${status ? `&status=${status}` : ''}${coach_id ? `&coach_id=${coach_id}` : ''}`,
    claseById: (id) => `/api/v1/clases/${id}`,
    claseDisponibilidad: (id) => `/api/v1/clases/${id}/disponibilidad`,
    claseOcurrenciasCreate: (id) => `/api/v1/clases/${id}/ocurrencias`,
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

describe('clasesApiService write', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpDelete.mockReset()
  })

  test('createClaseApi envia payload con coach_id', async () => {
    httpPost.mockResolvedValue({ id: 10, name: 'Clase', coach_id: 3 })
    const { createClaseApi } = await import('./clasesApiService')
    await createClaseApi({ name: 'Clase', coach_id: 3 })
    expect(httpPost).toHaveBeenCalledWith('/api/v1/clases', { name: 'Clase', coach_id: 3 })
  })

  test('updateClaseApi envia payload con coach_id', async () => {
    httpPut.mockResolvedValue({ id: 11, name: 'Clase', coach_id: 4 })
    const { updateClaseApi } = await import('./clasesApiService')
    await updateClaseApi(11, { name: 'Clase', coach_id: 4 })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/clases/11', { name: 'Clase', coach_id: 4 })
  })

  test('getClasesPaginatedApi llama endpoint paginado', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 2, total: 10, items: [{ id: 1, name: 'A' }] })
    const { getClasesPaginatedApi } = await import('./clasesApiService')
    const result = await getClasesPaginatedApi({ page: 1, pageSize: 2, search: 'slow', discipline: 'slow', status: 'activa', coachId: 4 })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/clases?page=1&page_size=2&search=slow&discipline=slow&status=programada&coach_id=4')
    expect(result.isPaginated).toBe(true)
    expect(result.total).toBe(10)
  })

  test('getClasesApi tolera payload con items', async () => {
    httpGet.mockResolvedValue({ items: [{ id: 2, name: 'B' }] })
    const { getClasesApi } = await import('./clasesApiService')
    const result = await getClasesApi()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/clases?status=programada')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 2, nombre: 'B' })
  })

  test('createClassOccurrenceApi llama endpoint de ocurrencias', async () => {
    httpPost.mockResolvedValue({ id: 77, class_id: 11, occurrence_date: '2026-06-14' })
    const { createClassOccurrenceApi } = await import('./clasesApiService')
    const result = await createClassOccurrenceApi(11, {
      occurrence_date: '2026-06-14',
      start_at: '2026-06-14T09:00:00',
      end_at: '2026-06-14T10:00:00',
      duration_min: 60,
      capacity_max: 20,
      coach_id: 3,
      status: 'programada',
    })
    expect(httpPost).toHaveBeenCalledWith('/api/v1/clases/11/ocurrencias', expect.objectContaining({
      occurrence_date: '2026-06-14',
      start_at: '2026-06-14T09:00:00',
      end_at: '2026-06-14T10:00:00',
      duration_min: 60,
      capacity_max: 20,
      coach_id: 3,
      status: 'programada',
    }))
    expect(result).toMatchObject({ id: 77, occurrenceId: 77 })
  })

  test('deleteClaseApi llama endpoint correcto', async () => {
    httpDelete.mockResolvedValue({ success: true })
    const { deleteClaseApi } = await import('./clasesApiService')
    const result = await deleteClaseApi(7)
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/clases/7')
    expect(result).toMatchObject({ success: true })
  })
})
