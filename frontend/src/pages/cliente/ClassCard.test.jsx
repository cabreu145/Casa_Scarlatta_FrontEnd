import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClassCard from './ClassCard'

describe('ClassCard null-safe render', () => {
  test('no truena con date/time/coach null', () => {
    render(
      <ClassCard
        cls={{
          title: 'Clase Demo',
          coach: null,
          date: null,
          time: null,
          discipline: null,
          status: 'pendiente',
          claseFecha: null,
        }}
        showCancel={false}
      />
    )

    expect(screen.getByText('Fecha por definir')).toBeInTheDocument()
    expect(screen.getByText('Horario por definir')).toBeInTheDocument()
    expect(screen.getByText('Por definir')).toBeInTheDocument()
  })

  test('usa displayTime y fecha real cuando time viene vacío', () => {
    render(
      <ClassCard
        cls={{
          title: 'Clase Demo',
          coach: 'Coach Demo',
          date: 'Lun',
          time: null,
          displayTime: '09:00',
          displayDate: 'mar, 02 jun',
          discipline: 'Stryde X',
          status: 'confirmada',
          claseFecha: '2026-06-02',
        }}
        showCancel={false}
      />
    )

    expect(screen.getByText(/9:00 a\.m\./i)).toBeInTheDocument()
    expect(screen.getByText(/02.*jun/i)).toBeInTheDocument()
    expect(screen.getByText('Coach Demo')).toBeInTheDocument()
  })
})
