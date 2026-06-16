import { describe, expect, test } from 'vitest'
import { getDisciplineBadgeLabel, normalizeDiscipline } from './discipline'

describe('discipline utils', () => {
  test('normalizeDiscipline reconoce Stryde X', () => {
    expect(normalizeDiscipline('Stryde X')).toBe('stryde')
    expect(normalizeDiscipline('STRYDE X')).toBe('stryde')
    expect(normalizeDiscipline('stride')).toBe('stryde')
  })

  test('normalizeDiscipline reconoce Slow', () => {
    expect(normalizeDiscipline('Slow')).toBe('slow')
    expect(normalizeDiscipline('SLOW')).toBe('slow')
  })

  test('usa fallback textual cuando discipline viene vacío', () => {
    expect(normalizeDiscipline(null, 'Clase STRYDE X')).toBe('stryde')
    expect(getDisciplineBadgeLabel(null, 'Slow restore')).toBe('SLOW')
  })
})
