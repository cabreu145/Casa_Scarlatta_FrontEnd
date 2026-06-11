import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  BASE_URL: 'http://127.0.0.1:8000',
  ENDPOINTS: {
    siteConfiguration: '/api/v1/configuracion/site',
    siteConfigurationUpload: '/api/v1/configuracion/site/upload',
  },
}))

const httpGet = vi.fn()
const httpPut = vi.fn()
const httpPost = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPut: (...args) => httpPut(...args),
  httpPost: (...args) => httpPost(...args),
}))

describe('siteConfigurationApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPut.mockReset()
    httpPost.mockReset()
  })

  test('GET reads public site configuration', async () => {
    httpGet.mockResolvedValue({ telefono: '999' })
    const { getSiteConfigurationApi } = await import('./siteConfigurationApiService')

    const result = await getSiteConfigurationApi()

    expect(httpGet).toHaveBeenCalledWith('/api/v1/configuracion/site')
    expect(result.telefono).toBe('999')
  })

  test('PUT sends canonical partial payload', async () => {
    httpPut.mockResolvedValue({ whatsapp: '52999' })
    const { updateSiteConfigurationApi } = await import('./siteConfigurationApiService')

    await updateSiteConfigurationApi({ whatsapp: '52999' })

    expect(httpPut).toHaveBeenCalledWith(
      '/api/v1/configuracion/site',
      { whatsapp: '52999' }
    )
  })

  test('upload sends field and file with FormData', async () => {
    httpPost.mockResolvedValue({
      url: '/media/site/stryde.webp',
      filename: 'stryde.webp',
    })
    const { uploadSiteConfigurationMediaApi } = await import('./siteConfigurationApiService')
    const file = new File(['image'], 'stryde.webp', { type: 'image/webp' })

    const result = await uploadSiteConfigurationMediaApi({
      field: 'imagenStryde',
      file,
    })

    const [endpoint, body] = httpPost.mock.calls[0]
    expect(endpoint).toBe('/api/v1/configuracion/site/upload')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('field')).toBe('imagenStryde')
    expect(body.get('file')).toBe(file)
    expect(result.url).toBe('http://127.0.0.1:8000/media/site/stryde.webp')
  })
})
