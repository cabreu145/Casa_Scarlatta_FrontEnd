import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const createSpotHoldMock = vi.fn()
const releaseSpotHoldMock = vi.fn()
const createReservationMock = vi.fn()
const refetchMock = vi.fn()
const loadFinancialStateMock = vi.fn()

let spotsQueryState
let financialStoreState

vi.mock('@/hooks/useApiQueries', () => ({
  useOccurrenceSpotsQuery: () => spotsQueryState,
  useCreateSpotHoldMutation: () => ({ mutateAsync: createSpotHoldMock }),
  useDeleteSpotHoldMutation: () => ({ mutateAsync: releaseSpotHoldMock }),
  useCreateReservationMutation: () => ({ mutateAsync: createReservationMock }),
}))

vi.mock('@/stores/financialStateStore', () => ({
  useFinancialStateStore: (selector) => selector(financialStoreState),
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
    vi.resetModules()
    vi.useRealTimers()
    createSpotHoldMock.mockReset()
    releaseSpotHoldMock.mockReset()
    createReservationMock.mockReset()
    refetchMock.mockReset()
    loadFinancialStateMock.mockReset()
    sessionStorage.clear()
    spotsQueryState = {
      data: null,
      isLoading: true,
      error: null,
      refetch: refetchMock,
    }
    financialStoreState = {
      financialState: null,
      creditsBalance: 0,
      activeMembership: null,
      isLoading: false,
      error: null,
      loadFinancialState: loadFinancialStateMock,
    }
  })

  test('slow renderiza 10 tapetes, coach no clicable y confirma reserva con hold', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockResolvedValue({
      holdId: 123,
      occurrenceId: 5,
      spotId: 1,
      status: 'held',
      expiresAt: '2026-06-03T02:35:00',
      serverNow: '2026-06-03T02:30:00',
    })
    createReservationMock.mockResolvedValue({
      id: 77,
      spotId: 2,
      holdId: 123,
      occurrenceId: 5,
      status: 'confirmada',
    })

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

    const slowGrid = await screen.findByTestId('slow-grid')
    const slowSpot01 = within(slowGrid).getByTestId('slow-spot-01')
    const slowSpot02 = screen.getByTestId('slow-spot-02')
    expect(screen.getByText('Clase Demo Reservable API')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Seleccionar lugar' }).className).toMatch(/slowModal/)
    expect(screen.getByRole('group', { name: 'Fila frontal' }).className).toMatch(/machineGrid/)
    expect(screen.getByRole('complementary').className).toMatch(/reservationSidebar/)
    expect(Array.from(slowGrid.children)).toHaveLength(5)
    expect(slowGrid.children[0]).toHaveAttribute('data-testid', 'slow-spot-01')
    expect(slowGrid.children[1]).toHaveAttribute('data-testid', 'slow-spot-03')
    expect(slowGrid.children[2]).toHaveAttribute('data-testid', 'slow-coach-slot')
    expect(slowGrid.children[3]).toHaveAttribute('data-testid', 'slow-spot-07')
    expect(slowGrid.children[4]).toHaveAttribute('data-testid', 'slow-spot-09')
    expect(screen.getByTestId('slow-spot-10')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('slow-coach-slot'))
    expect(createSpotHoldMock).not.toHaveBeenCalled()

    await user.click(slowSpot01)
    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 5, spotId: 1 })
      expect(slowSpot01).toHaveAttribute('aria-pressed', 'true')
    })

    await user.click(slowSpot02)
    await waitFor(() => {
      expect(releaseSpotHoldMock).toHaveBeenCalledWith({ holdId: 123, occurrenceId: 5 })
      expect(createSpotHoldMock).toHaveBeenLastCalledWith({ occurrenceId: 5, spotId: 2 })
    })

    await user.click(screen.getByRole('button', { name: /Confirmar reserva/i }))
    await waitFor(() => {
      expect(createReservationMock).toHaveBeenCalledWith({
        claseId: 9,
        userId: 3,
        occurrenceId: 5,
        spotId: 2,
        holdId: 123,
      })
    })
    expect(screen.getByText(/Reserva confirmada/i)).toBeInTheDocument()
  }, 20000)

  test('stryde distingue bench 01 y treadmill 01', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildStrydeResponse(), isLoading: false, error: null, refetch: refetchMock }
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

    const bench01 = await screen.findByTestId('stryde-spot-bench-01')
    const treadmill01 = await screen.findByTestId('stryde-spot-treadmill-01')
    expect(screen.getByText('Clase STRYDE Demo')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Seleccionar equipo' }).className).toMatch(/strydeModal/)
    expect(screen.getByRole('group', { name: 'Bancos fila trasera' }).className).toMatch(/strydeBenchRow/)
    expect(screen.getByRole('group', { name: 'Bancos fila delantera' }).className).toMatch(/strydeBenchRowFront/)
    expect(screen.getByRole('group', { name: 'Caminadoras' }).className).toMatch(/strydeTreadRow/)

    await user.click(bench01)
    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 6, spotId: 1 })
      expect(bench01).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByText('ROTATION FLOW')).toBeInTheDocument()

    await user.click(treadmill01)
    await waitFor(() => {
      expect(releaseSpotHoldMock).toHaveBeenCalledWith({ holdId: 201, occurrenceId: 6 })
      expect(createSpotHoldMock).toHaveBeenLastCalledWith({ occurrenceId: 6, spotId: 10 })
      expect(screen.getByTestId('stryde-spot-bench-01')).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('stryde-spot-treadmill-01')).toHaveAttribute('aria-pressed', 'true')
    })
  }, 20000)

  test('libera hold una sola vez al cambiar spot y al desmontar', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
    createSpotHoldMock
      .mockResolvedValueOnce({
        holdId: 901,
        occurrenceId: 5,
        spotId: 1,
        status: 'held',
        expiresAt: '2026-06-03T02:35:00',
        serverNow: '2026-06-03T02:30:00',
      })
      .mockResolvedValueOnce({
        holdId: 902,
        occurrenceId: 5,
        spotId: 2,
        status: 'held',
        expiresAt: '2026-06-03T02:35:00',
        serverNow: '2026-06-03T02:30:00',
      })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    const { unmount } = render(
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

    const slowGrid = await screen.findByTestId('slow-grid')
    const slowSpot01 = within(slowGrid).getByTestId('slow-spot-01')
    const slowSpot02 = screen.getByTestId('slow-spot-02')

    await user.click(slowSpot01)
    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 5, spotId: 1 })
      expect(slowSpot01).toHaveAttribute('aria-pressed', 'true')
    })

    await user.click(slowSpot02)
    await waitFor(() => {
      expect(releaseSpotHoldMock).toHaveBeenCalledTimes(1)
      expect(releaseSpotHoldMock).toHaveBeenCalledWith({ holdId: 901, occurrenceId: 5 })
      expect(createSpotHoldMock).toHaveBeenLastCalledWith({ occurrenceId: 5, spotId: 2 })
    })

    const closeButton = screen.getByRole('button', { name: /cerrar/i })
    await user.click(closeButton)
    await waitFor(() => {
      expect(releaseSpotHoldMock).toHaveBeenCalledTimes(2)
      expect(releaseSpotHoldMock).toHaveBeenLastCalledWith({ holdId: 902, occurrenceId: 5 })
    })

    unmount()
    expect(releaseSpotHoldMock).toHaveBeenCalledTimes(2)
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
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
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
    expect(screen.queryByText(/^0 crÃ©ditos restantes./i)).not.toBeInTheDocument()

    const slowGrid = await screen.findByTestId('slow-grid')
    await userEvent.setup().click(within(slowGrid).getByTestId('slow-spot-01'))
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText(/Tu tiempo para reservar este lugar expir/i)).toBeInTheDocument()
  })

  test('monta con store financiero sin selector compuesto y no crashea', async () => {
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
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

  test('held, reserved e inactive quedan bloqueados y no crean hold', async () => {
    const response = buildSlowResponse()
    response.spots[0].status = 'held'
    response.spots[1].status = 'reserved'
    response.spots[2].status = 'inactive'
    spotsQueryState = { data: response, isLoading: false, error: null, refetch: refetchMock }

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

    const slowGrid = await screen.findByTestId('slow-grid')
    expect(within(slowGrid).getByTestId('slow-spot-01')).toBeDisabled()
    expect(screen.getByTestId('slow-spot-02')).toBeDisabled()
    expect(within(slowGrid).getByTestId('slow-spot-03')).toBeDisabled()

    fireEvent.click(within(slowGrid).getByTestId('slow-spot-01'))
    fireEvent.click(screen.getByTestId('slow-spot-02'))
    fireEvent.click(within(slowGrid).getByTestId('slow-spot-03'))
    expect(createSpotHoldMock).not.toHaveBeenCalled()
  })

  test('error de carga de spots muestra alerta', async () => {
    spotsQueryState = { data: null, isLoading: false, error: new Error('No pudimos cargar mapa de lugares.'), refetch: refetchMock }

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

    expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos cargar mapa de lugares/i)
  })

  test('spot error OCCURRENCE_NOT_RESERVABLE muestra mensaje claro', async () => {
    spotsQueryState = { data: null, isLoading: false, error: Object.assign(new Error("No hay spots configurados para esta ocurrencia"), { code: "OCCURRENCE_NOT_RESERVABLE" }), refetch: refetchMock }

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

    expect(await screen.findByRole("alert")).toHaveTextContent(/spots configurados/i)
  })
})
