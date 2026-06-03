import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

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
const mockGetMisReservasPaginatedApi = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 })

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
  useUsuariosStore: () => ({
    usuarios: mockUsuarios,
  }),
}))

vi.mock('@/stores/coachesStore', () => ({
  useCoachesStore: () => ({
    coaches: mockCoaches,
  }),
}))

vi.mock('@/stores/paquetesStore', () => ({
  usePaquetesStore: () => ({
    paquetes: mockPaquetes,
  }),
}))

vi.mock('@/stores/transaccionesStore', () => ({
  useTransaccionesStore: () => ({
    getTransaccionesByUsuario: mockGetTransaccionesByUsuario,
  }),
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
  getMyCreditMovementsPaginatedApi: mockGetMyCreditMovementsPaginatedApi,
}))

vi.mock('@/services/membershipPackagesApiService', () => ({
  getMembershipPackagesApi: mockGetMembershipPackagesApi,
}))

vi.mock('@/services/reservasApiService', () => ({
  getMisReservasPaginatedApi: mockGetMisReservasPaginatedApi,
}))

describe('ClientPanel payments section', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    vi.stubEnv('VITE_USE_API_CLASSES', 'true')
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')
    window.history.pushState({}, '', '/cliente/dashboard?section=pagos')
  })

  test('renderiza pagos recientes sin crash', async () => {
    const { default: ClientPanel } = await import('./ClientPanel')

    render(
      <MemoryRouter initialEntries={['/cliente/dashboard?section=pagos']}>
        <ClientPanel />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Estado de pagos recientes/i)).toBeInTheDocument()
  })
})
