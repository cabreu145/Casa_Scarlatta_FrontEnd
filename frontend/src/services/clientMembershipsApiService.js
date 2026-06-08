import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPost } from '@/lib/http'
import {
  mapBackendMembershipToFrontend,
  mapBackendMembershipsToFrontend,
} from '@/adapters/membershipAdapter'

function getMembershipItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.memberships)) return payload.memberships
  return []
}

function buildEmailPayload(email) {
  return { email: String(email ?? '').trim() }
}

export async function getMyMembershipsApi() {
  const endpoint = ENDPOINTS.clientMemberships
  if (!endpoint) throw new Error('CLIENT_MEMBERSHIPS_ENDPOINT_MISSING')
  const payload = await httpGet(endpoint)
  return mapBackendMembershipsToFrontend(getMembershipItems(payload))
}

export async function addMyMembershipBeneficiaryApi(membershipId, email) {
  const endpoint = ENDPOINTS.clientMembershipBeneficiaries(membershipId)
  if (!endpoint) throw new Error('CLIENT_MEMBERSHIP_BENEFICIARY_ENDPOINT_MISSING')
  const payload = await httpPost(endpoint, buildEmailPayload(email))
  return mapBackendMembershipToFrontend(payload)
}

export async function removeMyMembershipBeneficiaryApi(membershipId, beneficiaryId) {
  const endpoint = ENDPOINTS.clientMembershipBeneficiaryById(membershipId, beneficiaryId)
  if (!endpoint) throw new Error('CLIENT_MEMBERSHIP_BENEFICIARY_ENDPOINT_MISSING')
  const payload = await httpDelete(endpoint)
  return payload ?? { success: true, membershipId, beneficiaryId }
}

export async function addClientMembershipBeneficiaryApi(clientId, membershipId, email) {
  const endpoint = ENDPOINTS.adminClientMembershipBeneficiaries(clientId, membershipId)
  if (!endpoint) throw new Error('ADMIN_CLIENT_MEMBERSHIP_BENEFICIARY_ENDPOINT_MISSING')
  const payload = await httpPost(endpoint, buildEmailPayload(email))
  return mapBackendMembershipToFrontend(payload)
}

export async function removeClientMembershipBeneficiaryApi(clientId, membershipId, beneficiaryId) {
  const endpoint = ENDPOINTS.adminClientMembershipBeneficiaryById(clientId, membershipId, beneficiaryId)
  if (!endpoint) throw new Error('ADMIN_CLIENT_MEMBERSHIP_BENEFICIARY_ENDPOINT_MISSING')
  const payload = await httpDelete(endpoint)
  return payload ?? { success: true, clientId, membershipId, beneficiaryId }
}
