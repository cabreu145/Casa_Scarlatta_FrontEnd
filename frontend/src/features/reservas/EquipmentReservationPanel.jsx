import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { crearReservaApi } from '@/services/reservasApiService'
import { getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { useFinancialStateStore } from '@/stores/financialStateStore'
import { useReservasStore } from '@/stores/reservasStore'
import { createSpotHoldApi, getOccurrenceSpotsApi, releaseSpotHoldApi } from '@/services/equipmentReservationApiService'
import { mapOccurrenceSpotsResponseToFrontend } from '@/adapters/equipmentReservationAdapter'
import {
  buildSpotLookup,
  formatOccurrenceDateTime,
  formatHoldCountdown,
  getEquipmentSpotKey,
  getEquipmentSpotLabel,
  getEquipmentSpotStatusLabel,
  normalizeDiscipline,
} from './equipmentLayoutConfig'
import EquipmentSeatSelectorView from './EquipmentSeatSelectorView'

const useApiFinancialState = import.meta.env.VITE_USE_API_AUTH === 'true'
const HOLD_STORAGE_KEY = 'active_equipment_reservation_holds'

function safeStorage() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function readStoredHoldMap() {
  const storage = safeStorage()
  if (!storage) return {}
  try {
    return JSON.parse(storage.getItem(HOLD_STORAGE_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

function writeStoredHoldMap(map) {
  const storage = safeStorage()
  if (!storage) return
  storage.setItem(HOLD_STORAGE_KEY, JSON.stringify(map ?? {}))
}

function upsertStoredHold(occurrenceId, hold) {
  if (!occurrenceId || !hold?.holdId) return
  const map = readStoredHoldMap()
  map[String(occurrenceId)] = {
    holdId: hold.holdId,
    occurrenceId,
    spotId: hold.spotId ?? null,
    expiresAt: hold.expiresAt ?? null,
    serverNow: hold.serverNow ?? null,
    spotKey: hold.spotId && hold.label ? `${String(hold.equipmentType ?? '').toLowerCase()}:${String(hold.label).padStart(2, '0')}` : hold.spotKey ?? null,
  }
  writeStoredHoldMap(map)
}

function readStoredHold(occurrenceId) {
  if (!occurrenceId) return null
  const map = readStoredHoldMap()
  return map[String(occurrenceId)] ?? null
}

function removeStoredHold(occurrenceId) {
  if (!occurrenceId) return
  const map = readStoredHoldMap()
  if (map[String(occurrenceId)]) {
    delete map[String(occurrenceId)]
    writeStoredHoldMap(map)
  }
}

function resolveFinancialSummary({ financialState, creditsBalance, activeMembership, isLoading, error }) {
  if (isLoading) return { status: 'loading', label: 'Cargando créditos...' }
  if (error && !financialState && !activeMembership) {
    return { status: 'error', label: 'No pudimos cargar tus créditos.' }
  }
  if (!activeMembership && financialState) {
    return { status: 'no_membership', label: 'Sin membresía activa.' }
  }
  if (!activeMembership && (creditsBalance === null || creditsBalance === undefined || (Number(creditsBalance) === 0 && !financialState && !error))) {
    return { status: 'loading', label: 'Cargando créditos...' }
  }
  if (!activeMembership && (creditsBalance === null || creditsBalance === undefined)) {
    return { status: 'no_membership', label: 'Sin membresía activa.' }
  }

  const rawCredits = activeMembership?.creditsAvailable ?? creditsBalance ?? 0
  if (rawCredits === Infinity || rawCredits === '∞') {
    return { status: 'ready', label: 'Créditos ilimitados.' }
  }
  const numericCredits = Number(rawCredits)
  if (Number.isFinite(numericCredits) && numericCredits <= 0) {
    return { status: 'ready', label: '0 créditos restantes.' }
  }
  if (Number.isFinite(numericCredits)) {
    return { status: 'ready', label: `${numericCredits} créditos restantes.` }
  }
  return { status: 'ready', label: 'Créditos disponibles.' }
}

function resolveReservationErrorMessage(error) {
  const code = String(error?.code ?? error?.message ?? '').toUpperCase()
  if (code.includes('HOLD_REQUIRED')) return 'Selecciona un lugar antes de reservar.'
  if (code.includes('HOLD_EXPIRED')) return 'Tu tiempo para reservar este lugar expiró.'
  if (code.includes('HOLD_NOT_OWNED')) return 'Este bloqueo ya no pertenece a tu sesión.'
  if (code.includes('SPOT_ALREADY_RESERVED')) return 'Ese lugar acaba de ser reservado por otra persona.'
  if (code.includes('SPOT_HELD_BY_ANOTHER_USER')) return 'Ese lugar está bloqueado temporalmente por otra persona.'
  if (code.includes('INSUFFICIENT_CREDITS')) return 'No tienes créditos suficientes.'
  if (code.includes('OCCURRENCE_FULL')) return 'La clase ya está llena.'
  return 'No pudimos completar tu reserva.'
}

function formatReservationError(error) {
  return resolveReservationErrorMessage(error)
}

export default function EquipmentReservationPanel({
  occurrenceId,
  classId,
  userId,
  financialState = null,
  onReservationCreated,
  onClose,
}) {
  const loadFinancialState = useFinancialStateStore((s) => s.loadFinancialState)
  const storeFinancialState = useFinancialStateStore((s) => s.financialState)
  const storeCreditsBalance = useFinancialStateStore((s) => s.creditsBalance)
  const storeActiveMembership = useFinancialStateStore((s) => s.activeMembership)
  const storeFinancialLoading = useFinancialStateStore((s) => s.isLoading)
  const storeFinancialError = useFinancialStateStore((s) => s.error)
  const loadMisReservasFromApi = useReservasStore((s) => s.loadMisReservasFromApi)

  const [layoutData, setLayoutData] = useState(null)
  const [isLoadingSpots, setIsLoadingSpots] = useState(true)
  const [spotsError, setSpotsError] = useState('')
  const [selectionError, setSelectionError] = useState('')
  const [selectedSpotId, setSelectedSpotId] = useState(null)
  const [activeHold, setActiveHold] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [reservationSuccess, setReservationSuccess] = useState(null)
  const [clockTick, setClockTick] = useState(0)
  const activeHoldRef = useRef(null)

  useEffect(() => {
    activeHoldRef.current = activeHold
  }, [activeHold])

  const resolvedFinancial = financialState ?? storeFinancialState
  const resolvedCreditsBalance = financialState?.creditsBalance ?? storeCreditsBalance
  const resolvedActiveMembership = financialState?.activeMembership ?? storeActiveMembership
  const resolvedFinancialLoading = financialState?.isLoading ?? storeFinancialLoading
  const resolvedFinancialError = financialState?.error ?? storeFinancialError
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
    loadFinancialState().catch(() => {})
  }, [financialState, storeFinancialLoading, storeFinancialState, loadFinancialState])

  const layoutKind = normalizeDiscipline(layoutData?.discipline ?? layoutData?.raw?.discipline)

  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return null
    return (layoutData?.spots ?? []).find((spot) => Number(spot.spotId) === Number(selectedSpotId)) ?? null
  }, [layoutData?.spots, selectedSpotId])

  const currentServerNowMs = useMemo(() => {
    const source = activeHold?.serverNow ?? layoutData?.serverNow ?? null
    if (!source) return Date.now()
    const parsed = Date.parse(source)
    return Number.isNaN(parsed) ? Date.now() : parsed
  }, [activeHold?.serverNow, layoutData?.serverNow, clockTick])

  const currentClientOffset = useMemo(() => {
    const source = activeHold?.serverNow ?? layoutData?.serverNow ?? null
    if (!source) return 0
    const parsed = Date.parse(source)
    if (Number.isNaN(parsed)) return 0
    return parsed - Date.now()
  }, [activeHold?.serverNow, layoutData?.serverNow, clockTick])

  const remainingHoldMs = useMemo(() => {
    if (!activeHold?.expiresAt) return 0
    const expiresAt = Date.parse(activeHold.expiresAt)
    if (Number.isNaN(expiresAt)) return 0
    return expiresAt - (Date.now() + currentClientOffset)
  }, [activeHold?.expiresAt, currentClientOffset, clockTick])

  const remainingHoldLabel = useMemo(() => {
    if (!activeHold?.expiresAt) return null
    return formatHoldCountdown(activeHold.expiresAt, new Date(currentServerNowMs).toISOString())
  }, [activeHold?.expiresAt, currentServerNowMs, clockTick])

  const occurrenceLabel = useMemo(() => formatOccurrenceDateTime({
    occurrenceDate: layoutData?.occurrenceDate ?? layoutData?.occurrence_date,
    startAt: layoutData?.startAt ?? layoutData?.start_at,
  }), [layoutData?.occurrenceDate, layoutData?.occurrence_date, layoutData?.startAt, layoutData?.start_at])

  const restoreHoldFromStorage = useCallback((spotsPayload) => {
    if (!occurrenceId) return
    const stored = readStoredHold(occurrenceId)
    if (!stored?.holdId || !stored?.spotId || !stored?.expiresAt) return

    const expiresAtMs = Date.parse(stored.expiresAt)
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
      removeStoredHold(occurrenceId)
      return
    }

    const lookup = buildSpotLookup(spotsPayload?.spots ?? [])
    const storedKey = stored.spotKey ?? null
    const fallbackSpot = lookup.get(storedKey) ?? [...lookup.values()].find((spot) => Number(spot.spotId) === Number(stored.spotId)) ?? null
    if (!fallbackSpot) {
      removeStoredHold(occurrenceId)
      return
    }

    setActiveHold({
      holdId: stored.holdId,
      occurrenceId,
      spotId: fallbackSpot.spotId,
      expiresAt: stored.expiresAt,
      serverNow: stored.serverNow ?? spotsPayload?.serverNow ?? null,
    })
    setSelectedSpotId(fallbackSpot.spotId)
  }, [occurrenceId])

  const loadSpots = useCallback(async () => {
    if (!occurrenceId) {
      setIsLoadingSpots(false)
      setSpotsError('No pudimos identificar la clase a reservar.')
      return
    }

    setIsLoadingSpots(true)
    setSpotsError('')
    try {
      const data = await getOccurrenceSpotsApi({ occurrenceId })
      setLayoutData(mapOccurrenceSpotsResponseToFrontend(data ?? {}))
      setIsLoadingSpots(false)
      restoreHoldFromStorage(mapOccurrenceSpotsResponseToFrontend(data ?? {}))
    } catch (error) {
      setLayoutData(null)
      setIsLoadingSpots(false)
      setSpotsError(error?.message ?? 'No pudimos cargar mapa de lugares.')
    }
  }, [occurrenceId, restoreHoldFromStorage])

  useEffect(() => {
    loadSpots()
    return () => {
      if (activeHoldRef.current?.holdId) {
        void Promise.resolve(releaseSpotHoldApi({ holdId: activeHoldRef.current.holdId })).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSpots, occurrenceId])

  useEffect(() => {
    if (!activeHold?.expiresAt) return undefined
    const timer = window.setInterval(() => {
      setClockTick((tick) => tick + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeHold?.expiresAt])

  useEffect(() => {
    if (!activeHold?.expiresAt) return
    if (remainingHoldMs > 0) return
    if (!selectedSpotId) return
    setSelectionError('Tu tiempo para reservar este lugar expiró. Selecciona otro lugar.')
    setActiveHold(null)
    setSelectedSpotId(null)
    removeStoredHold(occurrenceId)
    setClockTick((tick) => tick + 1)
    loadSpots()
  }, [activeHold?.expiresAt, remainingHoldMs, occurrenceId, loadSpots, selectedSpotId])

  const clearCurrentHold = useCallback(async () => {
    if (!activeHold?.holdId) {
      removeStoredHold(occurrenceId)
      setSelectedSpotId(null)
      setActiveHold(null)
      return
    }

    try {
      await releaseSpotHoldApi({ holdId: activeHold.holdId })
    } catch {
      // hold TTL covers release failures
    } finally {
      removeStoredHold(occurrenceId)
      setSelectedSpotId(null)
      setActiveHold(null)
    }
  }, [activeHold?.holdId, occurrenceId])

  const handleClose = useCallback(async () => {
    await clearCurrentHold()
    onClose?.()
  }, [clearCurrentHold, onClose])

  const handleSpotSelect = useCallback(async (spot) => {
    if (!spot) return
    const spotKey = getEquipmentSpotKey(spot)
    const selectable = spot.status === 'available' || spot.status === 'held_by_me'
    if (!selectable) {
      setSelectionError(getEquipmentSpotStatusLabel(spot) === 'Ocupado'
        ? 'Ese lugar acaba de ser reservado por otra persona.'
        : spot.status === 'held'
          ? 'Ese lugar está bloqueado temporalmente por otra persona.'
          : 'Ese lugar no está disponible.')
      return
    }
    if (isSelecting || isConfirming) return
    if (Number(selectedSpotId) === Number(spot.spotId) && activeHold?.holdId) return

    setSelectionError('')
    setIsSelecting(true)
    try {
      if (activeHold?.holdId) {
        try {
          await releaseSpotHoldApi({ holdId: activeHold.holdId })
        } catch {
          // no block selection
        }
      }

      const hold = await createSpotHoldApi({ occurrenceId, spotId: spot.spotId })
      setSelectedSpotId(spot.spotId)
      setActiveHold({
        holdId: hold.holdId,
        occurrenceId,
        spotId: spot.spotId,
        expiresAt: hold.expiresAt,
        serverNow: hold.serverNow ?? layoutData?.serverNow ?? null,
      })
      upsertStoredHold(occurrenceId, {
        holdId: hold.holdId,
        spotId: spot.spotId,
        expiresAt: hold.expiresAt,
        serverNow: hold.serverNow ?? layoutData?.serverNow ?? null,
        spotKey,
        equipmentType: spot.equipmentType,
        label: spot.label,
      })
      setLayoutData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          spots: (prev.spots ?? []).map((rowSpot) => {
            if (Number(rowSpot.spotId) !== Number(spot.spotId)) return rowSpot
            return {
              ...rowSpot,
              status: 'held_by_me',
              heldByMe: true,
              heldUntil: hold.expiresAt,
            }
          }),
        }
      })
      setClockTick((tick) => tick + 1)
    } catch (error) {
      setSelectedSpotId(null)
      setActiveHold(null)
      removeStoredHold(occurrenceId)
      setSelectionError(formatReservationError(error))
      loadSpots()
    } finally {
      setIsSelecting(false)
    }
  }, [activeHold?.holdId, isSelecting, isConfirming, occurrenceId, selectedSpotId, layoutData?.serverNow, loadSpots])

  const refreshFinancialState = useCallback(async () => {
    await loadFinancialState().catch(() => {})
    await getMyCreditMovementsPaginatedApi({ page: 1, pageSize: 8 }).catch(() => {})
    if (loadMisReservasFromApi) {
      await loadMisReservasFromApi().catch(() => {})
    }
  }, [loadFinancialState, loadMisReservasFromApi])

  const handleConfirmReservation = useCallback(async () => {
    if (!selectedSpot || !activeHold?.holdId) {
      setSelectionError('Selecciona un lugar antes de reservar.')
      return
    }
    if (remainingHoldMs <= 0) {
      setSelectionError('Tu tiempo para reservar este lugar expiró.')
      return
    }
    if (!classId || !userId || !occurrenceId) {
      setSelectionError('No pudimos identificar los datos de tu reserva.')
      return
    }

    setSelectionError('')
    setIsConfirming(true)
    try {
      const reservation = await crearReservaApi({
        claseId: classId,
        userId,
        occurrenceId,
        spotId: selectedSpot.spotId,
        holdId: activeHold.holdId,
      })
      removeStoredHold(occurrenceId)
      setReservationSuccess(reservation)
      setActiveHold(null)
      setSelectedSpotId(null)
      await refreshFinancialState()
      await loadSpots()
      onReservationCreated?.(reservation)
    } catch (error) {
      setSelectionError(formatReservationError(error))
      if (error?.code === 'HOLD_EXPIRED' || error?.code === 'SPOT_ALREADY_RESERVED' || error?.code === 'SPOT_HELD_BY_ANOTHER_USER') {
        loadSpots()
      }
    } finally {
      setIsConfirming(false)
    }
  }, [activeHold?.holdId, classId, occurrenceId, onReservationCreated, refreshFinancialState, remainingHoldMs, selectedSpot, userId, loadSpots])

  const currentSpots = layoutData?.spots ?? []
  const holdCountdown = activeHold?.expiresAt ? remainingHoldLabel : null
  const className = layoutData?.className ?? layoutData?.class_name ?? 'Clase'
  const coachName = layoutData?.coachName ?? layoutData?.coach_name ?? 'Coach'
  const classDateTime = occurrenceLabel.fullLabel

  if (isLoadingSpots) {
    return <div role="status" style={{ padding: 24, color: 'var(--muted)' }}>Cargando mapa...</div>
  }

  if (spotsError) {
    return <div role="alert" style={{ padding: 24, color: '#b42318' }}>{spotsError}</div>
  }

  if (!layoutData || !layoutKind) return null

  const successSpot = reservationSuccess
    ? currentSpots.find((spot) => Number(spot.spotId) === Number(reservationSuccess.spotId))
    : null

  return (
    <EquipmentSeatSelectorView
      discipline={layoutKind}
      spots={currentSpots}
      className={className}
      coachName={coachName}
      classDateTime={classDateTime}
      selectedSpotId={selectedSpotId}
      activeHold={activeHold}
      holdCountdown={holdCountdown}
      creditsSummary={creditsSummary}
      creditsBalance={resolvedCreditsBalance}
      selectionError={selectionError}
      isBusy={isSelecting || isConfirming}
      isConfirming={isConfirming}
      reservationSuccess={reservationSuccess}
      successSpotLabel={successSpot ? getEquipmentSpotLabel(successSpot) : 'Lugar'}
      onSelectSpot={handleSpotSelect}
      onConfirm={handleConfirmReservation}
      onClose={handleClose}
    />
  )


}
