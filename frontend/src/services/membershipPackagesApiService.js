import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { mapBackendPackageToFrontend, mapBackendPackagesToFrontend } from '@/adapters/packageAdapter'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'
import { buildAdminPackagesApiQuery, ADMIN_PACKAGES_PAGE_SIZE } from '@/pages/admin/adminPackagesApiUtils'
import { buildPackageApiPayload, validatePackageApiPayload } from '@/pages/admin/packageApiPayload'

const inFlightPackages = new Map()

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
  return mapBackendPackagesToFrontend(items).filter((item) => item.isActive !== false)
}

export async function getMembershipPackagesPaginatedApi({
  page = 1,
  pageSize = ADMIN_PACKAGES_PAGE_SIZE,
  status,
  search,
} = {}) {
  const query = buildAdminPackagesApiQuery({ page, pageSize, status, search })
  const cacheKey = JSON.stringify(query)
  if (inFlightPackages.has(cacheKey)) return inFlightPackages.get(cacheKey)

  const request = (async () => {
    const payload = await httpGet(ENDPOINTS.adminMembershipPackagesPaginated(query))
    return normalizePaginatedResponse(payload, mapBackendPackageToFrontend)
  })()
  inFlightPackages.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightPackages.delete(cacheKey)
  }
}

export async function createMembershipPackageApi(form = {}) {
  const payload = buildPackageApiPayload(form)
  const validationError = validatePackageApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendPackageToFrontend(await httpPost(ENDPOINTS.membershipsPackages, payload))
}

export async function updateMembershipPackageApi(id, form = {}) {
  const payload = buildPackageApiPayload(form)
  const validationError = validatePackageApiPayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendPackageToFrontend(await httpPut(ENDPOINTS.adminMembershipPackageById(id), payload))
}

export async function updateMembershipPackageStatusApi(id, isActive) {
  return mapBackendPackageToFrontend(
    await httpPatch(ENDPOINTS.adminMembershipPackageStatusById(id), { is_active: Boolean(isActive) })
  )
}

export async function updateMembershipPackageFeaturedApi(id, isFeatured) {
  return mapBackendPackageToFrontend(
    await httpPatch(ENDPOINTS.adminMembershipPackageFeaturedById(id), { is_featured: Boolean(isFeatured) })
  )
}

export async function deleteMembershipPackageApi(id) {
  const response = await httpDelete(ENDPOINTS.adminMembershipPackageById(id))
  return response ?? { success: true, id }
}
