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

  test('permite seleccionar varios spots y confirma reserva multi', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 3,
      holds: [
        { holdId: 123, spotId: 1, status: 'held' },
        { holdId: 124, spotId: 2, status: 'held' },
      ],
    })
    createReservationMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 3,
      creditsCharged: 2,
      reservations: [
        { id: 30, spotId: 1, spotLabel: '01', equipmentLabel: 'Tapete', estado: 'confirmada' },
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

    expect(screen.getByText('Lugares seleccionados: 2')).toBeInTheDocument()
    expect(screen.getByText('Créditos a usar: 2 · Créditos disponibles: 5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reservar 2 lugares' }))

    await waitFor(() => {
      expect(createSpotHoldMock).toHaveBeenCalledWith({ occurrenceId: 5, spotIds: [1, 2], userId: 3 })
      expect(createReservationMock).toHaveBeenCalledWith({
        claseId: 9,
        userId: 3,
        occurrenceId: 5,
        spotIds: [1, 2],
        holdIds: [123, 124],
      })
    })

    expect(screen.getByText(/Reserva confirmada/i)).toBeInTheDocument()
    expect(screen.getByText('Tapete 01')).toBeInTheDocument()
    expect(screen.getByText('Tapete 02')).toBeInTheDocument()
  })

  test('no permite seleccionar más spots que créditos disponibles', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }

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

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByTestId('slow-spot-02'))

    expect(screen.getByText('No puedes seleccionar más lugares que tus créditos disponibles.')).toBeInTheDocument()
    expect(screen.getByText('Lugares seleccionados: 1')).toBeInTheDocument()
  })

  test('deseleccionar spot lo quita de la selección sin crear hold aún', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        financialState={{
          financialState: {},
          creditsBalance: 3,
          activeMembership: { creditsAvailable: 3 },
          isLoading: false,
          error: null,
        }}
      />
    )

    const spot = await screen.findByTestId('slow-spot-01')
    await user.click(spot)
    await user.click(spot)

    expect(screen.queryByText('Lugares seleccionados: 1')).not.toBeInTheDocument()
    expect(createSpotHoldMock).not.toHaveBeenCalled()
    expect(releaseSpotHoldMock).not.toHaveBeenCalled()
  })

  test('admin manda user_id del cliente en holds y reservas', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
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
    await user.click(screen.getByRole('button', { name: 'Reservar 1 lugar' }))

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
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
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
    await user.click(screen.getByRole('button', { name: 'Reservar 1 lugar' }))

    expect(await screen.findByText('No tienes créditos suficientes para estos lugares.')).toBeInTheDocument()
  })

  test('acepta hold singular legacy sin romper confirmación', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, error: null, refetch: refetchMock }
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
    await user.click(screen.getByRole('button', { name: 'Reservar 1 lugar' }))

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
})
