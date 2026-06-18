import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { mapBackendClientToFrontend } from '@/adapters/clientAdapter'
import { mapBackendMembershipToFrontend } from '@/adapters/membershipAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import {
  ADMIN_CLIENTS_PAGE_SIZE,
  buildAdminClientsApiQuery,
} from '@/pages/admin/adminClientsApiUtils'

const inFlightClients = new Map()

export async function getClientsPaginatedApi({
  page = 1,
  pageSize = ADMIN_CLIENTS_PAGE_SIZE,
  search,
  status,
  membershipStatus,
} = {}) {
  const query = buildAdminClientsApiQuery({ page, pageSize, search })
  query.status = status || undefined
  query.membershipStatus = membershipStatus || undefined
  const cacheKey = JSON.stringify(query)
  if (inFlightClients.has(cacheKey)) return inFlightClients.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(ENDPOINTS.adminClientsPaginated(query))
    return normalizePaginatedResponse(payload, mapBackendClientToFrontend)
  })()
  inFlightClients.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightClients.delete(cacheKey)
  }
}

export async function createClientApi(payload) {
  return mapBackendClientToFrontend(await httpPost(ENDPOINTS.adminClients, payload))
}

export async function getClientByIdApi(id) {
  return mapBackendClientToFrontend(await httpGet(ENDPOINTS.adminClientById(id)))
}

export async function updateClientApi(id, payload) {
  return mapBackendClientToFrontend(await httpPut(ENDPOINTS.adminClientById(id), payload))
}

export async function deleteClientApi(id) {
  return (await httpDelete(ENDPOINTS.adminClientById(id))) ?? { success: true, id }
}

export async function assignClientPackageApi(id, { packageId, notes, promotionId, beneficiaryUserId } = {}) {
  const body = {
    package_id: Number(packageId),
    notes: String(notes ?? '').trim() || null,
  }
  if (promotionId != null) body.promotion_id = Number(promotionId)
  if (beneficiaryUserId != null) body.beneficiary_user_id = Number(beneficiaryUserId)

  const response = await httpPost(ENDPOINTS.adminClientPackages(id), body)
  return mapBackendClientToFrontend(response)
}

export async function adjustClientCreditsApi(id, { amount, reason = 'manual_adjustment', notes } = {}) {
  const response = await httpPost(ENDPOINTS.adminClientCredits(id), {
    amount: Number(amount),
    reason,
    notes: String(notes ?? '').trim() || null,
  })
  return mapBackendClientToFrontend(response)
}

export async function updateClientMembershipExpirationApi(clientId, membershipId, payload = {}) {
  const response = await httpPatch(ENDPOINTS.clientMembershipExpiration(clientId, membershipId), {
    expires_at: String(payload.expires_at ?? payload.expiresAt ?? '').trim(),
    notes: String(payload.notes ?? '').trim() || null,
  })
  return mapBackendMembershipToFrontend(response)
}
