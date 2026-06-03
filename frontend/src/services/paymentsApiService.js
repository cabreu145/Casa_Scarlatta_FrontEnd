import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import {
  mapCheckoutPreferenceToFrontend,
  mapPaymentStatusToFrontend,
} from '@/adapters/paymentAdapter'

export async function createCheckoutPreferenceApi({ packageId }) {
  const payload = await httpPost(ENDPOINTS.createPaymentCheckoutPreference, {
    package_id: packageId,
  })
  return mapCheckoutPreferenceToFrontend(payload || {})
}

export async function getPaymentStatusApi({ externalReference }) {
  const payload = await httpGet(ENDPOINTS.getPaymentStatus({ externalReference }))
  return mapPaymentStatusToFrontend(payload || {})
}
