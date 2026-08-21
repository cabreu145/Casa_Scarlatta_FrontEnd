import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapCreditMovement, mapFinancialStateToFrontend } from '@/adapters/financialStateAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'

export async function getMyFinancialStateApi() {
  const payload = await httpGet(ENDPOINTS.miEstadoFinanciero)
  return mapFinancialStateToFrontend(payload ?? {})
}

export async function getMyCreditMovementsPaginatedApi({ page = 1, pageSize = 20, membershipId } = {}) {
  const payload = await httpGet(ENDPOINTS.miCreditMovements({ page, pageSize, membershipId }))
  return normalizePaginatedResponse(payload, (item) => mapCreditMovement(item ?? {}))
}
