import { describe, expect, it } from 'vitest'
import {
  buildAdminClassOccurrenceRows,
  buildClientEnrollmentLabel,
  filterAdminClassRows,
  getAdminClassRosterEmptyMessage,
} from './adminClassOccurrenceUtils'

describe('adminClassOccurrenceUtils', () => {
  it('arma filas de ocurrencias con occurrenceId y cupos', () => {
    const rows = buildAdminClassOccurrenceRows(
      [
        { id: 3, nombre: 'Clase Demo', coachId: 1, coachNombre: 'Coach Demo', discipline: 'stryde', cupoMax: 15, cupoActual: 0 },
      ],
      {
        3: [
          { occurrenceId: 10, fecha: '2026-06-09', hora: '07:00', capacityMax: 15, capacityCurrent: 2 },
        ],
      }
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 10,
      occurrenceId: 10,
      claseId: 3,
      fecha: '2026-06-09',
      hora: '07:00',
      cupoMax: 15,
      cupoActual: 2,
    })
  })

  it('filtra filas por busqueda, disciplina, coach y estado', () => {
    const rows = filterAdminClassRows(
      [
        { nombre: 'SLOW Demo', discipline: 'slow', coachId: 9, estado: 'programada' },
        { nombre: 'STRYDE Demo', discipline: 'stryde', coachId: 2, estado: 'cancelada' },
      ],
      { search: 'demo', discipline: 'Slow', status: 'activa', coachId: '9' }
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].nombre).toBe('SLOW Demo')
  })

  it('resuelve mensaje de roster en API mode', () => {
    expect(getAdminClassRosterEmptyMessage({ useApiMode: true, occurrenceId: null })).toContain('Selecciona')
    expect(
      getAdminClassRosterEmptyMessage({ useApiMode: true, occurrenceId: 10, capacityCurrent: 1 })
    ).toContain('roster detallado')
    expect(getAdminClassRosterEmptyMessage({ useApiMode: false })).toBe('Nadie inscrito aun')
  })

  it('arma etiqueta de cliente para inscripcion manual', () => {
    expect(
      buildClientEnrollmentLabel({
        name: 'Cliente Demo',
        activeMembership: { packageName: 'Mensual 12', creditsAvailable: 8 },
      })
    ).toBe('Cliente Demo · Mensual 12')
    expect(
      buildClientEnrollmentLabel({
        nombre: 'Cliente Demo',
        creditsBalance: 4,
      })
    ).toBe('Cliente Demo · 4 creditos')
  })
})
