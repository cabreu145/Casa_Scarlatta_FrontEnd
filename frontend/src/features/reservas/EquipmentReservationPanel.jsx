import { useEffect, useMemo, useState } from 'react'
import { useFinancialStateStore } from '@/stores/financialStateStore'
import { mapOccurrenceSpotsResponseToFrontend } from '@/adapters/equipmentReservationAdapter'
import {
  useCreateReservationMutation,
  useCreateSpotHoldMutation,
  useDeleteSpotHoldMutation,
  useOccurrenceSpotsQuery,
} from '@/hooks/useApiQueries'
import {
  formatOccurrenceDateTime,
  getEquipmentSpotStatusLabel,
  normalizeDiscipline,
} from './equipmentLayoutConfig'
import EquipmentSeatSelectorView from './EquipmentSeatSelectorView'
import { getOneSpotPerOccurrenceMessage, resolveLimitOneSpotPerOccurrence } from '@/utils/reservationPolicy'

const useApiFinancialState = import.meta.env.VITE_USE_API_AUTH === 'true'

function resolveFinancialSummary({ financialState, creditsBalance, activeMembership, isLoading, error }) {
  if (isLoading) return { status: 'loading', label: 'Cargando créditos...' }
  if (error && !financialState && !activeMembership) {
    return { status: 'error', label: 'No pudimos cargar tus créditos.' }
  }
  if (!activeMembership && financialState) {
    return { status: 'no_membership', label: 'Sin membresÃ­a activa.' }
  }
  if (!activeMembership && (creditsBalance === null || creditsBalance === undefined || (Number(creditsBalance) === 0 && !financialState && !error))) {
    return { status: 'loading', label: 'Cargando créditos...' }
  }
  if (!activeMembership && (creditsBalance === null || creditsBalance === undefined)) {
    return { status: 'no_membership', label: 'Sin membresÃ­a activa.' }
  }

  const rawCredits = activeMembership?.creditsAvailable ?? creditsBalance ?? 0
  const numericCredits = Number(rawCredits)
  if (Number.isFinite(numericCredits) && numericCredits <= 0) {
    return { status: 'ready', label: '0 créditos restantes.' }
  }
  if (Number.isFinite(numericCredits)) {
    return { status: 'ready', label: `${numericCredits} créditos restantes.` }
  }
  return { status: 'ready', label: 'créditos disponibles.' }
}

function resolveReservationErrorMessage(error, { admin = false } = {}) {
  const code = String(error?.code ?? error?.message ?? '').toUpperCase()
  if (code.includes('HOLD_REQUIRED')) return 'Selecciona uno o mÃ¡s lugares antes de reservar.'
  if (code.includes('HOLD_EXPIRED')) return 'Tu selecciÃ³n expirÃ³. Vuelve a elegir lugares.'
  if (code.includes('HOLD_NOT_OWNED')) return 'La selecciÃ³n ya no pertenece a tu sesiÃ³n.'
  if (code.includes('HOLD_SPOT_MISMATCH')) return 'La selecciÃ³n ya no coincide con los lugares apartados.'
  if (code.includes('SPOT_HOLD_COUNT_MISMATCH')) return 'No pudimos apartar todos los lugares seleccionados. Intenta de nuevo.'
  if (code.includes('SPOT_ALREADY_RESERVED')) return 'Uno de los lugares ya fue reservado.'
  if (code.includes('SPOT_HELD_BY_ANOTHER_USER')) return 'Uno de los lugares estÃ¡ apartado por otra persona.'
  if (code.includes('INSUFFICIENT_CREDITS')) return 'No tienes créditos suficientes para estos lugares.'
  if (code.includes('DUPLICATE_SPOT_SELECTION')) return 'La selecciÃ³n contiene lugares duplicados.'
  if (code.includes('ONE_SPOT_PER_OCCURRENCE_LIMIT')) return getOneSpotPerOccurrenceMessage({ admin })
  if (code.includes('OCCURRENCE_FULL')) return 'La clase ya estÃ¡ llena.'
  if (code.includes('OCCURRENCE_NOT_RESERVABLE')) return 'Esta ocurrencia aÃºn no tiene spots configurados.'
  if (code.includes('CLASS_NOT_AVAILABLE')) return 'La ocurrencia seleccionada no pertenece a esta clase. Actualiza la vista e intenta de nuevo.'
  return 'No pudimos completar tu reserva.'
}

