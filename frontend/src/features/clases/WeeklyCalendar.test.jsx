import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeeklyCalendar from './WeeklyCalendar'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

describe('WeeklyCalendar', () => {
  test('muestra hora visible en clase del día actual', () => {
    const today = DAYS[new Date().getDay()]

    render(
      <WeeklyCalendar
        classes={[
          {
            id: 1,
            nombre: 'Clase Demo',
            coachNombre: 'Coach Demo',
            dia: today,
            time: null,
            displayTime: '09:00',
            tipo: 'Stryde X',
            duracion: 50,
            cupoMax: 10,
            cupoActual: 2,
          },
        ]}
        onSelectClass={() => {}}
      />
    )

    expect(screen.getAllByText(/9:00/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Clase Demo').length).toBeGreaterThan(0)
  })
})
