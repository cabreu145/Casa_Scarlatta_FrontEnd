import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapMembershipPackageToFrontend } from '@/adapters/membershipPackageAdapter'

export async function getMembershipPackagesApi() {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
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
<<<<<<< HEAD
=======
  const payload = await httpGet(ENDPOINTS.membershipsPackages)
  if (!Array.isArray(payload)) return []
  return payload
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
    .map((item) => mapMembershipPackageToFrontend(item ?? {}))
    .filter((item) => item.isActive !== false)
}
