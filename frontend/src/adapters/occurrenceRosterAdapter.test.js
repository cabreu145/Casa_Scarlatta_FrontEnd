import { describe, expect, test } from 'vitest'
import { mapBackendOccurrenceRosterToFrontend } from './occurrenceRosterAdapter'

describe('occurrenceRosterAdapter', () => {
  test('mapea roster de ocurrencia y alumnos', () => {
    const mapped = mapBackendOccurrenceRosterToFrontend({
      occurrence_id: 10,
      class_id: 3,
      class_name: 'Clase Demo STRYDE Semana QA',
      discipline: 'stryde',
      date: '2026-06-09',
      start_time: '07:00',
      end_time: '07:50',
      coach_id: 1,
      coach_name: 'Coach Demo',
      coach_avatar_url: '/media/coaches/demo.png',
      capacity_max: 15,
      capacity_current: 2,
      students: [
        {
          reservation_id: 100,
          user_id: 5,
          name: 'Cliente Demo',
          email: 'cliente@demo.local',
          phone: '9810000000',
          status: 'confirmada',
          checked_in_at: null,
          spot_id: 12,
          spot_label: '01',
          equipment_type: 'bench',
          created_at: '2026-06-09T10:00:00-06:00',
        },
      ],
    })

    expect(mapped).toMatchObject({
      occurrenceId: 10,
      classId: 3,
      className: 'Clase Demo STRYDE Semana QA',
      discipline: 'stryde',
      date: '2026-06-09',
      startTime: '07:00',
      endTime: '07:50',
      coachId: 1,
      coachName: 'Coach Demo',
      coachAvatarUrl: '/media/coaches/demo.png',
      capacityMax: 15,
      capacityCurrent: 2,
    })
    expect(mapped.students[0]).toMatchObject({
      reservationId: 100,
      userId: 5,
      name: 'Cliente Demo',
      email: 'cliente@demo.local',
      phone: '9810000000',
      status: 'confirmada',
      spotId: 12,
      spotLabel: '01',
      equipmentType: 'bench',
      equipmentLabel: 'Banco',
      createdAt: '2026-06-09T10:00:00-06:00',
    })
  })
})
