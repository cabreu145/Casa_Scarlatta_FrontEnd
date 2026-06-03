import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id: 1, rol: 'cliente', nombre: 'Cliente Demo', email: 'cliente@casascarlatta.local' },
    logout: vi.fn(),
  }),
}))

vi.mock('@/stores/reservasStore', () => ({
  useReservasStore: () => ({
    reservas: [],
    loadMisReservasFromApi: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: () => ({
    clases: [],
    loadClasesFromApi: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/stores/usuariosStore', () => ({
  useUsuariosStore: () => ({
    usuarios: [],
  }),
}))

vi.mock('@/stores/coachesStore', () => ({
  useCoachesStore: () => ({
    coaches: [],
  }),
}))

vi.mock('@/stores/paquetesStore', () => ({
  usePaquetesStore: () => ({
    paquetes: [],
  }),
}))

vi.mock('@/stores/transaccionesStore', () => ({
  useTransaccionesStore: () => ({
    getTransaccionesByUsuario: vi.fn().mockReturnValue([]),
  }),
}))

vi.mock('@/stores/listaEsperaStore', () => ({
  useListaEsperaStore: () => ({
    unirse: vi.fn(),
    salir: vi.fn(),
    estaEnLista: vi.fn().mockReturnValue(false),
    getPosicion: vi.fn().mockReturnValue(null),
  }),
}))

vi.mock('@/stores/financialStateStore', () => ({
  useFinancialStateStore: () => ({
    financialState: {},
    creditsBalance: 0,
    activeMembership: null,
    creditMovements: [],
    transactions: [],
    isLoading: false,
    error: null,
    loadFinancialState: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@/components/ui/PaginationControls', () => ({
  default: () => <div>PaginationControls Mock</div>,
}))

vi.mock('@/services/reservasService', () => ({
  reservarClase: vi.fn(),
  cancelarReserva: vi.fn(),
}))

vi.mock('@/services/usuariosService', () => ({
  editarPerfilService: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/services/classService', () => ({
  getPublicClassesByDate: vi.fn().mockResolvedValue([]),
  getReservationOccurrenceDate: vi.fn().mockReturnValue(null),
  isPublished: vi.fn().mockReturnValue(true),
}))

vi.mock('@/services/occurrencesApiService', () => ({
  clearOccurrencesInflightCache: vi.fn(),
  getOccurrencesForDateRangeApi: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/actividadService', () => ({
  logListaEsperaUnirse: vi.fn(),
  logListaEsperaSalir: vi.fn(),
}))

vi.mock('@/services/financialStateApiService', () => ({
  getMyCreditMovementsPaginatedApi: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 }),
}))

vi.mock('@/services/membershipPackagesApiService', () => ({
  getMembershipPackagesApi: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/reservasApiService', () => ({
  getMisReservasPaginatedApi: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 }),
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
    expect(screen.getByText(/No tienes pagos recientes en seguimiento/i)).toBeInTheDocument()
  })
})
