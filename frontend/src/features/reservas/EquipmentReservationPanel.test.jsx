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
    expect(screen.getByRole('dialog', { name: 'Seleccionar lugar' })).toHaveTextContent('Crédito a usar: 1')

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

  test('si no tiene crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ditos disponibles no deja seleccionar lugar', async () => {
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

    expect(screen.getByRole('dialog', { name: 'Seleccionar lugar' })).toHaveTextContent(/cr.ditos suficientes para estos lugares/i)
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

    expect(await screen.findByRole('dialog', { name: 'Seleccionar lugar' })).toHaveTextContent(/cr.ditos suficientes para estos lugares/i)
  })

  test('acepta hold singular legacy sin romper confirmaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n', async () => {
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

  test('bloquea confirmaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n si occurrence pertenece a otra clase', async () => {
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

  test('bloquea confirmaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n cuando membresÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a limita un lugar por clase', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={3}
        hasExistingReservationInOccurrence
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2, limitOneSpotPerOccurrence: true },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    expect(await screen.findByText('Tu paquete permite solo un lugar por clase.')).toBeInTheDocument()
    expect(createSpotHoldMock).not.toHaveBeenCalled()
    expect(createReservationMock).not.toHaveBeenCalled()
  })

  test('permite reservar otra occurrence distinta si no hay reserva activa en esta occurrence', async () => {
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
      reservations: [{ reservationId: 30, spotId: 1, spotLabel: '01', equipmentType: 'mat', status: 'confirmada' }],
    })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={26}
        isAdminBooking
        hasExistingReservationInOccurrence={false}
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2, limitOneSpotPerOccurrence: true },
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
        occurrenceId: 5,
        spotIds: [1],
        holdIds: [123],
        userId: 26,
      })
    })
  })
  test('mapea ONE_SPOT_PER_OCCURRENCE_LIMIT con mensaje admin', async () => {
    const user = userEvent.setup()
    spotsQueryState = { data: buildSlowResponse(), isLoading: false, isFetching: false, error: null, refetch: refetchMock }
    createSpotHoldMock.mockResolvedValue({
      occurrenceId: 5,
      userId: 26,
      holds: [{ holdId: 123, spotId: 1, status: 'held' }],
    })
    createReservationMock.mockRejectedValue({ code: 'ONE_SPOT_PER_OCCURRENCE_LIMIT' })

    const { default: EquipmentReservationPanel } = await import('./EquipmentReservationPanel')
    render(
      <EquipmentReservationPanel
        occurrenceId={5}
        classId={9}
        userId={26}
        isAdminBooking
        financialState={{
          financialState: {},
          creditsBalance: 2,
          activeMembership: { creditsAvailable: 2, limitOneSpotPerOccurrence: false },
          isLoading: false,
          error: null,
        }}
      />
    )

    await user.click(await screen.findByTestId('slow-spot-01'))
    await user.click(screen.getByRole('button', { name: 'Reservar lugar' }))

    expect(await screen.findByRole('dialog', { name: 'Seleccionar lugar' })).toHaveTextContent(/solo un lugar por clase/i)
  })
})
