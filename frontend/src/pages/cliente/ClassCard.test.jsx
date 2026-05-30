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

    expect(screen.getByText('Sin fecha')).toBeInTheDocument()
    expect(screen.getByText('Sin horario')).toBeInTheDocument()
    expect(screen.getByText('Por definir')).toBeInTheDocument()
  })
})
