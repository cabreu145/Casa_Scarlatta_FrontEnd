import { describe, expect, it } from 'vitest'
import {
  canAccessAdminSection,
  getUserPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isRole,
} from './permissions'

describe('permissions helpers', () => {
  const user = {
    rol: 'admin',
    roleCode: 'admin',
    permissions: ['roles.read', 'pay_table.read', 'pos.sell'],
  }

  it('normaliza permisos de usuario', () => {
    expect(getUserPermissions(user)).toEqual(['roles.read', 'pay_table.read', 'pos.sell'])
  })

  it('hasPermission / hasAny / hasAll funcionan', () => {
    expect(hasPermission(user, 'roles.read')).toBe(true)
    expect(hasAnyPermission(user, ['finance.read', 'pos.sell'])).toBe(true)
    expect(hasAllPermissions(user, ['roles.read', 'pay_table.read'])).toBe(true)
    expect(hasAllPermissions(user, ['roles.read', 'finance.read'])).toBe(false)
  })

  it('isRole detecta roleCode y rol legacy', () => {
    expect(isRole(user, 'admin')).toBe(true)
    expect(isRole(user, 'cliente')).toBe(false)
  })

  it('canAccessAdminSection usa permisos declarados', () => {
    expect(canAccessAdminSection(user, 'reportes')).toBe(false)
    expect(canAccessAdminSection(user, 'configuracion')).toBe(true)
    expect(canAccessAdminSection(user, 'pos')).toBe(true)
  })

  it('sin finance.read no ve Finanzas', () => {
    expect(canAccessAdminSection(user, 'finanzas')).toBe(false)
  })

  it('cajero_pos ve POS pero no Finanzas, Reportes ni Configuracion RBAC', () => {
    const cashier = {
      rol: 'cajero_pos',
      roleCode: 'cajero_pos',
      permissions: ['pos.read', 'pos.sell'],
    }

    expect(canAccessAdminSection(cashier, 'pos')).toBe(true)
    expect(canAccessAdminSection(cashier, 'finanzas')).toBe(false)
    expect(canAccessAdminSection(cashier, 'reportes')).toBe(false)
    expect(canAccessAdminSection(cashier, 'configuracion')).toBe(false)
  })

  it('pay_table.read y pay_table.manage quedan disponibles via permisos directos', () => {
    const payTableViewer = {
      rol: 'admin',
      roleCode: 'admin',
      permissions: ['pay_table.read'],
    }
    const payTableManager = {
      rol: 'admin',
      roleCode: 'admin',
      permissions: ['pay_table.manage'],
    }

    expect(hasPermission(payTableViewer, 'pay_table.read')).toBe(true)
    expect(hasPermission(payTableViewer, 'pay_table.manage')).toBe(false)
    expect(hasPermission(payTableManager, 'pay_table.manage')).toBe(true)
  })
})
