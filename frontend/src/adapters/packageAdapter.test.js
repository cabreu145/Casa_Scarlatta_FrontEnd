import { describe, expect, test } from 'vitest'
import { mapBackendPackageToFrontend } from './packageAdapter'

describe('packageAdapter', () => {
  test('mantiene name vacío y displayName para UI', () => {
    const result = mapBackendPackageToFrontend({
      id: 1,
      name: null,
      display_name: '8 clases · válido por 30 días',
      credits: 8,
      price_mxn: 1200,
      duration_days: 30,
      is_active: true,
      is_featured: false,
      benefits: ['Acceso a clases'],
      is_shareable: true,
      max_beneficiaries: 1,
    })

    expect(result).toMatchObject({
      id: 1,
      name: null,
      displayName: '8 clases · válido por 30 días',
      isShareable: true,
      maxBeneficiaries: 1,
    })
  })
})
