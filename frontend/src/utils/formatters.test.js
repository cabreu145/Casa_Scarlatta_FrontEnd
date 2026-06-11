import { describe, expect, test } from 'vitest'
import { formatBusinessDateParts, formatBusinessDateTime } from './formatters'

describe('formatters business timezone', () => {
  test('formatBusinessDateTime convierte UTC a America/Merida', () => {
    expect(formatBusinessDateTime('2026-06-10T22:30:00Z')).toBe('10/06/2026, 16:30')
  })

  test('formatBusinessDateParts devuelve hora y fecha local de negocio', () => {
    expect(formatBusinessDateParts('2026-06-10T22:30:00Z')).toMatchObject({
      time: '16:30',
      date: expect.stringContaining('10'),
      location: 'Campeche, Campeche, México',
      offset: 'UTC-6',
    })
  })
})
