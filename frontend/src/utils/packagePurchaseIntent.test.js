import { beforeEach, describe, expect, test } from 'vitest'
import {
  buildPackagePurchaseRedirect,
  clearPendingPackagePurchaseIntent,
  normalizeInternalRedirect,
  readPendingPackagePurchaseIntent,
  savePendingPackagePurchaseIntent,
} from './packagePurchaseIntent'

describe('packagePurchaseIntent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('buildPackagePurchaseRedirect arma dashboard pagos con packageId', () => {
    expect(buildPackagePurchaseRedirect(12)).toBe('/cliente/dashboard?section=pagos&packageId=12')
  })

  test('normalizeInternalRedirect acepta ruta interna y rechaza externa', () => {
    expect(normalizeInternalRedirect('/cliente/dashboard?section=pagos')).toBe('/cliente/dashboard?section=pagos')
    expect(normalizeInternalRedirect('https://evil.com')).toBeNull()
    expect(normalizeInternalRedirect(null)).toBeNull()
  })

  test('save/read/clear pending intent', () => {
    savePendingPackagePurchaseIntent(8)
    expect(readPendingPackagePurchaseIntent()).toEqual({
      packageId: '8',
      redirect: '/cliente/dashboard?section=pagos&packageId=8',
    })

    clearPendingPackagePurchaseIntent()
    expect(readPendingPackagePurchaseIntent()).toEqual({
      packageId: null,
      redirect: null,
    })
  })
})
