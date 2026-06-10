import { describe, expect, it } from 'vitest'
import { buildAdminClientsApiQuery, normalizeAdminClientsPageSize } from './adminClientsApiUtils'

describe('adminClientsApiUtils', () => {
  it('limita page size a 100', () => {
    expect(normalizeAdminClientsPageSize(1000)).toBe(100)
  })

  it('mapea filtros UI al contrato backend', () => {
    expect(buildAdminClientsApiQuery({ filter: 'Activos' }).status).toBe('active')
    expect(buildAdminClientsApiQuery({ filter: 'Sin paquete' }).membershipStatus).toBe('none')
    expect(buildAdminClientsApiQuery({ filter: 'Por vencer' }).membershipStatus).toBe('expired')
  })
})
