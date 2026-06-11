import { useCallback, useMemo } from 'react'
import { mapBackendSiteConfigurationToFrontend } from '@/adapters/siteConfigurationAdapter'
import { useSiteConfigurationQuery } from '@/hooks/useApiQueries'
import { CONFIG_DEFAULTS, useConfiguracionStore } from '@/stores/configuracionStore'

export function isSiteConfigurationApiMode() {
  const explicitFlag = import.meta.env.VITE_USE_API_SITE_CONFIGURATION
  if (explicitFlag !== undefined) return explicitFlag === 'true'
  return import.meta.env.VITE_USE_API_AUTH === 'true'
}

export function useEffectiveSiteConfiguration() {
  const store = useConfiguracionStore()
  const apiMode = isSiteConfigurationApiMode()
  const query = useSiteConfigurationQuery({ enabled: apiMode })
  const defaults = useMemo(
    () => mapBackendSiteConfigurationToFrontend(CONFIG_DEFAULTS),
    []
  )

  const config = useMemo(() => {
    if (!apiMode) return mapBackendSiteConfigurationToFrontend(store.config)
    if (query.data) return query.data
    if (query.isError) return mapBackendSiteConfigurationToFrontend(store.config)
    return defaults
  }, [apiMode, defaults, query.data, query.isError, store.config])

  const get = useCallback(
    (key) => config[key] ?? defaults[key],
    [config, defaults]
  )

  return {
    ...query,
    apiMode,
    config,
    get,
    source: apiMode
      ? query.data
        ? 'api'
        : query.isError
          ? 'legacy-fallback'
          : 'defaults'
      : 'legacy',
  }
}

