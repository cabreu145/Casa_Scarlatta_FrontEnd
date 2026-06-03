import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const getOccurrenceSpotsMock = vi.fn()
const createSpotHoldMock = vi.fn()
const releaseSpotHoldMock = vi.fn()
const crearReservaApiMock = vi.fn()
const loadFinancialStateMock = vi.fn()
const loadMisReservasFromApiMock = vi.fn()
const getCreditMovementsMock = vi.fn()

let financialStoreState

vi.mock('@/services/equipmentReservationApiService', () => ({
  getOccurrenceSpotsApi: (...args) => getOccurrenceSpotsMock(...args),
  createSpotHoldApi: (...args) => createSpotHoldMock(...args),
  releaseSpotHoldApi: (...args) => releaseSpotHoldMock(...args),
}))

vi.mock('@/services/reservasApiService', () => ({
  crearReservaApi: (...args) => crearReservaApiMock(...args),
}))

vi.mock('@/services/financialStateApiService', () => ({
  getMyCreditMovementsPaginatedApi: (...args) => getCreditMovementsMock(...args),
}))

vi.mock('@/stores/financialStateStore', () => ({
  useFinancialStateStore: (selector) => selector(financialStoreState),
}))

vi.mock('@/stores/reservasStore', () => ({
  useReservasStore: (selector) => selector({
    loadMisReservasFromApi: loadMisReservasFromApiMock,
  }),
}))

function buildSlowResponse() {
  return {
    occurrence_id: 5,
    discipline: 'slow',
    class_name: 'Clase Demo Reservable API',
    coach_name: 'Coach Demo',
    occurrence_date: '2026-06-05',
    start_at: '2026-06-05T16:00:00',
    end_at: '2026-06-05T16:50:00',
    server_now: '2026-06-03T02:30:00',
    spots: Array.from({ length: 10 }, (_, index) => ({
      spot_id: index + 1,
      label: String(index + 1).padStart(2, '0'),
      equipment_type: 'mat',
      row: index < 5 ? 1 : 2,
      col: (index % 5) + 1,
      x: index,
      y: index,
      status: 'available',
      held_by_me: false,
      reservation_id: null,
    })),
  }
}

function buildStrydeResponse() {
  const spots = [
    { spot_id: 1, label: '01', equipment_type: 'bench', row: 1, col: 1, status: 'available' },
    { spot_id: 2, label: '02', equipment_type: 'bench', row: 1, col: 2, status: 'available' },
    { spot_id: 3, label: '03', equipment_type: 'bench', row: 1, col: 3, status: 'available' },
    { spot_id: 4, label: '04', equipment_type: 'bench', row: 1, col: 4, status: 'available' },
    { spot_id: 5, label: '05', equipment_type: 'bench', row: 1, col: 5, status: 'available' },
    { spot_id: 6, label: '06', equipment_type: 'bench', row: 1, col: 6, status: 'available' },
    { spot_id: 7, label: '07', equipment_type: 'bench', row: 1, col: 7, status: 'available' },
    { spot_id: 8, label: '08', equipment_type: 'bench', row: 1, col: 8, status: 'available' },
    { spot_id: 9, label: '09', equipment_type: 'bench', row: 1, col: 9, status: 'available' },
    { spot_id: 10, label: '01', equipment_type: 'treadmill', row: 2, col: 1, status: 'available' },
    { spot_id: 11, label: '02', equipment_type: 'treadmill', row: 2, col: 2, status: 'available' },
    { spot_id: 12, label: '03', equipment_type: 'treadmill', row: 2, col: 3, status: 'available' },
    { spot_id: 13, label: '04', equipment_type: 'treadmill', row: 2, col: 4, status: 'available' },
    { spot_id: 14, label: '05', equipment_type: 'treadmill', row: 2, col: 5, status: 'available' },
    { spot_id: 15, label: '06', equipment_type: 'treadmill', row: 2, col: 6, status: 'available' },
  ]

  return {
    occurrence_id: 6,
    discipline: 'stryde',
    class_name: 'Clase STRYDE Demo',
    coach_name: 'Coach Demo',
    occurrence_date: '2026-06-06',
    start_at: '2026-06-06T16:00:00',
    end_at: '2026-06-06T16:50:00',
    server_now: '2026-06-03T02:30:00',
    spots,
  }
}

