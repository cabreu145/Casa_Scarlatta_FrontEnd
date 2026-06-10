import { beforeEach, describe, expect, test } from 'vitest'
import {
  readRecentPaymentReferences,
  removeRecentPaymentReference,
  upsertRecentPaymentReference,
} from './paymentTracking'

describe('paymentTracking', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  test('upsert evita duplicados y mantiene maximo local', () => {
    for (let index = 1; index <= 12; index += 1) {
      upsertRecentPaymentReference({
        externalReference: `ref-${index}`,
        packageId: index,
        amount: index * 100,
        credits: index,
      })
    }

    const refs = readRecentPaymentReferences()
    expect(refs).toHaveLength(10)
    expect(refs[0].externalReference).toBe('ref-12')
    expect(refs[refs.length - 1].externalReference).toBe('ref-3')

    upsertRecentPaymentReference({
      externalReference: 'ref-12',
      packageName: 'Plan Pro',
    })
    const deduped = readRecentPaymentReferences()
    expect(deduped).toHaveLength(10)
    expect(deduped[0].packageName).toBe('Plan Pro')
  })

  test('remove borra solo storage local', () => {
    upsertRecentPaymentReference({ externalReference: 'ref-a', packageId: 1 })
    upsertRecentPaymentReference({ externalReference: 'ref-b', packageId: 2 })

    const next = removeRecentPaymentReference('ref-a')
    expect(next).toHaveLength(1)
    expect(next[0].externalReference).toBe('ref-b')
  })
})
