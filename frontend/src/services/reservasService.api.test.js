import { beforeEach, describe, expect, test, vi } from 'vitest'

const cancelarReservaApi = vi.fn()
const getMisReservasApi = vi.fn()
const useReservasState = {
  reservas: [],
  setReservas: vi.fn(),
}
const useClasesState = {
  loadClasesFromApi: vi.fn(),
}
const syncOccurrenceApi = vi.fn()
const syncClaseApi = vi.fn()

vi.mock('@/services/reservasApiService', () => ({
  cancelarReservaApi: (...args) => cancelarReservaApi(...args),
  completarReservaApi: vi.fn(),
  crearReservaApi: vi.fn(),
  getMisReservasApi: (...args) => getMisReservasApi(...args),
  marcarNoAsistioApi: vi.fn(),
}))

vi.mock('@/stores/reservasStore', () => ({
  useReservasStore: {
    getState: () => useReservasState,
  },
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: {
    getState: () => useClasesState,
  },
}))

vi.mock('@/stores/listaEsperaStore', () => ({
  useListaEsperaStore: {
    getState: () => ({ syncOccurrenceApi, syncClaseApi }),
  },
}))

vi.mock('@/stores/usuariosStore', () => ({ useUsuariosStore: { getState: () => ({}) } }))
vi.mock('@/stores/notificacionesStore', () => ({ useNotificacionesStore: { getState: () => ({}) } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }))
vi.mock('@/services/actividadService', () => ({ logReservaCreada: vi.fn(), logReservaCancelada: vi.fn() }))
vi.mock('@/services/emailService', () => ({
  emailReservaConfirmada: vi.fn(),
  emailReservaCancelada: vi.fn(),
  emailLugarAsignado: vi.fn(),
}))

describe('reservasService waitlist occurrence-only', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_USE_API_RESERVATIONS', 'true')
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')

    cancelarReservaApi.mockReset()
    getMisReservasApi.mockReset()
    useReservasState.setReservas.mockReset()
    useClasesState.loadClasesFromApi.mockReset()
    syncOccurrenceApi.mockReset()
    syncClaseApi.mockReset()

    cancelarReservaApi.mockResolvedValue({ ok: true })
    getMisReservasApi.mockResolvedValue([])
    useClasesState.loadClasesFromApi.mockResolvedValue([])
  })

  test('cancelar en API refresca waitlist por occurrenceId y no por claseId', async () => {
    useReservasState.reservas = [{ id: 100, claseId: 1, occurrenceId: 77 }]

    const { cancelarReserva } = await import('./reservasService')
    const result = await cancelarReserva(100, 5)

    expect(result.ok).toBe(true)
    expect(syncOccurrenceApi).toHaveBeenCalledWith(77)
    expect(syncClaseApi).not.toHaveBeenCalled()
  })

  test('si reserva no tiene occurrenceId no llama waitlist legacy', async () => {
    useReservasState.reservas = [{ id: 101, claseId: 1, occurrenceId: null }]

    const { cancelarReserva } = await import('./reservasService')
    const result = await cancelarReserva(101, 5)

    expect(result.ok).toBe(true)
    expect(syncOccurrenceApi).not.toHaveBeenCalled()
    expect(syncClaseApi).not.toHaveBeenCalled()
  })
})