function resolveOccurrenceSpotsErrorMessage(error) {
  const code = String(error?.code ?? error?.message ?? '').toUpperCase()
  if (code.includes('OCCURRENCE_NOT_RESERVABLE') || code.includes('NO HAY SPOTS CONFIGURADOS')) {
    return 'Esta ocurrencia aÃºn no tiene spots configurados.'
  }
  return error?.message ?? 'No pudimos cargar mapa de lugares.'
}

function getMaxSelectableSpots({ creditsBalance, activeMembership }) {
  const rawCredits = activeMembership?.creditsAvailable ?? creditsBalance ?? 0
  const numericCredits = Number(rawCredits)
  if (!Number.isFinite(numericCredits)) return 0
  return Math.max(0, Math.floor(numericCredits))
}

function getReservationSuccessLabels(reservation) {
  const rows = Array.isArray(reservation?.reservations) ? reservation.reservations : []
  if (rows.length === 0 && reservation?.spotLabel) {
    return [`${reservation.equipmentLabel ?? reservation.equipmentType ?? 'Lugar'} ${reservation.spotLabel}`.trim()]
  }
  return rows.map((row) => `${row.equipmentLabel ?? row.equipmentType ?? 'Lugar'} ${row.spotLabel ?? ''}`.trim())
}

