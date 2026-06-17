import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { buildWeek } from '@/utils/formatters'

const mockUsuario = {
  id: 1,
  rol: 'cliente',
  nombre: 'Cliente Demo',
  email: 'cliente@casascarlatta.local',
}
const mockReservas = []
const mockClases = []
const mockUsuarios = []
const mockCoaches = []
const mockPaquetes = []
const mockTransactions = []
const mockCreditMovements = []
const mockFinancialState = {}

const mockLoadMisReservasFromApi = vi.fn().mockResolvedValue([])
const mockLoadClasesFromApi = vi.fn().mockResolvedValue([])
const mockGetTransaccionesByUsuario = vi.fn().mockReturnValue([])
const mockLoadFinancialState = vi.fn().mockResolvedValue(undefined)
const mockUnirse = vi.fn()
const mockSalir = vi.fn()
const mockEstaEnLista = vi.fn().mockReturnValue(false)
const mockGetPosicion = vi.fn().mockReturnValue(null)
const mockEditarPerfilService = vi.fn().mockResolvedValue({})
const mockGetPublicClassesByDate = vi.fn().mockResolvedValue([])
const mockGetReservationOccurrenceDate = vi.fn().mockReturnValue(null)
const mockIsPublished = vi.fn().mockReturnValue(true)
const mockClearOccurrencesInflightCache = vi.fn()
const mockGetOccurrencesForDateRangeApi = vi.fn().mockResolvedValue([])
const mockLogListaEsperaUnirse = vi.fn()
const mockLogListaEsperaSalir = vi.fn()
const mockGetMyCreditMovementsPaginatedApi = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 })
const mockGetMembershipPackagesApi = vi.fn().mockResolvedValue([])
const mockGetMyMembershipsApi = vi.fn().mockResolvedValue([])
const mockGetMyFinancialStateApi = vi.fn().mockResolvedValue({})
const mockGetMisReservasPaginatedApi = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 })
const mockUsePublicCoachesQuery = vi.fn().mockReturnValue({ data: [], isLoading: false, isFetching: false, error: null })
let membershipPackagesData = []
let membershipsData = []
const mockNotificationsQueryData = {
  page: 1,
  pageSize: 5,
  total: 1,
  items: [
    {
      id: 18,
      title: 'Reserva confirmada',
      message: 'Tu reserva fue confirmada correctamente.',
      category: 'reservas',
      createdAt: '2026-06-09T22:24:48.185573',
      read: false,
      metadata: { class_name: 'Clase Demo STRYDE API', spot_label: '08' },
    },
  ],
}
let mockApiFinancialStateData = {}
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    usuario: mockUsuario,
    logout: vi.fn(),
  }),
}))

vi.mock('@/stores/reservasStore', () => ({
  useReservasStore: () => ({
    reservas: mockReservas,
    loadMisReservasFromApi: mockLoadMisReservasFromApi,
  }),
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: () => ({
    clases: mockClases,
    loadClasesFromApi: mockLoadClasesFromApi,
  }),
}))

vi.mock('@/stores/usuariosStore', () => ({
  useUsuariosStore: () => ({ usuarios: mockUsuarios }),
}))

vi.mock('@/stores/coachesStore', () => ({
  useCoachesStore: () => ({ coaches: mockCoaches }),
}))

vi.mock('@/stores/paquetesStore', () => ({
  usePaquetesStore: () => ({ paquetes: mockPaquetes }),
}))

vi.mock('@/stores/transaccionesStore', () => ({
  useTransaccionesStore: () => ({ getTransaccionesByUsuario: mockGetTransaccionesByUsuario }),
}))

vi.mock('@/stores/listaEsperaStore', () => ({
  useListaEsperaStore: () => ({
    unirse: mockUnirse,
    salir: mockSalir,
    estaEnLista: mockEstaEnLista,
    getPosicion: mockGetPosicion,
  }),
}))

vi.mock('@/stores/financialStateStore', () => ({
  useFinancialStateStore: () => ({
    financialState: mockFinancialState,
    creditsBalance: 0,
    activeMembership: null,
    creditMovements: mockCreditMovements,
    transactions: mockTransactions,
    isLoading: false,
    error: null,
    loadFinancialState: mockLoadFinancialState,
  }),
}))

