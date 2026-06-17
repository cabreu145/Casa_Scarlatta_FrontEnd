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
      limitOneSpotPerOccurrence: true,
    })

    expect(result).toMatchObject({
      id: 1,
      name: null,
      displayName: '8 clases · válido por 30 días',
      isShareable: true,
      maxBeneficiaries: 1,
      limitOneSpotPerOccurrence: true,
    })
  })

  test('default false cuando backend no manda límite por clase', () => {
    const result = mapBackendPackageToFrontend({
      id: 2,
      name: 'Pack normal',
      credits: 4,
      price_mxn: 800,
      duration_days: 15,
      is_active: true,
      is_featured: false,
      benefits: [],
    })

    expect(result.limitOneSpotPerOccurrence).toBe(false)
  })
})
