import { render, screen } from '@testing-library/react'
import ActividadSection from './ActividadSection'

describe('ActividadSection', () => {
  it('muestra placeholder honesto en modo API', () => {
    render(<ActividadSection useApiMode />)

    expect(screen.getByText('Actividad pendiente de contrato backend')).toBeInTheDocument()
    expect(screen.getByText('Vista legacy deshabilitada en modo API. Fallback demo solo con flags API apagadas.')).toBeInTheDocument()
  })
})
