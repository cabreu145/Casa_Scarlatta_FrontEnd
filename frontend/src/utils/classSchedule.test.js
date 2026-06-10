import { describe, expect, test } from 'vitest'
import { formatClassDate, formatClassTime, getClassDisplayDate, getClassDisplayTime, getClassTimeToken } from './classSchedule'

describe('classSchedule', () => {
  test('formatea HH:mm:ss a HH:mm', () => {
    expect(formatClassTime('09:00:00')).toBe('09:00')
  })

  test('formatea HH:mm igual', () => {
    expect(formatClassTime('09:00')).toBe('09:00')
  })

  test('normaliza H:mm a HH:mm', () => {
    expect(formatClassTime('9:00')).toBe('09:00')
  })

  test('extrae hora desde ISO datetime', () => {
    expect(getClassTimeToken({ startAt: '2026-06-02T09:00:00' })).toBe('09:00')
  })

  test('fallback controlado cuando falta hora', () => {
    expect(formatClassTime(null)).toBe('Horario por definir')
    expect(getClassDisplayTime({})).toBe('Horario por definir')
  })

  test('formatea fecha ISO local sin mostrar Sin fecha', () => {
    const formatted = formatClassDate('2026-06-07')
    expect(formatted).not.toBe('Fecha por definir')
    expect(formatted).toMatch(/07|jun/i)
    expect(getClassDisplayDate({ occurrenceDate: '2026-06-07' })).toBe('2026-06-07')
  })

  test('fallback controlado cuando falta fecha', () => {
    expect(formatClassDate(null)).toBe('Fecha por definir')
    expect(formatClassDate(undefined)).toBe('Fecha por definir')
  })
})
