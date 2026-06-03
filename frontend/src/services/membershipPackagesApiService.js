import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapMembershipPackageToFrontend } from '@/adapters/membershipPackageAdapter'

export async function getMembershipPackagesApi() {
  const packagesEndpoint = ENDPOINTS.membershipsPackages
  if (!packagesEndpoint) {
    throw new Error('MEMBERSHIP_PACKAGES_ENDPOINT_MISSING')
  }

  const payload = await httpGet(packagesEndpoint)
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []
  return items
    .map((item) => mapMembershipPackageToFrontend(item ?? {}))
    .filter((item) => item.isActive !== false)
}