describe('EquipmentReservationPanel', () => {
  beforeEach(() => {
    vi.useRealTimers()
    getOccurrenceSpotsMock.mockReset()
    createSpotHoldMock.mockReset()
    releaseSpotHoldMock.mockReset()
    crearReservaApiMock.mockReset()
    loadFinancialStateMock.mockReset()
    loadMisReservasFromApiMock.mockReset()
    getCreditMovementsMock.mockReset()
    sessionStorage.clear()
    financialStoreState = {
      financialState: null,
      creditsBalance: 0,
      activeMembership: null,
      isLoading: false,
      error: null,
      loadFinancialState: loadFinancialStateMock,
    }
  })

  test('slow renderiza 10 tapetes y confirma reserva con hold', async () => {
    const user = userEvent.setup()
    getOccurrenceSpotsMock.mockResolvedValue(buildSlowResponse())
    createSpotHoldMock.mockResolvedValue({
      holdId: 123,
      occurrenceId: 5,
      spotId: 1,
      status: 'held',
      expiresAt: '2026-06-03T02:35:00',
      serverNow: '2026-06-03T02:30:00',
    })
    crearReservaApiMock.mockResolvedValue({
      id: 77,
      spotId: 1,
      holdId: 123,
      occurrenceId: 5,
      status: 'confirmada',
    })
    loadFinancialStateMock.mockResolvedValue({})
    getCreditMovementsMock.mockResolvedValue({ items: [], page: 1, pageSize: 8, total: 0 })
    loadMisReservasFromApiMock.mockResolvedValue([])

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 12,
          activeMembership: { creditsAvailable: 12 },
          isLoading: false,
          error: null,
        }}
      />
    )
    expect(await screen.findByRole('button', { name: /Tapete 01 · Disponible/i })).toBeInTheDocument()
    expect(screen.getByText('Clase Demo Reservable API')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tapete 01/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tapete 10/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tapete 01/i }))
    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 5, spotId: 1 })
    })

    await user.click(screen.getByRole('button', { name: /Confirmar reserva/i }))
    await waitFor(() => {
      expect(crearReservaApiMock).toHaveBeenCalledWith({
        claseId: 9,
        userId: 3,
        occurrenceId: 5,
        spotId: 1,
        holdId: 123,
      })
    })
    expect(screen.getByText(/Reserva confirmada/i)).toBeInTheDocument()
    expect(loadFinancialStateMock).toHaveBeenCalled()
    expect(getCreditMovementsMock).toHaveBeenCalled()
    expect(loadMisReservasFromApiMock).toHaveBeenCalled()
  })

  test('stryde distingue bench 01 y treadmill 01 y libera hold previo', async () => {
    const user = userEvent.setup()
    getOccurrenceSpotsMock.mockResolvedValue(buildStrydeResponse())
    createSpotHoldMock
      .mockResolvedValueOnce({
        holdId: 201,
        occurrenceId: 6,
        spotId: 1,
        status: 'held',
        expiresAt: '2026-06-03T02:35:00',
        serverNow: '2026-06-03T02:30:00',
      })
      .mockResolvedValueOnce({
        holdId: 202,
        occurrenceId: 6,
        spotId: 10,
        status: 'held',
        expiresAt: '2026-06-03T02:35:00',
        serverNow: '2026-06-03T02:30:00',
      })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={6}
        classId={10}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 12,
          activeMembership: { creditsAvailable: 12 },
          isLoading: false,
          error: null,
        }}
      />
    )
    expect(await screen.findByRole('button', { name: /Banco 06 · Disponible/i })).toBeInTheDocument()
    expect(screen.getByText('Clase STRYDE Demo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Banco 01/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Caminadora 01/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Banco 01/i }))
    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 6, spotId: 1 })
    })

    await user.click(screen.getByRole('button', { name: /Caminadora 01/i }))
    await waitFor(() => {
      expect(releaseSpotHoldMock).toHaveBeenCalledWith({ holdId: 201 })
      expect(createSpotHoldMock).toHaveBeenLastCalledWith({ occurrenceId: 6, spotId: 10 })
    })
  })

  test('timer expira y credits loading no muestra 0 falso', async () => {
    financialStoreState = {
      financialState: null,
      creditsBalance: 0,
      activeMembership: null,
      isLoading: true,
      error: null,
      loadFinancialState: loadFinancialStateMock,
    }
    getOccurrenceSpotsMock.mockResolvedValue(buildSlowResponse())
    createSpotHoldMock.mockResolvedValue({
      holdId: 303,
      occurrenceId: 5,
      spotId: 1,
      status: 'held',
      expiresAt: '2026-06-03T02:29:59',
      serverNow: '2026-06-03T02:30:00',
    })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
      />
    )
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument()
    expect(screen.queryByText(/^0 créditos restantes\./i)).not.toBeInTheDocument()

    expect(await screen.findByRole('button', { name: /Tapete 01 · Disponible/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tapete 01 · Disponible/i }))
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText(/Tu tiempo para reservar este lugar expir/i)).toBeInTheDocument()
  })

  test('monta con store financiero sin selector compuesto y no crashea', async () => {
    getOccurrenceSpotsMock.mockResolvedValue(buildSlowResponse())
    loadFinancialStateMock.mockResolvedValue({
      creditsBalance: 12,
      activeMembership: { creditsAvailable: 12 },
    })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')

    expect(() => {
      render(
        <EquipmentReservationPanel
          occurrenceId={5}
          classId={9}
          userId={3}
        />
      )
    }).not.toThrow()

    expect(await screen.findByText('Clase Demo Reservable API')).toBeInTheDocument()
    expect(loadFinancialStateMock).toHaveBeenCalledTimes(1)
  })
})
