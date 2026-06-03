import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import {
  mapCheckoutPreferenceToFrontend,
  mapPaymentStatusToFrontend,
} from '@/adapters/paymentAdapter'

export async function createCheckoutPreferenceApi({ packageId }) {
<<<<<<< HEAD
  const checkoutPreferenceEndpoint = ENDPOINTS.createPaymentCheckoutPreference
  if (!checkoutPreferenceEndpoint) {
    throw new Error('PAYMENT_CHECKOUT_ENDPOINT_MISSING')
  }

  const payload = await httpPost(checkoutPreferenceEndpoint, {
=======
  const payload = await httpPost(ENDPOINTS.createPaymentCheckoutPreference, {
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    package_id: packageId,
  })
  return mapCheckoutPreferenceToFrontend(payload || {})
}

export async function getPaymentStatusApi({ externalReference }) {
<<<<<<< HEAD
  const paymentStatusEndpoint = ENDPOINTS.getPaymentStatus
  if (!paymentStatusEndpoint) {
    throw new Error('PAYMENT_STATUS_ENDPOINT_MISSING')
  }

  const payload = await httpGet(paymentStatusEndpoint({ externalReference }))
=======
  const payload = await httpGet(ENDPOINTS.getPaymentStatus({ externalReference }))
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  return mapPaymentStatusToFrontend(payload || {})
}
