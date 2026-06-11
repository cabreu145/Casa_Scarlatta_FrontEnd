import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fechaLocal } from '@/utils/fecha'

const mockLoadClasesFromApi = vi.fn().mockResolvedValue(undefined)
const mockGetOccurrencesForDateRangeApi = vi.fn()
const mockCancelReserva = vi.fn()
const mockUsePublicCoachesQuery = vi.fn()
const todayIso = fechaLocal(new Date())

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    usuario: null,
  }),
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: () => ({
    clases: [
      {
        id: 3,
        nombre: 'Clase Demo STRYDE Semana QA',
        coachId: 1,
        coachNombre: 'Coach Demo',
        discipline: 'stryde',
        duracion: 50,
        cupoMax: 15,
        cupoActual: 0,
        estado: 'programada',
      },
    ],
    loadClasesFromApi: mockLoadClasesFromApi,
  }),
}))

vi.mock('@/stores/coachesStore', () => ({
  useCoachesStore: () => ({
    coaches: [],
  }),
}))

vi.mock('@/stores/reservasStore', () => ({
  useReservasStore: () => ({
    reservas: [],
  }),
}))

vi.mock('@/stores/configuracionStore', () => ({
  useConfiguracionStore: () => ({
    get: (key) => {
      if (key === 'horasCancelacion') return 2
      if (key === 'imagenBannerClases') return ''
      return ''
    },
  }),
}))

vi.mock('@/hooks/useApiQueries', () => ({
  usePublicCoachesQuery: (...args) => mockUsePublicCoachesQuery(...args),
}))

vi.mock('@/services/classService', async () => {
  const actual = await vi.importActual('@/services/classService')
  return {
    ...actual,
    getPublicClassesByDate: vi.fn().mockReturnValue([]),
    getPublicAvailability: vi.fn().mockReturnValue({ available: 15, status: 'ok' }),
    getReservationOccurrenceDate: vi.fn().mockReturnValue(null),
  }
})

vi.mock('@/services/occurrencesApiService', () => ({
  clearOccurrencesInflightCache: vi.fn(),
  getOccurrencesForDateRangeApi: (...args) => mockGetOccurrencesForDateRangeApi(...args),
}))

vi.mock('@/services/reservasService', () => ({
  cancelarReserva: (...args) => mockCancelReserva(...args),
}))

vi.mock('@/features/clases/SeatSelector', () => ({
  default: () => <div>SeatSelector Mock</div>,
}))

vi.mock('@/features/reservas/EquipmentReservationPanel', () => ({
  default: () => <div>EquipmentReservationPanel Mock</div>,
}))

vi.mock('@/features/clases/ClassTypeFilter', () => ({
  default: ({ active, onChange }) => (
    <div>
      <button type="button" onClick={() => onChange('Slow')} aria-label="slow.">
        Slow
      </button>
      <button type="button" onClick={() => onChange('Stryde X')} aria-label="STRYDE X">
        Stryde X
      </button>
      <span>{active || 'all'}</span>
    </div>
  ),
}))

vi.mock('@/utils/formatters', async () => {
  const actual = await vi.importActual('@/utils/formatters')
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * 86400000))
  return {
    ...actual,
    getWeekDays: () => days,
  }
})

describe('Clases public avatar regression', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_CLASSES', 'true')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    mockUsePublicCoachesQuery.mockReturnValue({
      data: [
        {
          coachId: 1,
          name: 'Coach Demo',
          avatarUrl: '/media/coaches/coach-demo.png',
        },
      ],
    })
    mockGetOccurrencesForDateRangeApi.mockResolvedValue({
      3: [
      {
          occurrenceId: 10,
          fecha: todayIso,
          cupoMax: 15,
          cupoActual: 0,
          estado: 'programada',
          coachId: 1,
          claseNombre: 'Clase Demo STRYDE Semana QA',
        },
      ],
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  test('renderiza sin ReferenceError y usa avatar pÃºblico por coach_id', async () => {
    const { default: Clases } = await import('./Clases')

    render(
      <MemoryRouter initialEntries={['/clases']}>
        <Clases />
      </MemoryRouter>
    )

    expect(await screen.findByText('Clase Demo STRYDE Semana QA')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockUsePublicCoachesQuery).toHaveBeenCalled()
      expect(mockGetOccurrencesForDateRangeApi).toHaveBeenCalled()
    })

    const avatar = screen.getByRole('img', { name: 'Coach Demo' })
    expect(avatar).toBeInTheDocument()
    expect(avatar.getAttribute('src')).toContain('/media/coaches/coach-demo.png')
    expect(avatar.getAttribute('src')).not.toContain('localhost:5173')
  })
})
