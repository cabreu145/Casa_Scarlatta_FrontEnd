import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === null || value === undefined) return fallback
  const raw = String(value).trim().toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  return Boolean(value)
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

export function mapBackendPermissionToFrontend(item = {}) {
  return {
    id: item.id ?? item.permission_id ?? item.permissionId ?? null,
    key: normalizeString(item.key ?? item.permission_key ?? item.permissionKey),
    module: normalizeString(item.module),
    action: normalizeString(item.action),
    label: normalizeString(item.label ?? item.name ?? item.key),
    description: normalizeString(item.description),
    isActive: normalizeBoolean(item.is_active ?? item.isActive, true),
  }
}

export function mapBackendPermissionsToFrontend(payload = {}) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []
  return items.map((item) => mapBackendPermissionToFrontend(item))
}

export function mapBackendRoleToFrontend(item = {}) {
  const rawPermissions = normalizeArray(item.permissions).map((permission) => (
    typeof permission === 'string'
      ? normalizeString(permission)
      : mapBackendPermissionToFrontend(permission)
  ))
  const permissionKeys = normalizeArray(item.permission_keys ?? item.permissionKeys)
    .map((permission) => normalizeString(permission))
    .filter(Boolean)

  return {
    id: item.id ?? item.role_id ?? item.roleId ?? null,
    code: normalizeString(item.code ?? item.role_code ?? item.roleCode),
    name: normalizeString(item.name ?? item.role_name ?? item.roleName),
    description: normalizeString(item.description),
    baseRole: normalizeString(item.base_role ?? item.baseRole),
    isSystem: normalizeBoolean(item.is_system ?? item.isSystem, false),
    isActive: normalizeBoolean(item.is_active ?? item.isActive, true),
    permissionsCount: normalizeNumber(
      item.permissions_count
      ?? item.permissionsCount
      ?? permissionKeys.length
      ?? rawPermissions.length,
      rawPermissions.length || permissionKeys.length
    ),
    permissions: rawPermissions,
    permissionKeys: permissionKeys.length > 0
      ? permissionKeys
      : rawPermissions
        .map((permission) => (typeof permission === 'string' ? permission : permission.key))
        .filter(Boolean),
  }
}

export function mapBackendRolesResponseToFrontend(payload = {}) {
  return normalizePaginatedResponse(payload, mapBackendRoleToFrontend)
}

export function mapBackendRbacUserToFrontend(item = {}) {
  return {
    id: item.id ?? item.user_id ?? item.userId ?? null,
    name: normalizeString(item.name ?? item.nombre ?? item.full_name ?? item.fullName),
    email: normalizeString(item.email),
    status: normalizeString(item.status ?? (normalizeBoolean(item.is_active ?? item.isActive, true) ? 'active' : 'inactive')),
    role: normalizeString(item.role ?? item.rol ?? item.role_code ?? item.roleCode ?? item.role_name ?? item.roleName),
    roleCode: normalizeString(item.role_code ?? item.roleCode ?? item.role ?? item.rol),
    roleName: normalizeString(item.role_name ?? item.roleName ?? item.roleCode ?? item.role_code ?? item.role ?? item.rol),
    permissionOverridesCount: normalizeNumber(item.permission_overrides_count ?? item.permissionOverridesCount, normalizeArray(item.overrides).length),
  }
}

export function mapBackendRbacUsersResponseToFrontend(payload = {}) {
  return normalizePaginatedResponse(payload, mapBackendRbacUserToFrontend)
}

export function mapBackendUserPermissionsToFrontend(payload = {}) {
  return {
    userId: payload.user_id ?? payload.userId ?? payload.id ?? null,
    role: normalizeString(payload.role ?? payload.rol ?? payload.role_code ?? payload.roleCode),
    roleCode: normalizeString(payload.role_code ?? payload.roleCode ?? payload.role ?? payload.rol),
    roleName: normalizeString(payload.role_name ?? payload.roleName ?? payload.roleCode ?? payload.role_code),
    rolePermissions: normalizeArray(payload.role_permissions ?? payload.rolePermissions).map((permission) => (
      typeof permission === 'string'
        ? normalizeString(permission)
        : mapBackendPermissionToFrontend(permission)
    )),
    overrides: normalizeArray(payload.overrides).map((override, index) => ({
      id: override.id ?? `${override.permission_key ?? override.permissionKey ?? 'override'}-${index}`,
      permissionKey: normalizeString(override.permission_key ?? override.permissionKey),
      effect: normalizeString(override.effect),
    })),
    effectivePermissions: normalizeArray(payload.effective_permissions ?? payload.effectivePermissions).map((permission) => (
      typeof permission === 'string'
        ? normalizeString(permission)
        : mapBackendPermissionToFrontend(permission)
    )),
  }
}

export function buildRolePayload(form = {}) {
  return {
    code: normalizeString(form.code).trim().toLowerCase(),
    name: normalizeString(form.name).trim(),
    description: normalizeString(form.description).trim() || null,
    base_role: normalizeString(form.baseRole ?? form.base_role).trim(),
    is_active: normalizeBoolean(form.isActive ?? form.is_active, true),
    permission_keys: normalizeArray(form.permissionKeys ?? form.permission_keys)
      .map((permission) => normalizeString(permission).trim())
      .filter(Boolean),
  }
}

export function buildRoleUpdatePayload(form = {}) {
  const payload = buildRolePayload(form)
  return {
    name: payload.name,
    description: payload.description,
    base_role: payload.base_role,
    is_active: payload.is_active,
  }
}

export function buildRolePermissionsPayload(permissionKeys = []) {
  return {
    permission_keys: normalizeArray(permissionKeys)
      .map((permission) => normalizeString(permission).trim())
      .filter(Boolean),
  }
}

export function buildUserRolePayload(payload = {}) {
  const roleCode = normalizeString(payload.roleCode ?? payload.role_code).trim()
  const roleId = payload.roleId ?? payload.role_id ?? null
  if (roleCode) return { role_code: roleCode }
  if (roleId !== null && roleId !== undefined && roleId !== '') return { role_id: roleId }
  return {}
}

export function buildUserPermissionOverridesPayload(overrides = {}) {
  const list = normalizeArray(overrides.overrides ?? overrides)
  return {
    overrides: list
      .map((override) => ({
        permission_key: normalizeString(override.permissionKey ?? override.permission_key).trim(),
        effect: normalizeString(override.effect).trim().toLowerCase(),
      }))
      .filter((override) => override.permission_key && override.effect),
  }
}