vi.mock('@/features/pagos/PagoModal', () => ({
  default: () => <div>PagoModal Mock</div>,
}))

vi.mock('@/features/clases/SeatSelector', () => ({
  default: () => <div>SeatSelector Mock</div>,
}))

vi.mock('@/features/reservas/EquipmentReservationPanel', () => ({
  default: ({ onReservationCreated }) => (
    <div>
      <div>EquipmentReservationPanel Mock</div>
      <button type="button" onClick={() => onReservationCreated?.({ ok: true })}>
        Confirmar mock
      </button>
    </div>
  ),
}))

vi.mock('./MisClasesCard', () => ({
  default: () => <div>MisClasesCard Mock</div>,
}))

vi.mock('./ClassCard', () => ({
  default: () => <div>ClassCard Mock</div>,
}))

vi.mock('./RecentPaymentsStatusPanel', () => ({
  default: () => <div>Estado de pagos recientes</div>,
}))

vi.mock('@/components/ui/PaginationControls', () => ({
  default: () => <div>PaginationControls Mock</div>,
}))

vi.mock('@/services/reservasService', () => ({
  reservarClase: vi.fn(),
  cancelarReserva: vi.fn(),
}))

vi.mock('@/services/usuariosService', () => ({
  editarPerfilService: mockEditarPerfilService,
}))

vi.mock('@/services/classService', () => ({
  getPublicClassesByDate: mockGetPublicClassesByDate,
  getReservationOccurrenceDate: mockGetReservationOccurrenceDate,
  isPublished: mockIsPublished,
}))

vi.mock('@/services/occurrencesApiService', () => ({
  clearOccurrencesInflightCache: mockClearOccurrencesInflightCache,
  getOccurrencesForDateRangeApi: mockGetOccurrencesForDateRangeApi,
}))

vi.mock('@/services/actividadService', () => ({
  logListaEsperaUnirse: mockLogListaEsperaUnirse,
  logListaEsperaSalir: mockLogListaEsperaSalir,
}))

vi.mock('@/services/financialStateApiService', () => ({
  getMyFinancialStateApi: mockGetMyFinancialStateApi,
  getMyCreditMovementsPaginatedApi: mockGetMyCreditMovementsPaginatedApi,
}))

vi.mock('@/services/membershipPackagesApiService', () => ({
  getMembershipPackagesApi: mockGetMembershipPackagesApi,
}))

vi.mock('@/services/clientMembershipsApiService', () => ({
  getMyMembershipsApi: mockGetMyMembershipsApi,
  addMyMembershipBeneficiaryApi: vi.fn(),
}))

vi.mock('@/services/reservasApiService', () => ({
  getMisReservasPaginatedApi: mockGetMisReservasPaginatedApi,
}))

vi.mock('@/hooks/useApiQueries', async () => {
  const actual = await vi.importActual('@/hooks/useApiQueries')
  return {
    ...actual,
    useNotificationsQuery: () => ({
      data: mockNotificationsQueryData,
      isLoading: false,
      isFetching: false,
      error: null,
    }),
    useMembershipPackagesQuery: () => ({ data: membershipPackagesData, isLoading: false, error: null }),
    useMyCreditMovementsQuery: () => ({ data: { items: [], total: 0, page: 1, pageSize: 8, totalPages: 1 }, isLoading: false, error: null }),
    useMyFinancialStateQuery: () => ({ data: mockApiFinancialStateData, isLoading: false, error: null }),
    useMyMembershipsQuery: () => ({ data: membershipsData, isLoading: false, error: null }),
    useAddMyMembershipBeneficiaryMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
    usePublicCoachesQuery: (...args) => mockUsePublicCoachesQuery(...args),
    useReservationsMeQuery: () => ({ data: { items: [], total: 0, page: 1, pageSize: 10 }, isLoading: false, error: null }),
    invalidateReservationSideEffects: vi.fn().mockResolvedValue(undefined),
  }
})

