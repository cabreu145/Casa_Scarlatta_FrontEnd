import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapMembershipPackageToFrontend } from '@/adapters/membershipPackageAdapter'

export async function getMembershipPackagesApi() {
  const payload = await httpGet(ENDPOINTS.membershipsPackages)
  if (!Array.isArray(payload)) return []
  return payload
    .map((item) => mapMembershipPackageToFrontend(item ?? {}))
    .filter((item) => item.isActive !== false)
}