export default function EquipmentReservationPanel({
  occurrenceId,
  classId,
  userId,
  coachAvatarUrl = null,
  financialState = null,
  hasExistingReservationInOccurrence = false,
  limitErrorMessage = null,
  isAdminBooking = false,
  onReservationCreated,
  onClose,
}) {
  const loadFinancialState = useFinancialStateStore((s) => s.loadFinancialState)
  const storeFinancialState = useFinancialStateStore((s) => s.financialState)
  const storeCreditsBalance = useFinancialStateStore((s) => s.creditsBalance)
  const storeActiveMembership = useFinancialStateStore((s) => s.activeMembership)
  const storeFinancialLoading = useFinancialStateStore((s) => s.isLoading)
  const storeFinancialError = useFinancialStateStore((s) => s.error)

  const [selectionError, setSelectionError] = useState('')
  const [selectedSpotIds, setSelectedSpotIds] = useState([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [reservationSuccess, setReservationSuccess] = useState(null)

  const occurrenceSpotsQuery = useOccurrenceSpotsQuery(occurrenceId, { enabled: Boolean(occurrenceId) })
  const createSpotHoldMutation = useCreateSpotHoldMutation()
  const deleteSpotHoldMutation = useDeleteSpotHoldMutation()
  const createReservationMutation = useCreateReservationMutation()

  const resolvedFinancial = financialState ?? storeFinancialState
  const resolvedCreditsBalance = financialState?.creditsBalance ?? storeCreditsBalance
  const resolvedActiveMembership = financialState?.activeMembership ?? storeActiveMembership
  const resolvedFinancialLoading = financialState?.isLoading ?? storeFinancialLoading
  const resolvedFinancialError = financialState?.error ?? storeFinancialError
  const limitOneSpotPerOccurrence = resolveLimitOneSpotPerOccurrence(resolvedActiveMembership)
  const oneSpotPerOccurrenceMessage = limitErrorMessage ?? getOneSpotPerOccurrenceMessage({ admin: isAdminBooking })
  const creditsSummary = useMemo(() => resolveFinancialSummary({
    financialState: resolvedFinancial,
    creditsBalance: resolvedCreditsBalance,
    activeMembership: resolvedActiveMembership,
    isLoading: resolvedFinancialLoading,
    error: resolvedFinancialError,
  }), [resolvedFinancial, resolvedCreditsBalance, resolvedActiveMembership, resolvedFinancialLoading, resolvedFinancialError])

  useEffect(() => {
    if (!useApiFinancialState) return
    if (financialState) return
    if (storeFinancialState || storeFinancialLoading) return
    loadFinancialState({ enabled: true }).catch(() => {})
  }, [financialState, storeFinancialLoading, storeFinancialState, loadFinancialState])

  const layoutData = useMemo(
    () => (occurrenceSpotsQuery.data ? mapOccurrenceSpotsResponseToFrontend(occurrenceSpotsQuery.data) : null),
    [occurrenceSpotsQuery.data]
  )

  const layoutKind = normalizeDiscipline(
    layoutData?.discipline ?? layoutData?.raw?.discipline,
    layoutData?.className ?? layoutData?.class_name ?? layoutData?.raw?.class_name
  )
  const layoutClassId = Number(layoutData?.classId ?? layoutData?.claseId ?? layoutData?.raw?.class_id ?? layoutData?.raw?.classId ?? NaN)
  const selectedClassId = Number(classId)
  const currentSpots = layoutData?.spots ?? []
  const maxSelectableSpots = useMemo(() => getMaxSelectableSpots({
    creditsBalance: resolvedCreditsBalance,
    activeMembership: resolvedActiveMembership,
  }), [resolvedCreditsBalance, resolvedActiveMembership])

  const selectedSpots = useMemo(
    () => currentSpots.filter((spot) => selectedSpotIds.includes(Number(spot.spotId))),
    [currentSpots, selectedSpotIds]
  )

  const occurrenceLabel = useMemo(() => formatOccurrenceDateTime({
    occurrenceDate: layoutData?.occurrenceDate ?? layoutData?.occurrence_date,
    startAt: layoutData?.startAt ?? layoutData?.start_at,
  }), [layoutData?.occurrenceDate, layoutData?.occurrence_date, layoutData?.startAt, layoutData?.start_at])

  const handleClose = () => {
    setSelectedSpotIds([])
    setSelectionError('')
    onClose?.()
  }

  const handleSpotSelect = async (spot) => {
    if (!spot || isConfirming) return
    const spotId = Number(spot.spotId)
    const selectable = spot.status === 'available' || spot.status === 'held_by_me'
    if (!selectable) {
      setSelectionError(getEquipmentSpotStatusLabel(spot) === 'Ocupado'
        ? 'Uno de los lugares ya fue reservado.'
        : spot.status === 'held'
          ? 'Uno de los lugares estÃ¡ apartado por otra persona.'
          : 'Ese lugar no estÃ¡ disponible.')
      return
    }

    setSelectionError('')
    setSelectedSpotIds((current) => {
      if (current.includes(spotId)) {
        return []
      }

      if (Number.isFinite(maxSelectableSpots) && maxSelectableSpots <= 0) {
        setSelectionError('No tienes créditos suficientes para estos lugares.')
        return current
      }

      return [spotId]
    })
  }

  const handleConfirmReservation = async () => {
    if (!occurrenceId || !classId) {
      setSelectionError('No pudimos identificar los datos de tu reserva.')
      return
    }
    if (!userId) {
      setSelectionError('Selecciona un cliente vÃ¡lido antes de reservar.')
      return
    }
    if (selectedSpotIds.length === 0) {
      setSelectionError('Selecciona un lugar antes de reservar.')
      return
    }
    if (selectedSpotIds.length > 1) {
      setSelectionError('Solo puedes reservar un lugar a la vez. Para agregar otro asiento, confirma esta reserva y vuelve a reservar otro lugar.')
      return
    }
    if (limitOneSpotPerOccurrence && hasExistingReservationInOccurrence) {
      setSelectionError(oneSpotPerOccurrenceMessage)
      return
    }
    if (Number.isFinite(layoutClassId) && Number.isFinite(selectedClassId) && layoutClassId !== selectedClassId) {
      setSelectionError('La ocurrencia seleccionada no pertenece a esta clase. Actualiza la vista e intenta de nuevo.')
      return
    }
    if (Number.isFinite(maxSelectableSpots) && selectedSpotIds.length > maxSelectableSpots) {
      setSelectionError('No puedes seleccionar mÃ¡s lugares que tus créditos disponibles.')
      return
    }

    setSelectionError('')
    setIsConfirming(true)
    let createdHoldIds = []

    try {
      const holdResponse = await createSpotHoldMutation.mutateAsync({
        occurrenceId,
        spotIds: selectedSpotIds,
        userId,
      })

      const holds = Array.isArray(holdResponse?.holds) && holdResponse.holds.length > 0
        ? holdResponse.holds.filter((hold) => hold?.holdId != null)
        : (holdResponse?.holdId != null ? [holdResponse] : [])
      createdHoldIds = holds.map((hold) => hold.holdId)

      if (createdHoldIds.length !== selectedSpotIds.length) {
        const mismatchError = new Error('SPOT_HOLD_COUNT_MISMATCH')
        mismatchError.code = 'SPOT_HOLD_COUNT_MISMATCH'
        throw mismatchError
      }

      const reservation = await createReservationMutation.mutateAsync({
        claseId: classId,
        userId,
        occurrenceId,
        spotIds: selectedSpotIds,
        holdIds: createdHoldIds,
      })

      setReservationSuccess(reservation)
      setSelectedSpotIds([])
      onReservationCreated?.(reservation)
    } catch (error) {
      if (createdHoldIds.length > 0) {
        await Promise.allSettled(
          createdHoldIds.map((holdId) => deleteSpotHoldMutation.mutateAsync({ holdId, occurrenceId }))
        )
      }
      setSelectionError(resolveReservationErrorMessage(error, { admin: isAdminBooking }))
      if (['HOLD_EXPIRED', 'SPOT_ALREADY_RESERVED', 'SPOT_HELD_BY_ANOTHER_USER', 'SPOT_HOLD_COUNT_MISMATCH'].includes(String(error?.code ?? '').toUpperCase())) {
        occurrenceSpotsQuery.refetch()
      }
    } finally {
      setIsConfirming(false)
    }
  }

  const noSpotsConfigured = Boolean(!occurrenceSpotsQuery.isLoading && !occurrenceSpotsQuery.error && layoutData && currentSpots.length === 0)

  if (occurrenceSpotsQuery.isLoading) {
    return <div role="status" style={{ padding: 24, color: 'var(--muted)' }}>Cargando mapa...</div>
  }

  if (occurrenceSpotsQuery.error) {
    return <div role="alert" style={{ padding: 24, color: '#b42318' }}>{resolveOccurrenceSpotsErrorMessage(occurrenceSpotsQuery.error)}</div>
  }

  if (noSpotsConfigured) {
    return <div role="alert" style={{ padding: 24, color: '#b42318' }}>Esta ocurrencia aÃºn no tiene spots configurados.</div>
  }

  if (!layoutData || !layoutKind) return null

  return (
    <EquipmentSeatSelectorView
      discipline={layoutKind}
      spots={currentSpots}
      className={layoutData?.className ?? layoutData?.class_name ?? 'Clase'}
      coachName={layoutData?.coachName ?? layoutData?.coach_name ?? 'Coach'}
      coachAvatarUrl={coachAvatarUrl}
      classDateTime={occurrenceLabel.fullLabel}
      selectedSpotIds={selectedSpotIds}
      activeHold={null}
      holdCountdown={null}
      creditsSummary={creditsSummary}
      creditsBalance={resolvedCreditsBalance}
      creditsToUse={selectedSpotIds.length}
      maxSelectableSpots={Number.isFinite(maxSelectableSpots) ? maxSelectableSpots : selectedSpotIds.length}
      selectionError={selectionError}
      isRefreshing={occurrenceSpotsQuery.isFetching && Boolean(occurrenceSpotsQuery.data)}
      isBusy={isConfirming}
      isConfirming={isConfirming}
      reservationSuccess={reservationSuccess}
      successSpotLabel={getReservationSuccessLabels(reservationSuccess)}
      onSelectSpot={handleSpotSelect}
      onConfirm={handleConfirmReservation}
      onClose={handleClose}
    />
  )
}
