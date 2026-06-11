import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import {
  buildRolePayload,
  buildRolePermissionsPayload,
  buildRoleUpdatePayload,
  buildUserPermissionOverridesPayload,
  buildUserRolePayload,
  mapBackendPermissionsToFrontend,
  mapBackendRoleToFrontend,
  mapBackendRolesResponseToFrontend,
  mapBackendRbacUsersResponseToFrontend,
  mapBackendUserPermissionsToFrontend,
} from '@/adapters/rbacAdapter'

export async function getPermissionsApi() {
  return mapBackendPermissionsToFrontend(await httpGet(ENDPOINTS.rbacPermissions))
}

export async function getRolesApi(params = {}) {
  return mapBackendRolesResponseToFrontend(await httpGet(ENDPOINTS.rbacRolesPaginated(params)))
}

export async function getRoleByIdApi(roleId) {
  return mapBackendRoleToFrontend(await httpGet(ENDPOINTS.rbacRoleById(roleId)))
}

export async function createRoleApi(payload = {}) {
  return mapBackendRoleToFrontend(await httpPost(ENDPOINTS.rbacRoles, buildRolePayload(payload)))
}

export async function updateRoleApi(roleId, payload = {}) {
  return mapBackendRoleToFrontend(await httpPut(ENDPOINTS.rbacRoleById(roleId), buildRoleUpdatePayload(payload)))
}

export async function updateRolePermissionsApi(roleId, permissionKeys = []) {
  return mapBackendRoleToFrontend(
    await httpPut(ENDPOINTS.rbacRolePermissionsById(roleId), buildRolePermissionsPayload(permissionKeys))
  )
}

export async function deleteRoleApi(roleId) {
  return (await httpDelete(ENDPOINTS.rbacRoleById(roleId))) ?? { success: true, id: roleId }
}

export async function getRbacUsersApi(params = {}) {
  return mapBackendRbacUsersResponseToFrontend(await httpGet(ENDPOINTS.rbacUsersPaginated(params)))
}

export async function updateUserRoleApi(userId, payload = {}) {
  return httpPatch(ENDPOINTS.rbacUserRoleById(userId), buildUserRolePayload(payload))
}

export async function getUserEffectivePermissionsApi(userId) {
  return mapBackendUserPermissionsToFrontend(await httpGet(ENDPOINTS.rbacUserPermissionsById(userId)))
}

export async function updateUserPermissionOverridesApi(userId, overrides = {}) {
  return mapBackendUserPermissionsToFrontend(
    await httpPut(ENDPOINTS.rbacUserPermissionsById(userId), buildUserPermissionOverridesPayload(overrides))
  )
}
