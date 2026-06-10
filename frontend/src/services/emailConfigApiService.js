import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost, httpPut } from '@/lib/http'
import {
  mapBackendEmailConfigToFrontend,
  mapFrontendEmailConfigPayloadToBackend,
} from '@/adapters/emailConfigAdapter'

export async function getEmailConfigApi() {
  return mapBackendEmailConfigToFrontend(await httpGet(ENDPOINTS.configuracionEmail))
}

export async function updateEmailConfigApi(payload = {}) {
  return mapBackendEmailConfigToFrontend(
    await httpPut(ENDPOINTS.configuracionEmail, mapFrontendEmailConfigPayloadToBackend(payload))
  )
}

export async function sendTestEmailApi({ toEmail } = {}) {
  return httpPost(ENDPOINTS.emailTest, { to_email: toEmail })
}
