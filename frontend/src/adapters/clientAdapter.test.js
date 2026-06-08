import { describe, expect, it } from 'vitest'
import { mapBackendClientToFrontend } from './clientAdapter'

describe('clientAdapter', () => {
  it('adapta listado y membresia activa', () => {
    const client = mapBackendClientToFrontend({
      id: 7,
      name: 'Cliente API',
      email: 'cliente@api.local',
      phone: '555',
      status: 'active',
      credits_balance: 8,
      active_membership: {
        membership_id: 2,
        package_id: 3,
        package_name: 'Mensual 12',
        credits_total: 12,
        credits_available: 8,
        expires_at: '2026-07-07',
      },
      last_visit: '2026-06-07',
      reservations_count: 4,
    })

    expect(client.id).toBe(7)
    expect(client.creditsBalance).toBe(8)
    expect(client.activeMembership.packageId).toBe(3)
    expect(client.paquete).toBe('Mensual 12')
    expect(client.clasesPaquete).toBe(8)
    expect(client.lastVisit).toBe('2026-06-07')
    expect(client.reservationsCount).toBe(4)
  })

  it('adapta detalle y tolera membresia nula', () => {
    const client = mapBackendClientToFrontend({
      id: 8,
      active_membership: null,
      recent_credit_movements: [{ id: 1 }],
      recent_reservations: [{ id: 2 }],
    })
    expect(client.activeMembership).toBeNull()
    expect(client.recentCreditMovements[0]).toEqual(expect.objectContaining({ id: 1, amount: 0 }))
    expect(client.recentReservations[0]).toEqual(expect.objectContaining({ id: 2, claseNombre: 'Clase' }))
  })
})
