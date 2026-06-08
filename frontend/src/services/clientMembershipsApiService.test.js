import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addClientMembershipBeneficiaryApi,
  addMyMembershipBeneficiaryApi,
  getMyMembershipsApi,
  removeClientMembershipBeneficiaryApi,
  removeMyMembershipBeneficiaryApi,
} from './clientMembershipsApiService'
import * as http from '@/lib/http'

vi.mock('@/lib/http', () => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpDelete: vi.fn(),
}))

describe('clientMembershipsApiService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('carga memberships propias y adapta lista', async () => {
    http.httpGet.mockResolvedValue({
      items: [
        {
          membership_id: 1,
          package_id: 2,
          display_name: 'Mensual 12',
          credits_available: 8,
          credits_total: 12,
          expires_at: '2026-07-07',
          is_shareable: true,
          max_beneficiaries: 1,
          beneficiaries: [{ beneficiary_id: 9, email: 'b@demo.local' }],
        },
      ],
    })

    const items = await getMyMembershipsApi()

    expect(http.httpGet).toHaveBeenCalled()
    expect(items[0]).toMatchObject({
      membershipId: 1,
      packageId: 2,
      displayName: 'Mensual 12',
      creditsAvailable: 8,
      creditsTotal: 12,
      isShareable: true,
      maxBeneficiaries: 1,
      beneficiaries: [expect.objectContaining({ beneficiaryId: 9, email: 'b@demo.local' })],
    })
  })

  it('agrega y quita beneficiarios', async () => {
    http.httpPost.mockResolvedValue({ membership_id: 1 })
    http.httpDelete.mockResolvedValue({ success: true })

    await addMyMembershipBeneficiaryApi(1, 'beneficiario@demo.local')
    expect(http.httpPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/clientes\/me\/memberships\/1\/beneficiaries$/),
      { email: 'beneficiario@demo.local' }
    )

    await removeMyMembershipBeneficiaryApi(1, 9)
    expect(http.httpDelete).toHaveBeenCalledWith(
      expect.stringMatching(/\/clientes\/me\/memberships\/1\/beneficiaries\/9$/)
    )
  })

  it('admin agrega y quita beneficiarios', async () => {
    http.httpPost.mockResolvedValue({ membership_id: 1 })
    http.httpDelete.mockResolvedValue({ success: true })

    await addClientMembershipBeneficiaryApi(7, 1, 'beneficiario@demo.local')
    expect(http.httpPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/clientes\/7\/memberships\/1\/beneficiaries$/),
      { email: 'beneficiario@demo.local' }
    )

    await removeClientMembershipBeneficiaryApi(7, 1, 9)
    expect(http.httpDelete).toHaveBeenCalledWith(
      expect.stringMatching(/\/clientes\/7\/memberships\/1\/beneficiaries\/9$/)
    )
  })
})
