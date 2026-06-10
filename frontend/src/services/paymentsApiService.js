import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import {
  mapCheckoutPreferenceToFrontend,
  mapPaymentStatusToFrontend,
} from '@/adapters/paymentAdapter'

export async function createCheckoutPreferenceApi({ packageId }) {
  const checkoutPreferenceEndpoint = ENDPOINTS.createPaymentCheckoutPreference
  if (!checkoutPreferenceEndpoint) {
    throw new Error('PAYMENT_CHECKOUT_ENDPOINT_MISSING')
  }

  const payload = await httpPost(checkoutPreferenceEndpoint, {
    package_id: packageId,
  })
  return mapCheckoutPreferenceToFrontend(payload || {})
}

export async function getPaymentStatusApi({ externalReference }) {
  const paymentStatusEndpoint = ENDPOINTS.getPaymentStatus
  if (!paymentStatusEndpoint) {
    throw new Error('PAYMENT_STATUS_ENDPOINT_MISSING')
  }

  const payload = await httpGet(paymentStatusEndpoint({ externalReference }))
  return mapPaymentStatusToFrontend(payload || {})
}
