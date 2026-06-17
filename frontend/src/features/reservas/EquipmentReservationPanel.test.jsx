import { render, screen, waitFor } from '@testing-library/react'
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
  const labels = ['01', '02', '03', '04', '06', '07', '08', '09', '10']
  return {
    occurrence_id: 5,
    class_id: 9,
    discipline: 'slow',
    class_name: 'Clase Demo Reservable API',
    coach_name: 'Coach Demo',
    occurrence_date: '2026-06-05',
    start_at: '2026-06-05T16:00:00',
    end_at: '2026-06-05T16:50:00',
    server_now: '2026-06-03T02:30:00',
    spots: labels.map((label, index) => ({
      spot_id: index + 1,
      label,
      equipment_type: 'mat',
      row: index < 5 ? 1 : 2,
      col: (index % 5) + 1,
      status: 'available',
      held_by_me: false,
      reservation_id: null,
    })),
  }
}

describe('EquipmentReservationPanel', () => {
  beforeEach(() => {
    vi.resetModules()
    createSpotHoldMock.mockReset()
    releaseSpotHoldMock.mockReset()
    createReservationMock.mockReset()
    refetchMock.mockReset()
    loadFinancialStateMock.mockReset()
    spotsQueryState = {
      data: null,
      isLoading: true,
      isFetching: false,
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

  test('al seleccionar segundo spot reemplaza el anterior y confirma solo un lugar', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 3,
      holds: [{ holdId: 124, spotId: 2, status: 'held' }],
    })
    createReservationMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 3,
      creditsCharged: 1,
      reservations: [
        { id: 31, spotId: 2, spotLabel: '02', equipmentLabel: 'Tapete', estado: 'confirmada' },
      ],
    })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 5,
          activeMembership: { creditsAvailable: 5 },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByTestId('slow-spot-02'))

    expect(screen.getByText('Lugar seleccionado')).toBeInTheDocument()
    expect(screen.getByText('Tapete 02')).toBeInTheDocument()
    expect(screen.getByText('Crédito a usar: 1 · Créditos disponibles: 5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 5, spotIds: [2], userId: 3 })
      expect(createReservationMock).toHaveBeenCalledWith({
        claseId: 9,
        userId: 3,
        occurrenceId: 5,
        spotIds: [2],
        holdIds: [124],
      })
    })

    expect(screen.getByText(/Reserva confirmada/i)).toBeInTheDocument()
    expect(screen.getByText('Tapete 02')).toBeInTheDocument()
  })

  test('si toca el mismo spot seleccionado, lo deselecciona', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 1,
          activeMembership: { creditsAvailable: 1 },
          isLoading: false,
          error: null,
        }}
      />
    )

    const spot = await screen.findByTestId('slow-spot-01')
    await user.click(spot)
    await user.click(spot)

    expect(screen.queryByText('Lugar seleccionado')).not.toBeInTheDocument()
  })

  test('si no tiene créditos disponibles no deja seleccionar lugar', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 0,
          activeMembership: { creditsAvailable: 0 },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))

    expect(screen.getByText('No tienes créditos suficientes para estos lugares.')).toBeInTheDocument()
    expect(screen.queryByText('Lugar seleccionado')).not.toBeInTheDocument()
    expect(createSpotHoldMock).not.toHaveBeenCalled()
    expect(releaseSpotHoldMock).not.toHaveBeenCalled()
  })

  test('admin manda user_id del cliente en holds y reservas', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 26,
      holds: [{ holdId: 123, spotId: 1, status: 'held' }],
    })
    createReservationMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 26,
      creditsCharged: 1,
      reservations: [{ id: 30, spotId: 1, spotLabel: '01', equipmentLabel: 'Tapete', estado: 'confirmada' }],
    })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={26}
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2 },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 5, spotIds: [1], userId: 26 })
      expect(createReservationMock).toHaveBeenCalledWith({
        claseId: 9,
        userId: 26,
        occurrenceId: 5,
        spotIds: [1],
        holdIds: [123],
      })
    })
  })

  test('si backend responde INSUFFICIENT_CREDITS muestra mensaje claro', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockRejectedValue({ code: 'INSUFFICIENT_CREDITS' })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2 },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    expect(await screen.findByText('No tienes créditos suficientes para estos lugares.')).toBeInTheDocument()
  })

  test('acepta hold singular legacy sin romper confirmación', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockResolvedValue({
      holdId: 123,
      occurrenceId: 5,
      spotId: 1,
      status: 'held',
    })
    createReservationMock.mockResolvedValue({
      id: 30,
      occurrenceId: 5,
      spotId: 1,
      spotLabel: '01',
      equipmentLabel: 'Tapete',
      estado: 'confirmada',
    })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2 },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    await waitFor(() => {
      expect(createReservationMock).toHaveBeenCalledWith({
        claseId: 9,
        userId: 3,
        occurrenceId: 5,
        spotIds: [1],
        holdIds: [123],
      })
    })
  })

  test('bloquea confirmación si occurrence pertenece a otra clase', async () => {
    const user = userEvent.setup()
    spotsQueryState = {
      data: {
        ...buildSlowResponse(),
        class_id: 77,
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
    }

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2 },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    expect(await screen.findByText('La ocurrencia seleccionada no pertenece a esta clase. Actualiza la vista e intenta de nuevo.')).toBeInTheDocument()
    expect(createSpotHoldMock).not.toHaveBeenCalled()
    expect(createReservationMock).not.toHaveBeenCalled()
  })

  test('muestra indicador sutil cuando spots se refrescan sin vaciar data previa', async () => {
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: true, error: null, refetch: refetchMock }

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2 },
          isLoading: false,
          error: null,
        }}
      />
    )

    expect(await screen.findByText('Actualizando lugares...')).toBeInTheDocument()
    expect(screen.queryByText('Cargando mapa...')).not.toBeInTheDocument()
  })
})
