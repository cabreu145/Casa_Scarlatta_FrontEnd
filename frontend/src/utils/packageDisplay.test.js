import { describe, expect, test } from 'vitest'
import {
  formatPackageCreditsLabel,
  formatPackageValidityLabel,
  getPackageDisplayName,
} from './packageDisplay'

describe('packageDisplay', () => {
  test('displayName fallback usa display_name cuando name vacio', () => {
    expect(getPackageDisplayName({ name: '', display_name: '1 clase · válido por 7 días' })).toBe('1 clase · válido por 7 días')
  })

  test('formatPackageCreditsLabel pluraliza bien', () => {
    expect(formatPackageCreditsLabel(1)).toBe('1 clase')
    expect(formatPackageCreditsLabel(8)).toBe('8 clases')
  })

  test('formatPackageValidityLabel pluraliza bien', () => {
    expect(formatPackageValidityLabel(1)).toBe('Válido por 1 día')
    expect(formatPackageValidityLabel(7)).toBe('Válido por 7 días')
  })
})
