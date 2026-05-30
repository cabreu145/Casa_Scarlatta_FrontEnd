import { describe, expect, test } from 'vitest'
import { buildCoachMetricsFromOccurrences, getTodayOccurrences, mapAgendaToCoachClassRows } from './coachAgendaUtils'

describe('coachAgendaUtils', () => {
  test('normaliza filas semanales desde agenda.occurrences', () => {
    const rows = mapAgendaToCoachClassRows([{
      occurrenceId: 101,
      classId: 9,
      className: 'Clase Demo',
      classType: 'Stryde X',
      occurrenceDate: '2026-06-02',
      startTime: '09:00',
      capacityMax: 10,
      capacityCurrent: 4,
      status: 'programada',
      coachId: 1,
    }], 'Coach Demo')

    expect(rows).toHaveLength(1)
    expect(rows[0].fecha).toBe('2026-06-02')
    expect(rows[0].hora).toBe('09:00')
    expect(rows[0].cupoActual).toBe(4)
    expect(rows[0].cupoMax).toBe(10)
  })

  test('retorna vacio cuando no hay occurrences', () => {
    expect(mapAgendaToCoachClassRows([], 'Coach')).toEqual([])
  })

  test('calcula metricas semanales desde occurrences', () => {
    const metrics = buildCoachMetricsFromOccurrences([
      { occurrenceDate: '2026-06-02', capacityCurrent: 4, capacityMax: 10, cupoDisponible: 6 },
      { occurrenceDate: '2026-06-02', capacityCurrent: 8, capacityMax: 10, cupoDisponible: 2 },
      { occurrenceDate: '2026-06-03', capacityCurrent: 5, capacityMax: 8, cupoDisponible: 3 },
    ], new Date('2026-06-02T12:00:00'))

    expect(metrics.totalClasesSemana).toBe(3)
    expect(metrics.clasesHoy).toBe(2)
    expect(metrics.alumnosTotales).toBe(17)
    expect(metrics.capacidadTotal).toBe(28)
    expect(metrics.cuposDisponibles).toBe(11)
    expect(metrics.ocupacionPromedioPct).toBe(61)
  })

  test('metricas vacias y null-safe', () => {
    const metrics = buildCoachMetricsFromOccurrences([
      { occurrenceDate: null, capacityCurrent: null, capacityMax: undefined, cupoDisponible: undefined },
    ], new Date('2026-06-02T12:00:00'))
    expect(metrics.totalClasesSemana).toBe(1)
    expect(metrics.clasesHoy).toBe(0)
    expect(metrics.alumnosTotales).toBe(0)
    expect(metrics.capacidadTotal).toBe(0)
    expect(metrics.cuposDisponibles).toBe(0)
    expect(metrics.ocupacionPromedioPct).toBe(0)
  })

  test('getTodayOccurrences filtra por occurrenceDate y ordena por hora', () => {
    const today = new Date('2026-06-02T08:00:00')
    const rows = getTodayOccurrences([
      { occurrenceDate: '2026-06-02', startTime: '12:00', className: 'B' },
      { occurrenceDate: '2026-06-03', startTime: '07:00', className: 'X' },
      { occurrenceDate: '2026-06-02', startAt: '2026-06-02T09:00:00', className: 'A' },
      { occurrenceDate: null, startTime: '08:00', className: 'N' },
      { occurrenceDate: '2026/06/02', startTime: '10:00', className: 'BadDate' },
    ], today)

    expect(rows).toHaveLength(2)
    expect(rows[0].className).toBe('A')
    expect(rows[1].className).toBe('B')
  })

  test('getTodayOccurrences con arreglo vacio retorna []', () => {
    expect(getTodayOccurrences([], new Date('2026-06-02T08:00:00'))).toEqual([])
  })
})
