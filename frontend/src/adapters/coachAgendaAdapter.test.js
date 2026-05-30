import { describe, expect, test } from 'vitest'
import { mapCoachAgendaToFrontend } from './coachAgendaAdapter'

describe('coachAgendaAdapter', () => {
  test('mapea response completo', () => {
    const mapped = mapCoachAgendaToFrontend({
      coach: { coach_id: 1, user_id: 2, name: 'Coach Demo' },
      from: '2026-06-01',
      to: '2026-06-07',
      occurrences: [{
        occurrence_id: 101,
        class_id: 9,
        class_name: 'Clase Demo',
        class_type: 'Stryde X',
        occurrence_date: '2026-06-02',
        start_at: '2026-06-02T09:00:00',
        end_at: '2026-06-02T09:50:00',
        start_time: '09:00',
        status: 'programada',
        capacity_max: 10,
        capacity_current: 4,
        cupo_disponible: 6,
        coach_id: 1,
      }],
    })
    expect(mapped.coach.coachId).toBe(1)
    expect(mapped.occurrences).toHaveLength(1)
    expect(mapped.occurrences[0].occurrenceId).toBe(101)
    expect(mapped.occurrences[0].occurrenceDate).toBe('2026-06-02')
  })

  test('tolera occurrences vacias', () => {
    const mapped = mapCoachAgendaToFrontend({ coach: {}, occurrences: [] })
    expect(mapped.occurrences).toEqual([])
    expect(mapped.coach.coachName).toBe('Coach')
  })
})
