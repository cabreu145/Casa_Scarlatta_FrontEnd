import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import { useConfiguracionStore } from '@/stores/configuracionStore'
import {
  useSiteConfigurationQuery,
  useUpdateSiteConfigurationMutation,
  useUploadSiteConfigurationMediaMutation,
} from './useApiQueries'
import { useEffectiveSiteConfiguration } from './useSiteConfiguration'

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
}))

vi.mock('@/services/siteConfigurationApiService', () => ({
  getSiteConfigurationApi: (...args) => apiMocks.get(...args),
  updateSiteConfigurationApi: (...args) => apiMocks.update(...args),
  uploadSiteConfigurationMediaApi: (...args) => apiMocks.upload(...args),
}))

function createWrapper(queryClient) {
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('site configuration queries', () => {
  let queryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    apiMocks.get.mockReset()
    apiMocks.update.mockReset()
    apiMocks.upload.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    queryClient.clear()
  })

  test('loads backend configuration with canonical query key', async () => {
    apiMocks.get.mockResolvedValue({ telefono: 'backend' })

    const { result } = renderHook(
      () => useSiteConfigurationQuery(),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.telefono).toBe('backend')
    expect(queryClient.getQueryData(queryKeys.siteConfiguration.detail())).toEqual({
      telefono: 'backend',
    })
  })

  test('PUT and upload invalidate site configuration and activity', async () => {
    apiMocks.update.mockResolvedValue({ telefono: 'nuevo' })
    apiMocks.upload.mockResolvedValue({ url: '/media/site/image.webp' })
    queryClient.setQueryData(queryKeys.siteConfiguration.detail(), { telefono: 'viejo' })
    queryClient.setQueryData(queryKeys.activity.list({ page: 1 }), { items: [] })

    const updateHook = renderHook(
      () => useUpdateSiteConfigurationMutation(),
      { wrapper: createWrapper(queryClient) }
    )
    await act(async () => {
      await updateHook.result.current.mutateAsync({ telefono: 'nuevo' })
    })

    expect(queryClient.getQueryState(queryKeys.siteConfiguration.detail())?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.activity.list({ page: 1 }))?.isInvalidated).toBe(true)

    queryClient.setQueryData(queryKeys.siteConfiguration.detail(), { telefono: 'nuevo' })
    const uploadHook = renderHook(
      () => useUploadSiteConfigurationMediaMutation(),
      { wrapper: createWrapper(queryClient) }
    )
    await act(async () => {
      await uploadHook.result.current.mutateAsync({
        field: 'imagenStryde',
        file: new File(['x'], 'x.webp', { type: 'image/webp' }),
      })
    })

    expect(queryClient.getQueryState(queryKeys.siteConfiguration.detail())?.isInvalidated).toBe(true)
  })

  test('API mode ignores persisted local configuration when backend responds', async () => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    useConfiguracionStore.setState({
      config: {
        ...useConfiguracionStore.getState().config,
        telefono: 'localStorage',
      },
    })
    apiMocks.get.mockResolvedValue({ telefono: 'backend' })

    const { result } = renderHook(
      () => useEffectiveSiteConfiguration(),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.source).toBe('api'))
    expect(result.current.get('telefono')).toBe('backend')
  })

  test('API off keeps legacy store fallback', () => {
    vi.stubEnv('VITE_USE_API_AUTH', 'false')
    useConfiguracionStore.setState({
      config: {
        ...useConfiguracionStore.getState().config,
        telefono: 'legacy',
      },
    })

    const { result } = renderHook(
      () => useEffectiveSiteConfiguration(),
      { wrapper: createWrapper(queryClient) }
    )

    expect(result.current.source).toBe('legacy')
    expect(result.current.get('telefono')).toBe('legacy')
    expect(apiMocks.get).not.toHaveBeenCalled()
  })
})

