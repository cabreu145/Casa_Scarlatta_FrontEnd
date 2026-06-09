import { describe, expect, test } from 'vitest'
import { mapBackendPayTableItemToFrontend, mapBackendPayTableToFrontend } from './payTableAdapter'

describe('payTableAdapter', () => {
  test('mapea tabulador backend a frontend', () => {
    const mapped = mapBackendPayTableToFrontend({
      items: [
        {
          id: 1,
          discipline: 'slow',
          min_attendees: 1,
          max_attendees: 6,
          pay_mxn: 200,
          is_active: true,
        },
      ],
    })

    expect(mapped.items[0]).toMatchObject({
      id: 1,
      discipline: 'slow',
      minAttendees: 1,
      maxAttendees: 6,
      payMxn: 200,
      isActive: true,
    })
  })

  test('mapea item individual', () => {
    expect(
      mapBackendPayTableItemToFrontend({
        id: 2,
        primary_discipline: 'Stryde X',
        min_attendees: 7,
        max_attendees: 12,
        pay_mxn: 350,
        is_active: false,
      })
    ).toMatchObject({
      id: 2,
      discipline: 'Stryde X',
      minAttendees: 7,
      maxAttendees: 12,
      payMxn: 350,
      isActive: false,
    })
  })
})
