import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fechaLocal } from '@/utils/fecha'

const mockLoadClasesFromApi = vi.fn().mockResolvedValue(undefined)
const mockLoadMisReservasFromApi = vi.fn().mockResolvedValue(undefined)
const mockGetOccurrencesForDateRangeApi = vi.fn()
const mockCancelReserva = vi.fn()
const mockUsePublicCoachesQuery = vi.fn()
const todayIso = fechaLocal(new Date())
const customBannerUrl = 'https://cdn.example.com/custom-classes-mobile.jpg'
const originalInnerWidth = window.innerWidth
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

let authState = {
  isAuthenticated: false,
  usuario: null,
}

let reservasState = []
let financialStateData = { activeMembership: null }

const clasesState = [
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
]

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: () => ({
    clases: clasesState,
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
    reservas: reservasState,
    loadMisReservasFromApi: mockLoadMisReservasFromApi,
  }),
}))

vi.mock('@/stores/configuracionStore', () => ({
  useConfiguracionStore: () => ({
    get: (key) => {
      if (key === 'horasCancelacion') return 2
      return ''
    },
  }),
}))

vi.mock('@/hooks/useSiteConfiguration', () => ({
  useEffectiveSiteConfiguration: () => ({
    get: (key) => key === 'imagenBannerClases' ? customBannerUrl : '',
  }),
}))

vi.mock('@/hooks/useApiQueries', () => ({
  usePublicCoachesQuery: (...args) => mockUsePublicCoachesQuery(...args),
  useMyFinancialStateQuery: () => ({
    data: financialStateData,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/services/classService', async () => {
  const actual = await vi.importActual('@/services/classService')
  return {
    ...actual,
    getPublicClassesByDate: vi.fn().mockReturnValue([]),
    getPublicAvailability: vi.fn().mockReturnValue({ available: 15, status: 'ok' }),
    getReservationOccurrenceDate: vi.fn().mockImplementation((reservation) => reservation?.occurrenceDate ?? null),
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
  default: ({ occurrenceId, classId, onReservationCreated }) => (
    <div>
      <div>EquipmentReservationPanel Mock</div>
      <div data-testid="equipment-props">{`${classId}:${occurrenceId}`}</div>
      <button type="button" onClick={() => onReservationCreated?.({ ok: true })}>
        Confirmar mock
      </button>
    </div>
  ),
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
    queryClient.clear()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    vi.stubEnv('VITE_USE_API_CLASSES', 'true')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    authState = { isAuthenticated: false, usuario: null }
    reservasState = []
    financialStateData = { activeMembership: null }
    mockLoadClasesFromApi.mockClear()
    mockLoadMisReservasFromApi.mockClear()
    mockCancelReserva.mockClear()
    mockUsePublicCoachesQuery.mockReturnValue({
      data: [
        {
          coachId: 1,
          name: 'Coach Demo',
          avatarUrl: '/media/coaches/coach-demo.png',
        },
      ],
    })
    mockGetOccurrencesForDateRangeApi.mockClear()
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
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth })
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  test('renderiza sin ReferenceError y usa avatar público por coach_id', async () => {
    const { default: Clases } = await import('./Clases')

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/clases']}>
          <Clases />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Clase Demo STRYDE Semana QA')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockUsePublicCoachesQuery).toHaveBeenCalled()
      expect(mockGetOccurrencesForDateRangeApi.mock.calls.length).toBeGreaterThan(0)
    })

    const avatar = screen.getByRole('img', { name: 'Coach Demo' })
    expect(avatar).toBeInTheDocument()
    expect(avatar.getAttribute('src')).toContain('/media/coaches/coach-demo.png')
    expect(avatar.getAttribute('src')).not.toContain('localhost:5173')
    expect(document.querySelector('section').style.getPropertyValue('--hero-image')).toContain(customBannerUrl)
  })

  test('no hace polling de ocurrencias por intervalo en /clases', async () => {
    vi.useFakeTimers()
    const { default: Clases } = await import('./Clases')

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/clases']}>
          <Clases />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await vi.runOnlyPendingTimersAsync()
    await Promise.resolve()
    await Promise.resolve()

    const baselineCalls = mockGetOccurrencesForDateRangeApi.mock.calls.length
    expect(baselineCalls).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(36_000)
    await Promise.resolve()
    await Promise.resolve()

    expect(mockLoadClasesFromApi.mock.calls.length).toBeGreaterThan(1)
    expect(mockGetOccurrencesForDateRangeApi).toHaveBeenCalledTimes(baselineCalls)
  }, 10000)

  test('map class con reserva existente muestra Reservar otro y abre panel con occurrence real', async () => {
    authState = {
      isAuthenticated: true,
      usuario: { id: 1, nombre: 'Cliente Demo' },
    }
    financialStateData = {
      activeMembership: {
        limitOneSpotPerOccurrence: false,
      },
    }
    reservasState = [
      {
        id: 501,
        userId: 1,
        estado: 'confirmada',
        occurrenceId: 10,
        occurrenceDate: todayIso,
        claseId: 3,
        spotLabel: '01',
      },
    ]

    const { default: Clases } = await import('./Clases')
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/clases']}>
          <Clases />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Reservar otro')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reservar otro' }))

    expect(await screen.findByText('EquipmentReservationPanel Mock')).toBeInTheDocument()
    expect(screen.getByTestId('equipment-props')).toHaveTextContent('3:10')
  })

  test('map class con paquete restringido oculta Reservar otro', async () => {
    authState = {
      isAuthenticated: true,
      usuario: { id: 1, nombre: 'Cliente Demo' },
    }
    financialStateData = {
      activeMembership: {
        limitOneSpotPerOccurrence: true,
      },
    }
    reservasState = [
      {
        id: 501,
        userId: 1,
        estado: 'confirmada',
        occurrenceId: 10,
        occurrenceDate: todayIso,
        claseId: 3,
        spotLabel: '01',
      },
    ]

    const { default: Clases } = await import('./Clases')

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/clases']}>
          <Clases />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('CONFIRMADA')).toBeInTheDocument()
    expect(screen.queryByText('Reservar otro')).not.toBeInTheDocument()
    expect(screen.getByText('Tu paquete permite solo un lugar por clase.')).toBeInTheDocument()
  })
})
