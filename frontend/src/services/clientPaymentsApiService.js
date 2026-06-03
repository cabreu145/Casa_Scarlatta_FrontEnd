import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapClientPaymentHistoryItemToFrontend } from '@/adapters/clientPaymentHistoryAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'

export async function getMyPaymentsApi({ page = 1, pageSize = 10, status } = {}) {
  const endpointFactory = ENDPOINTS.clientPayments
  if (!endpointFactory) {
    throw new Error('CLIENT_PAYMENTS_ENDPOINT_MISSING')
  }

  const payload = await httpGet(endpointFactory({ page, pageSize, status }))
  return normalizePaginatedResponse(
    payload,
    (item) => mapClientPaymentHistoryItemToFrontend(item ?? {})
  )
}