function renderPanel(initialEntry = '/cliente/dashboard') {
  return import('./ClientPanel').then(({ default: ClientPanel }) => render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ClientPanel />
      </MemoryRouter>
    </QueryClientProvider>
  ))
}

describe('ClientPanel payments section', () => {
  beforeEach(() => {
    testQueryClient.clear()
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    vi.stubEnv('VITE_USE_API_CLASSES', 'true')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')
    mockClases.splice(0, mockClases.length)
    mockReservas.splice(0, mockReservas.length)
    mockGetMembershipPackagesApi.mockReset()
    mockGetMembershipPackagesApi.mockResolvedValue([])
    mockGetMyMembershipsApi.mockReset()
    mockGetMyMembershipsApi.mockResolvedValue([])
    mockGetMyFinancialStateApi.mockReset()
    mockGetMyFinancialStateApi.mockResolvedValue({})
    mockApiFinancialStateData = {}
    mockGetOccurrencesForDateRangeApi.mockReset()
    mockGetOccurrencesForDateRangeApi.mockResolvedValue([])
    membershipPackagesData = []
    membershipsData = []
    mockLoadMisReservasFromApi.mockClear()
    mockLoadClasesFromApi.mockClear()
    mockUsePublicCoachesQuery.mockReturnValue({ data: [], isLoading: false, isFetching: false, error: null })
    window.history.pushState({}, '', '/cliente/dashboard')
  })

  test('renderiza pagos recientes sin crash', async () => {
    await renderPanel('/cliente/dashboard')
    expect(await screen.findByText(/Estado de pagos recientes/i)).toBeInTheDocument()
  })

  test('resalta packageId desde query en Paquetes & Pagos', async () => {
    membershipPackagesData = [
      {
        id: 2,
        nombre: 'Mensual 12',
        precio: 2100,
        creditos: 12,
        vigencia: 'Mensual',
        beneficios: ['Demo'],
        destacado: true,
      },
    ]

    await renderPanel('/cliente/dashboard?section=pagos&packageId=2')
    expect(await screen.findByText('Seleccionado')).toBeInTheDocument()
  })

  test('muestra membresías compartidas y abre modal', async () => {
    membershipsData = [
      {
        membershipId: 1,
        packageId: 2,
        displayName: 'Mensual 12',
        creditsAvailable: 8,
        expiresAt: '2026-07-07',
        isShareable: true,
        maxBeneficiaries: 1,
        beneficiaries: [],
      },
    ]

    await renderPanel('/cliente/dashboard?section=pagos')
    const user = userEvent.setup()

    expect(await screen.findByText(/Mis membres/i)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /compartir paquete/i }))
    expect(await screen.findByPlaceholderText('cliente@correo.com')).toBeInTheDocument()
  })

  test('muestra notificaciones recientes y abre panel', async () => {
    await renderPanel('/cliente/dashboard?section=inicio')
    const user = userEvent.setup()

    expect(await screen.findByText(/Notificaciones recientes/i)).toBeInTheDocument()
    expect(await screen.findByText('Reserva confirmada')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /ver todas/i })[0])
    expect(await screen.findByRole('dialog', { name: /notificaciones/i })).toBeInTheDocument()
  })

  test('no emite warning de keys duplicadas al renderizar ocurrencias duplicadas', async () => {
    const today = new Date().toISOString().slice(0, 10)
    mockClases.splice(0, mockClases.length, {
      id: 3,
      nombre: 'Clase Demo API',
      coachNombre: 'Coach Demo',
      dia: 'Domingo',
      hora: '16:00',
      tipo: 'STRYDE',
      cupoMax: 12,
      cupoActual: 0,
      publicado: true,
    })

    mockGetOccurrencesForDateRangeApi.mockResolvedValue({
      3: [
        {
          occurrenceId: 301,
          fecha: today,
          inicio: `${today}T16:00:00`,
          cupoMax: 12,
          cupoActual: 0,
          claseNombre: 'Clase Demo API',
        },
        {
          occurrenceId: 302,
          fecha: today,
          inicio: `${today}T16:30:00`,
          cupoMax: 12,
          cupoActual: 0,
          claseNombre: 'Clase Demo API',
        },
      ],
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderPanel('/cliente/dashboard?section=reservar')

    await waitFor(() => {
      expect(mockGetOccurrencesForDateRangeApi).toHaveBeenCalled()
    })

    expect(consoleErrorSpy.mock.calls.some((args) => String(args[0] ?? '').includes('Encountered two children with the same key'))).toBe(false)
    consoleErrorSpy.mockRestore()
  })

  test.skip('reservar clase refresca Reservar Clase sin cambiar de sección', async () => {
    const visibleWeek = buildWeek(0)
    mockClases.splice(0, mockClases.length, {
      id: 3,
      nombre: 'Clase Demo API',
      coachNombre: 'Coach Demo',
      dia: 'Lunes',
      hora: '16:00',
      tipo: 'STRYDE',
      discipline: 'stryde',
      cupoMax: 12,
      cupoActual: 0,
      publicado: true,
    })
    mockReservas.splice(0, mockReservas.length, {
      id: 9001,
      estado: 'confirmada',
      occurrenceId: 301,
      claseId: 3,
      fecha: visibleWeek[0]?.isoDate,
      discipline: 'stryde',
      spotLabel: '01',
    })

    mockGetOccurrencesForDateRangeApi.mockResolvedValue({
      3: visibleWeek.map((day, index) => ({
        occurrenceId: 301 + index,
        fecha: day.isoDate,
        inicio: `${day.isoDate}T16:00:00`,
        cupoMax: 12,
        cupoActual: 0,
        claseNombre: 'Clase Demo API',
        discipline: 'stryde',
      })),
    })

    await renderPanel('/cliente/dashboard?section=reservar')
    const user = userEvent.setup()

    await waitFor(() => {
      expect(mockGetOccurrencesForDateRangeApi).toHaveBeenCalled()
    })

    const baselineOccurrenceCalls = mockGetOccurrencesForDateRangeApi.mock.calls.length
    const baselineReservationLoads = mockLoadMisReservasFromApi.mock.calls.length
    const baselineClassLoads = mockLoadClasesFromApi.mock.calls.length

    expect(await screen.findByText('Clase Demo API')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /reservar otro/i }))
    expect(await screen.findByText('EquipmentReservationPanel Mock')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmar mock' }))

    await waitFor(() => {
      expect(mockLoadMisReservasFromApi.mock.calls.length).toBeGreaterThan(baselineReservationLoads)
      expect(mockLoadClasesFromApi.mock.calls.length).toBeGreaterThan(baselineClassLoads)
      expect(mockGetOccurrencesForDateRangeApi.mock.calls.length).toBeGreaterThan(baselineOccurrenceCalls)
    })
  })

  test('oculta Reservar otro en Reservar Clase si membresía limita un lugar por clase', async () => {
    const visibleWeek = buildWeek(0)
    mockClases.splice(0, mockClases.length, {
      id: 3,
      nombre: 'Clase Demo API',
      coachNombre: 'Coach Demo',
      dia: 'Lunes',
      hora: '16:00',
      tipo: 'STRYDE',
      discipline: 'stryde',
      cupoMax: 12,
      cupoActual: 0,
      publicado: true,
    })
    mockReservas.splice(0, mockReservas.length, {
      id: 9001,
      estado: 'confirmada',
      occurrenceId: 301,
      claseId: 3,
      fecha: visibleWeek[0]?.isoDate,
      discipline: 'stryde',
      spotLabel: '01',
      userId: 1,
    })
    mockApiFinancialStateData = {
      activeMembership: {
        limitOneSpotPerOccurrence: true,
        creditsAvailable: 3,
      },
    }

    mockGetOccurrencesForDateRangeApi.mockResolvedValue({
      3: [
        {
          occurrenceId: 301,
          fecha: visibleWeek[0]?.isoDate,
          inicio: `${visibleWeek[0]?.isoDate}T16:00:00`,
          cupoMax: 12,
          cupoActual: 1,
          claseNombre: 'Clase Demo API',
          discipline: 'stryde',
        },
      ],
    })

    await renderPanel('/cliente/dashboard?section=reservar')

    expect(await screen.findByText('Clase Demo API')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reservar otro/i })).not.toBeInTheDocument()
  })
})
