import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import MisClasesCard from './MisClasesCard'

describe('MisClasesCard', () => {
  test('usa displayTime cuando time no viene en el item', () => {
    render(
      <MisClasesCard
        cls={{
          coach: 'Coach Demo',
          title: 'Clase Demo',
          time: null,
          displayTime: '09:00',
          discipline: 'Slow',
          status: 'pendiente',
          claseFecha: '2026-06-02',
          location: 'Sala Principal',
        }}
        dayIsoDate="2026-06-02"
      />
    )

    expect(screen.getByText(/9:00 a\.m\./i)).toBeInTheDocument()
    expect(screen.getByText('Clase Demo')).toBeInTheDocument()
    expect(screen.getByText('Coach Demo · Sala Principal')).toBeInTheDocument()
  })
})
