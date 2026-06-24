import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPatch, httpPost } from '@/lib/http'

export async function buscarClientePorEmailApi(email) {
  return httpGet(ENDPOINTS.clienteBuscarPorEmail(email))
}
import {
  mapCheckoutPreferenceToFrontend,
  mapPaymentStatusToFrontend,
} from '@/adapters/paymentAdapter'
import { mapClientPaymentHistoryItemToFrontend } from '@/adapters/clientPaymentHistoryAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'

export async function createCheckoutPreferenceApi({ packageId, promotionId = null, beneficiaryUserId = null }) {
  const checkoutPreferenceEndpoint = ENDPOINTS.createPaymentCheckoutPreference
  if (!checkoutPreferenceEndpoint) {
    throw new Error('PAYMENT_CHECKOUT_ENDPOINT_MISSING')
  }

  const body = { package_id: packageId }
  if (promotionId != null) body.promotion_id = Number(promotionId)
  if (beneficiaryUserId != null) body.beneficiary_user_id = Number(beneficiaryUserId)

  const payload = await httpPost(checkoutPreferenceEndpoint, body)
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

export async function getClientPaymentsAdminApi({ clientId, page, pageSize, status } = {}) {
  const payload = await httpGet(ENDPOINTS.adminClientPayments(clientId, { page, pageSize, status }))
  return normalizePaginatedResponse(payload, (item) => mapClientPaymentHistoryItemToFrontend(item ?? {}))
}

export async function cancelPendingPaymentAdminApi({ externalReference }) {
  return httpPatch(ENDPOINTS.adminCancelPendingPayment(externalReference))
}
