import { describe, expect, test } from 'vitest'
import { mapMembershipPackageToFrontend } from './membershipPackageAdapter'

describe('membershipPackageAdapter', () => {
  test('mapea catalogo backend a shape frontend', () => {
    const result = mapMembershipPackageToFrontend({
      id: 2,
      name: 'Mensual 12',
      display_name: 'Mensual 12',
      credits: 12,
      price_mxn: 2100,
      duration_days: 30,
      is_active: true,
      is_featured: true,
      description: 'Plan mensual',
      benefits: ['Acceso a clases', 'Reserva prioritaria'],
      is_shareable: true,
      max_beneficiaries: 1,
    })

    expect(result).toMatchObject({
      id: 2,
      nombre: 'Mensual 12',
      name: 'Mensual 12',
      displayName: 'Mensual 12',
      precio: 2100,
      creditos: 12,
      clases: 12,
      vigencia: '30 días',
      durationDays: 30,
      isActive: true,
      active: true,
      activo: true,
      isFeatured: true,
      featured: true,
      destacado: true,
      isShareable: true,
      maxBeneficiaries: 1,
      descripcion: 'Plan mensual',
      beneficios: ['Acceso a clases', 'Reserva prioritaria'],
      benefits: ['Acceso a clases', 'Reserva prioritaria'],
    })
    expect(result.raw).toMatchObject({
      id: 2,
      name: 'Mensual 12',
      credits: 12,
      price_mxn: 2100,
      duration_days: 30,
      is_active: true,
      is_featured: true,
      description: 'Plan mensual',
      benefits: ['Acceso a clases', 'Reserva prioritaria'],
      is_shareable: true,
      max_beneficiaries: 1,
    })
  })

  test('usa display_name cuando name viene vacío', () => {
    const result = mapMembershipPackageToFrontend({
      id: 3,
      name: ' ',
      display_name: 'Mensual 16',
      credits: 16,
      price_mxn: 2400,
      duration_days: 30,
      is_shareable: false,
      max_beneficiaries: 0,
    })

    expect(result.name).toBe('Mensual 16')
    expect(result.displayName).toBe('Mensual 16')
    expect(result.isShareable).toBe(false)
    expect(result.maxBeneficiaries).toBe(0)
  })
})
