import { describe, expect, test } from 'vitest'
import { mapBackendPackageToFrontend } from './packageAdapter'

describe('packageAdapter', () => {
  test('mantiene name vacÃ­o y displayName para UI', () => {
    const result = mapBackendPackageToFrontend({
      id: 1,
      name: null,
      display_name: '8 clases Â· vÃ¡lido por 30 dÃ­as',
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
      displayName: '8 clases Â· vÃ¡lido por 30 dÃ­as',
      isShareable: true,
      maxBeneficiaries: 1,
    })
  })
})
