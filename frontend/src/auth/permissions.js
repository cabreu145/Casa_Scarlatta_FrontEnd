const DEFAULT_ROLE = 'cliente'

export const ADMIN_SECTION_PERMISSIONS = {
  dashboard: ['dashboard.read'],
  coaches: ['coaches.read'],
  clases: ['classes.read'],
  paquetes: ['packages.read'],
  pos: ['pos.read', 'pos.sell', 'pos.products.manage'],
  usuarios: ['users.read', 'clients.read'],
  finanzas: ['finance.read'],
  gastos: ['expenses.read', 'expenses.manage'],
  cortes: ['cash_closings.read', 'cash_closings.execute'],
  reportes: ['reports.read'],
  actividad: ['activity.read'],
  configuracion: ['settings.read', 'email_config.read', 'email_outbox.read', 'roles.read'],
}

export function getUserPermissions(user) {
  if (!user || !Array.isArray(user.permissions)) return []
  return user.permissions
    .map((permission) => String(permission ?? '').trim())
    .filter(Boolean)
}

export function hasPermission(user, permissionKey) {
  if (!permissionKey) return false
  return getUserPermissions(user).includes(String(permissionKey))
}

export function hasAnyPermission(user, permissionKeys = []) {
  const normalizedKeys = Array.isArray(permissionKeys) ? permissionKeys.filter(Boolean) : []
  if (normalizedKeys.length === 0) return false
  const permissions = getUserPermissions(user)
  return normalizedKeys.some((key) => permissions.includes(String(key)))
}

export function hasAllPermissions(user, permissionKeys = []) {
  const normalizedKeys = Array.isArray(permissionKeys) ? permissionKeys.filter(Boolean) : []
  if (normalizedKeys.length === 0) return false
  const permissions = getUserPermissions(user)
  return normalizedKeys.every((key) => permissions.includes(String(key)))
}

export function isRole(user, roleCode) {
  if (!roleCode) return false
  const normalizedRole = String(roleCode)
  const currentRole = user?.roleCode ?? user?.role ?? user?.rol ?? DEFAULT_ROLE
  return String(currentRole) === normalizedRole
}

export function canAccessAdminSection(user, sectionId) {
  const requiredPermissions = ADMIN_SECTION_PERMISSIONS[sectionId] ?? []
  if (requiredPermissions.length === 0) return true
  return hasAnyPermission(user, requiredPermissions)
}
