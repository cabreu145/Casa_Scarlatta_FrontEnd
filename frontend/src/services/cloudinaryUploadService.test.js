import { beforeEach, describe, expect, test, vi } from 'vitest'

const httpPost = vi.fn()

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    cloudinarySignature: '/api/v1/uploads/cloudinary/signature',
  },
}))

vi.mock('@/lib/http', () => ({
  httpPost: (...args) => httpPost(...args),
}))

describe('cloudinaryUploadService', () => {
  beforeEach(() => {
    httpPost.mockReset()
  })

  test('pide firma y sube media a Cloudinary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/site/test.webp',
        public_id: 'site/test',
        resource_type: 'image',
        width: 1200,
        height: 800,
      }),
    })

    vi.stubGlobal('fetch', fetchMock)
    httpPost.mockResolvedValue({
      cloudName: 'demo',
      fields: {
        timestamp: '123',
        signature: 'sig',
        api_key: 'key',
      },
    })

    const { uploadCloudinaryMediaApi } = await import('./cloudinaryUploadService')
    const file = new File(['image'], 'test.webp', { type: 'image/webp' })

    const result = await uploadCloudinaryMediaApi({
      file,
      folder: 'site',
      resourceType: 'image',
      context: 'site_configuration',
      publicIdPrefix: 'site-test',
    })

    expect(httpPost).toHaveBeenCalledWith('/api/v1/uploads/cloudinary/signature', {
      folder: 'site',
      resource_type: 'image',
      context: 'site_configuration',
      public_id_prefix: 'site-test',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.secureUrl).toContain('cloudinary.com')
    expect(result.publicId).toBe('site/test')
    expect(result.width).toBe(1200)
  })
})
