import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    clases: '/api/v1/clases',
    clasesList: '/api/v1/clases',
    claseById: (id) => `/api/v1/clases/${id}`,
    claseDisponibilidad: (id) => `/api/v1/clases/${id}/disponibilidad`,
  },
}))

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
  httpPut: (...args) => httpPut(...args),
}))

describe('clasesApiService write', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
  })

  test('createClaseApi envía payload con coach_id', async () => {
    httpPost.mockResolvedValue({ id: 10, name: 'Clase', coach_id: 3 })
    const { createClaseApi } = await import('./clasesApiService')
    await createClaseApi({ name: 'Clase', coach_id: 3 })
    expect(httpPost).toHaveBeenCalledWith('/api/v1/clases', { name: 'Clase', coach_id: 3 })
  })

  test('updateClaseApi envía payload con coach_id', async () => {
    httpPut.mockResolvedValue({ id: 11, name: 'Clase', coach_id: 4 })
    const { updateClaseApi } = await import('./clasesApiService')
    await updateClaseApi(11, { name: 'Clase', coach_id: 4 })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/clases/11', { name: 'Clase', coach_id: 4 })
  })
})
