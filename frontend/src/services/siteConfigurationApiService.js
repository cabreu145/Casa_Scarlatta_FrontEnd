import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost, httpPut } from '@/lib/http'
import {
  mapBackendSiteConfigurationToFrontend,
  resolveSiteMediaUrl,
  toSiteConfigurationPayload,
} from '@/adapters/siteConfigurationAdapter'

export async function getSiteConfigurationApi() {
  return mapBackendSiteConfigurationToFrontend(
    await httpGet(ENDPOINTS.siteConfiguration)
  )
}

export async function updateSiteConfigurationApi(payload = {}) {
  return mapBackendSiteConfigurationToFrontend(
    await httpPut(ENDPOINTS.siteConfiguration, toSiteConfigurationPayload(payload))
  )
}

export async function uploadSiteConfigurationMediaApi({ field, file } = {}) {
  if (!field || !file) throw new Error('SITE_MEDIA_UPLOAD_REQUIRED')
  const formData = new FormData()
  formData.append('field', field)
  formData.append('file', file)
  const response = await httpPost(ENDPOINTS.siteConfigurationUpload, formData)
  return {
    ...response,
    url: resolveSiteMediaUrl(response?.url),
  }
}
