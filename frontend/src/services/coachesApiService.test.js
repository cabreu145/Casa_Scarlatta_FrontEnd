import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    coaches: '/api/v1/coaches',
    publicCoaches: '/api/v1/coaches/public',
    uploadCoachAvatar: (id) => `/api/v1/coaches/${id}/avatar`,
    coachesPaginated: ({ page, pageSize, search, status }) =>
      `/api/v1/coaches?page=${page}&page_size=${pageSize}&search=${search ?? ''}&status=${status ?? ''}`,
    coachById: (id) => `/api/v1/coaches/${id}`,
    coachStatusById: (id) => `/api/v1/coaches/${id}/status`,
  },
}))

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

describe('coachesApiService', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpPatch.mockReset()
    httpDelete.mockReset()
  })

  test('consulta coaches y mapea ids canónicos', async () => {
    httpGet.mockResolvedValue([{ id: 1, name: 'Coach Uno' }])
    const { getCoachesApi } = await import('./coachesApiService')
    const rows = await getCoachesApi()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/coaches')
    expect(rows[0].coachId).toBe(1)
  })

  test('consulta coaches públicos', async () => {
    httpGet.mockResolvedValue([{ coach_id: 2, name: 'Coach Público' }])
    const { getPublicCoachesApi } = await import('./coachesApiService')
    const rows = await getPublicCoachesApi()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/coaches/public')
    expect(rows[0].coachId).toBe(2)
  })

  test('consulta coaches paginados y respeta filtros', async () => {
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 20,
      total: 1,
      items: [{ coach_id: 5, name: 'Coach API' }],
    })
    const { getCoachesPaginatedApi } = await import('./coachesApiService')
    const result = await getCoachesPaginatedApi({ page: 1, pageSize: 20, search: 'demo', status: 'active' })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/coaches?page=1&page_size=20&search=demo&status=active')
    expect(result.items[0].coachId).toBe(5)
    expect(result.total).toBe(1)
  })

  test('consulta coaches paginados usa page size seguro por defecto y deduplica in-flight', async () => {
    let resolveRequest
    const request = new Promise((resolve) => {
      resolveRequest = resolve
    })
    httpGet.mockReturnValue(request)
    const { getCoachesPaginatedApi } = await import('./coachesApiService')
    const promiseA = getCoachesPaginatedApi()
    const promiseB = getCoachesPaginatedApi()

    resolveRequest({
      page: 1,
      page_size: 100,
      total: 0,
      items: [],
    })

    const [resultA, resultB] = await Promise.all([promiseA, promiseB])
    expect(httpGet).toHaveBeenCalledTimes(1)
    expect(httpGet).toHaveBeenCalledWith('/api/v1/coaches?page=1&page_size=100&search=&status=')
    expect(resultA.total).toBe(0)
    expect(resultB.total).toBe(0)
  })

  test('crea, actualiza, cambia status y elimina coach', async () => {
    httpPost.mockResolvedValue({ coach_id: 9, name: 'Coach Nuevo' })
    httpPut.mockResolvedValue({ coach_id: 9, name: 'Coach Editado' })
    httpPatch.mockResolvedValue({ coach_id: 9, name: 'Coach Editado' })
    httpDelete.mockResolvedValue({ success: true })
    const { createCoachApi, updateCoachApi, updateCoachStatusApi, deleteCoachApi } = await import('./coachesApiService')

    await createCoachApi({ name: 'Coach Nuevo' })
    await updateCoachApi(9, { name: 'Coach Editado' })
    await updateCoachStatusApi(9, 'inactive')
    await deleteCoachApi(9)

    expect(httpPost).toHaveBeenCalledWith('/api/v1/coaches', { name: 'Coach Nuevo' })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/coaches/9', { name: 'Coach Editado' })
    expect(httpPatch).toHaveBeenCalledWith('/api/v1/coaches/9/status', { status: 'inactive' })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/coaches/9')
  })

  test('sube avatar de coach con FormData', async () => {
    httpPost.mockResolvedValue({ coach_id: 9, avatar_url: '/media/coaches/demo.png' })
    const { uploadCoachAvatarApi } = await import('./coachesApiService')
    const file = new File(['demo'], 'coach.png', { type: 'image/png' })

    const result = await uploadCoachAvatarApi(9, file)

    expect(httpPost).toHaveBeenCalledTimes(1)
    const [endpoint, body] = httpPost.mock.calls[0]
    expect(endpoint).toBe('/api/v1/coaches/9/avatar')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
    expect(result.coachId).toBe(9)
    expect(result.avatarUrl).toContain('/media/coaches/demo.png')
  })
})
