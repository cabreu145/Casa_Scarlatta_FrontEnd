import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ActividadSection from './ActividadSection'

const useActivityQueryMock = vi.fn()
const useActividadStoreMock = vi.fn()

vi.mock('@/hooks/useApiQueries', () => ({
  useActivityQuery: (...args) => useActivityQueryMock(...args),
}))

vi.mock('@/stores/actividadStore', () => ({
  useActividadStore: (...args) => useActividadStoreMock(...args),
  TIPO_LABELS: {
    cancel_reservation: 'Cancelación',
  },
  TIPO_ICONOS: {
    cancelaciones: '✖',
  },
}))

function buildQuery(overrides = {}) {
  return {
    data: {
      page: 1,
      pageSize: 20,
      total: 0,
      items: [],
      ...overrides.data,
    },
    isLoading: false,
    isFetching: false,
    error: null,
    ...overrides,
  }
}

describe('ActividadSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useActivityQueryMock.mockReturnValue(buildQuery())
  })

  it('muestra eventos reales en API mode', () => {
    useActivityQueryMock.mockReturnValue(
      buildQuery({
        data: {
          total: 1,
          items: [
            {
              id: 36,
              category: 'cancelaciones',
              action: 'cancel_reservation',
              title: 'Actividad de cancelaciones',
              description: 'Se cancelo una reserva',
              actorName: 'Cliente Demo',
              actorRole: 'cliente',
              entityType: 'reservation',
              entityId: 6,
              metadata: {
                reservation_id: 6,
                role: 'cliente',
                user_id: 3,
              },
              createdAt: '2026-06-09T19:52:07.371772',
            },
          ],
        },
      }),
    )

    render(<ActividadSection useApiMode />)

    expect(screen.getByText('Actividad de cancelaciones')).toBeInTheDocument()
    expect(screen.getByText('Se cancelo una reserva')).toBeInTheDocument()
    expect(screen.getByText('Cliente Demo · cliente')).toBeInTheDocument()
    expect(screen.getByText('reservation #6')).toBeInTheDocument()
    expect(screen.getByText('reservation_id: 6')).toBeInTheDocument()
    expect(useActividadStoreMock).not.toHaveBeenCalled()
  })

  it('muestra loading, empty y error', () => {
    const { rerender } = render(<ActividadSection useApiMode />)
    expect(screen.getByText('No hay eventos para este rango.')).toBeInTheDocument()

    useActivityQueryMock.mockReturnValue(buildQuery({ isLoading: true }))
    rerender(<ActividadSection useApiMode />)
    expect(screen.getByText('Cargando actividad...')).toBeInTheDocument()

    useActivityQueryMock.mockReturnValue(buildQuery({ error: new Error('No tienes permisos') }))
    rerender(<ActividadSection useApiMode />)
    expect(screen.getByText('No tienes permisos')).toBeInTheDocument()
  })

  it('manda categoria y rango por filtros', () => {
    render(<ActividadSection useApiMode />)

    fireEvent.click(screen.getByRole('button', { name: 'Reservas' }))
    expect(useActivityQueryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      category: 'reservas',
      page: 1,
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }))
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Merida' }).format(new Date())
    expect(useActivityQueryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      from: today,
      to: today,
      page: 1,
    }))
  })

  it('paginacion cambia pagina', () => {
    useActivityQueryMock.mockReturnValue(
      buildQuery({
        data: {
          total: 40,
          items: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            category: 'usuarios',
            title: `Evento ${index + 1}`,
            description: 'Demo',
            createdAt: '2026-06-09T19:52:07.371772',
          })),
        },
      }),
    )

    render(<ActividadSection useApiMode />)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(useActivityQueryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 2,
    }))
  })
})
