import { describe, expect, test } from 'vitest'
import { mapBackendMembershipToFrontend } from './membershipAdapter'

describe('membershipAdapter', () => {
  test('mapea memberships compartidas y beneficiarios', () => {
    const result = mapBackendMembershipToFrontend({
      membership_id: 1,
      package_id: 2,
      display_name: 'Mensual 12',
      credits_available: 8,
      credits_total: 12,
      expires_at: '2026-07-07',
      is_shareable: true,
      max_beneficiaries: 1,
      beneficiaries: [
        {
          beneficiary_id: 9,
          email: 'beneficiario@demo.local',
          name: 'Beneficiario Demo',
        },
      ],
    })

    expect(result).toMatchObject({
      membershipId: 1,
      packageId: 2,
      displayName: 'Mensual 12',
      packageName: 'Mensual 12',
      creditsAvailable: 8,
      creditsTotal: 12,
      expiresAt: '2026-07-07',
      isShareable: true,
      maxBeneficiaries: 1,
      beneficiariesCount: 1,
    })
    expect(result.beneficiaries[0]).toMatchObject({
      beneficiaryId: 9,
      email: 'beneficiario@demo.local',
      name: 'Beneficiario Demo',
    })
  })
})
