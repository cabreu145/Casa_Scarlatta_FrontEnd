import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'
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
  getEquipmentLabelForType,
  getEquipmentLayoutConfig,
  getEquipmentSpotKey,
  getEquipmentSpotLabel,
  getEquipmentSpotStatusLabel,
  normalizeDiscipline,
} from './equipmentLayoutConfig'
import styles from '../clases/SeatSelector.module.css'

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

function getSpotCardClassName({ layoutKind, status, selected }) {
  const statusClass = status === 'available'
    ? layoutKind === 'slow' ? styles.cardAvailable : styles.strydeAvail
    : status === 'held_by_me'
      ? layoutKind === 'slow' ? styles.cardSelected : styles.strydeSelected
      : layoutKind === 'slow'
        ? styles.cardOccupied
        : styles.strydeOccupied
  const selectedClass = selected
    ? layoutKind === 'slow' ? styles.cardSelected : styles.strydeSelected
    : ''
  return [layoutKind === 'slow' ? styles.machineCard : styles.strydeCard, statusClass, selectedClass].filter(Boolean).join(' ')
}

function SpotButton({ spot, layoutKind, selected, onSelect, disabled }) {
  const equipmentLabel = getEquipmentLabelForType(spot.equipmentType)
  const statusLabel = getEquipmentSpotStatusLabel(spot)
  const title = `${equipmentLabel} ${spot.label} · ${statusLabel}`

  return (
    <button
      type="button"
      className={getSpotCardClassName({ layoutKind, status: spot.status, selected })}
      onClick={() => onSelect(spot)}
      disabled={disabled}
      aria-label={title}
      aria-pressed={selected}
      title={title}
    >
      <span className={[
        layoutKind === 'slow' ? styles.statusIndicator : styles.strydeStatusDot,
        spot.status === 'available'
          ? layoutKind === 'slow' ? styles.indGreen : styles.strydeGreen
          : spot.status === 'held_by_me'
            ? layoutKind === 'slow' ? styles.indWine : styles.strydeWine
            : layoutKind === 'slow' ? styles.indGray : styles.strydeGray,
      ].filter(Boolean).join(' ')} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
        <div style={{ fontSize: layoutKind === 'slow' ? 15 : 14, fontWeight: 700, letterSpacing: '0.04em' }}>
          {equipmentLabel} {spot.label}
        </div>
        <div style={{ fontSize: 11, opacity: 0.82 }}>{statusLabel}</div>
      </div>
    </button>
  )
}

function CoachBadge({ coachName, coachPhoto, layoutKind }) {
  const initials = (coachName ?? 'Coach')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={layoutKind === 'slow' ? styles.slowInstructorBadge : styles.instructorBadge}>
      <div className={layoutKind === 'slow' ? styles.slowInstructorAvatar : styles.instructorAvatar}>
        {coachPhoto ? (
          <img src={coachPhoto} alt={coachName ?? 'Coach'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '50%' }} />
        ) : initials}
      </div>
      <span className={layoutKind === 'slow' ? styles.slowInstructorName : styles.instructorName}>{coachName ?? 'Coach'}</span>
      <span className={layoutKind === 'slow' ? styles.slowInstructorTitle : styles.instructorTitle}>COACH</span>
    </div>
  )
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
  const [selectedSpotKey, setSelectedSpotKey] = useState(null)
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
  const layoutConfig = getEquipmentLayoutConfig(layoutData?.discipline)

  const spotLookup = useMemo(() => buildSpotLookup(layoutData?.spots ?? []), [layoutData?.spots])
  const selectedSpot = useMemo(() => {
    if (!selectedSpotKey) return null
    return spotLookup.get(selectedSpotKey) ?? null
  }, [selectedSpotKey, spotLookup])

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
    setSelectedSpotKey(getEquipmentSpotKey(fallbackSpot))
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
    if (!selectedSpotKey) return
    setSelectionError('Tu tiempo para reservar este lugar expiró. Selecciona otro lugar.')
    setActiveHold(null)
    setSelectedSpotKey(null)
    removeStoredHold(occurrenceId)
    setClockTick((tick) => tick + 1)
    loadSpots()
  }, [activeHold?.expiresAt, remainingHoldMs, occurrenceId, loadSpots, selectedSpotKey])

  const clearCurrentHold = useCallback(async () => {
    if (!activeHold?.holdId) {
      removeStoredHold(occurrenceId)
      setSelectedSpotKey(null)
      setActiveHold(null)
      return
    }

    try {
      await releaseSpotHoldApi({ holdId: activeHold.holdId })
    } catch {
      // hold TTL covers release failures
    } finally {
      removeStoredHold(occurrenceId)
      setSelectedSpotKey(null)
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
    if (selectedSpotKey === spotKey && activeHold?.holdId) return

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
      setSelectedSpotKey(spotKey)
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
      setSelectedSpotKey(null)
      setActiveHold(null)
      removeStoredHold(occurrenceId)
      setSelectionError(formatReservationError(error))
      loadSpots()
    } finally {
      setIsSelecting(false)
    }
  }, [activeHold?.holdId, isSelecting, isConfirming, occurrenceId, selectedSpotKey, layoutData?.serverNow, loadSpots])

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
      setSelectedSpotKey(null)
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

  const renderLegend = useMemo(() => {
    const entries = layoutKind === 'slow'
      ? [
          { dot: styles.indGreen, label: 'Disponible' },
          { dot: styles.indGray, label: 'Ocupado' },
          { dot: styles.indWine, label: 'Tu lugar' },
        ]
      : [
          { dot: styles.strydeGreen, label: 'Disponible' },
          { dot: styles.strydeGray, label: 'Ocupado' },
          { dot: styles.strydeWine, label: 'Tu lugar' },
        ]

    return entries.map(({ dot, label }) => (
      <span key={label} className={styles.legendItem}>
        <span className={`${layoutKind === 'slow' ? styles.statusIndicator : styles.strydeStatusDot} ${dot}`} style={{ position: 'static', width: 8, height: 8 }} />
        {label}
      </span>
    ))
  }, [layoutKind])

  const renderRow = useCallback((section) => {
    const rowSpots = (section.labels ?? []).map((label) => {
      const key = `${section.equipmentType}:${label}`
      const spot = spotLookup.get(key) ?? {
        spotId: null,
        label,
        equipmentType: section.equipmentType,
        status: 'inactive',
      }
      return { spot, key }
    })

    return (
      <div
        key={section.key ?? `${section.equipmentType}-${(section.labels ?? []).join('-')}`}
        className={layoutKind === 'slow' ? styles.machineGrid : (
          section.equipmentType === 'bench' ? styles.strydeBenchRow : styles.strydeTreadRow
        )}
        style={layoutKind === 'slow' ? { '--cols': section.labels?.length ?? 5 } : undefined}
        role="group"
        aria-label={section.ariaLabel}
      >
        {rowSpots.map(({ spot, key }) => {
          const selected = selectedSpotKey === key
          const disabled = isLoadingSpots || isSelecting || isConfirming || spot.status === 'held' || spot.status === 'reserved' || spot.status === 'inactive'
          return (
            <SpotButton
              key={key}
              spot={spot}
              layoutKind={layoutKind}
              selected={selected}
              onSelect={handleSpotSelect}
              disabled={disabled && !selected}
            />
          )
        })}
      </div>
    )
  }, [handleSpotSelect, isConfirming, isLoadingSpots, isSelecting, layoutKind, selectedSpotKey, spotLookup])

  const currentSpots = layoutData?.spots ?? []
  const selectedSpotDisplay = selectedSpot ? getEquipmentSpotLabel(selectedSpot) : null
  const holdCountdown = activeHold?.expiresAt ? remainingHoldLabel : null
  const className = layoutData?.className ?? layoutData?.class_name ?? 'Clase'
  const coachName = layoutData?.coachName ?? layoutData?.coach_name ?? 'Coach'
  const classDateTime = occurrenceLabel.fullLabel

  if (reservationSuccess) {
    const successSpot = currentSpots.find((spot) => Number(spot.spotId) === Number(reservationSuccess.spotId))
    const successLabel = successSpot ? getEquipmentSpotLabel(successSpot) : selectedSpotDisplay ?? 'Lugar'
    return (
      <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className={layoutKind === 'slow' ? styles.slowModal : styles.strydeModal} role="dialog" aria-modal="true" aria-label="Reserva confirmada">
          <div className={styles.successView}>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar" style={{ position: 'absolute', top: 14, right: 14 }}>
              <X size={20} />
            </button>
            <CheckCircle size={52} strokeWidth={1.5} className={styles.successIcon} />
            <h2 className={styles.successTitle}>Reserva confirmada</h2>
            <p className={styles.successSub}>
              <strong>{className}</strong><br />
              {classDateTime} · Coach: {coachName}
            </p>
            <p className={styles.successSeat}>{successLabel}</p>
            <p className={styles.successCredits}>
              Tus créditos y reservas se actualizaron correctamente.
            </p>
            <button className={layoutKind === 'slow' ? styles.slowConfirmBtn : styles.strydeConfirmBtn} onClick={handleClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={layoutKind === 'slow' ? styles.slowModal : styles.strydeModal} role="dialog" aria-modal="true" aria-label="Seleccionar lugar">
        {isLoadingSpots ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Cargando mapa...</div>
        ) : spotsError ? (
          <div style={{ padding: 24, color: '#b42318' }}>{spotsError}</div>
        ) : layoutData ? (
          layoutKind === 'slow' ? (
            <div className={styles.fitnessLayout}>
              <div className={styles.machineSection}>
                <div className={styles.slowMirrors}>
                  <div className={styles.slowMirrorArch} />
                  <div className={styles.slowMirrorArch} />
                  <div className={styles.slowMirrorArch} />
                  <div className={styles.slowMirrorArch} />
                  <div className={styles.slowMirrorArch} />
                </div>

                <div className={styles.frenteBanner}>
                  <div className={styles.frenteLine} />
                  <span className={styles.frenteLabel}>FRENTE</span>
                  <div className={styles.frenteLine} />
                </div>

                {renderRow(layoutConfig.sections[2])}
                <CoachBadge coachName={coachName} layoutKind="slow" />
                {renderRow(layoutConfig.sections[4])}

                <div className={styles.fitnessLegend}>{renderLegend}</div>
              </div>

              <aside className={styles.reservationSidebar}>
                <div className={styles.sbBlock}>
                  <div className={styles.sbTopRow}>
                    <span className={styles.sbSlowBadge}>SLOW</span>
                    <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar"><X size={18} /></button>
                  </div>
                  <div className={styles.sbTitle}>{className}</div>
                  <div className={styles.sbCoach}>{coachName}</div>
                  <div className={styles.sbTime}>{classDateTime}</div>
                </div>
                <div className={styles.sbDivider} />
                <div className={styles.sbSelectionBlock}>
                  {selectedSpot ? (
                    <>
                      <div className={styles.sbSelLabel}>Tu lugar elegido</div>
                      <div className={styles.sbSelMat}>{selectedSpotDisplay}</div>
                      <div className={styles.sbSelDetail}>
                        {activeHold?.expiresAt && holdCountdown
                          ? `Tienes ${holdCountdown} para confirmar tu lugar`
                          : 'Selecciona un lugar para continuar'}
                      </div>
                    </>
                  ) : (
                    <div className={styles.sbSelHint}>Elige tu lugar<br />en el mapa</div>
                  )}
                </div>
                <div className={styles.sbDivider} />
                <div className={styles.sbCreditsBlock}>
                  <span className={styles.sbCreditsNum}>
                    {creditsSummary.status === 'loading' ? '...' : creditsSummary.status === 'error' ? '!' : creditsSummary.status === 'no_membership' ? '—' : resolvedCreditsBalance ?? 0}
                  </span>
                  <span className={styles.sbCreditsLabel}>{creditsSummary.label}</span>
                </div>
                {selectionError && <div style={{ color: '#b42318', fontSize: 13, marginBottom: 8 }}>{selectionError}</div>}
                <div className={styles.sbPolicy}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <span><strong>Política de cancelación:</strong> puedes cancelar hasta <strong>6 horas antes</strong> del inicio de la clase. Después de ese plazo tu crédito no será reembolsado aunque no asistas.</span>
                </div>
                <button className={styles.slowConfirmBtn} onClick={handleConfirmReservation} disabled={!selectedSpot || !activeHold?.holdId || isConfirming || remainingHoldMs <= 0}>
                  {isConfirming ? 'Confirmando…' : selectedSpot ? 'Confirmar reserva →' : 'Selecciona un lugar'}
                </button>
              </aside>
            </div>
          ) : (
            <div className={styles.strydeLayout}>
              <div className={styles.strydeSection}>
                <div className={styles.strydeRoom}>
                  <div className={styles.strydeWall}>
                    <div className={styles.strydeWallLine} />
                    <span className={styles.strydeWallLabel}>FRENTE</span>
                    <div className={styles.strydeWallLine} />
                  </div>

                  {renderRow(layoutConfig.sections[1])}

                  <div className={styles.strydeInstructorZone}>
                    <div className={styles.strydeZoneLine} />
                    <CoachBadge coachName={coachName} layoutKind="stryde" />
                    <div className={styles.strydeZoneLine} />
                  </div>

                  {renderRow(layoutConfig.sections[3])}
                  {renderRow(layoutConfig.sections[4])}
                </div>

                <div className={styles.strydeLegend}>{renderLegend}</div>
              </div>

              <aside className={styles.strydeSidebar}>
                <div className={styles.sbBlock}>
                  <div className={styles.sbTopRow}>
                    <span className={styles.strydeXBadge}>STRYDE X</span>
                    <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar"><X size={18} /></button>
                  </div>
                  <div className={styles.sbTitle}>{className}</div>
                  <div className={styles.sbCoach}>{coachName}</div>
                  <div className={styles.sbTime}>{classDateTime}</div>
                </div>
                <div className={styles.sbDivider} />
                <div className={styles.sbSelectionBlock}>
                  {selectedSpot ? (
                    <>
                      <div className={styles.sbSelLabel}>Tu equipo</div>
                      <div className={styles.sbSelMat} style={{ fontSize: 18 }}>{selectedSpotDisplay}</div>
                      <div className={styles.sbSelDetail}>
                        {activeHold?.expiresAt && holdCountdown
                          ? `Tienes ${holdCountdown} para confirmar tu lugar`
                          : 'Selecciona un equipo para continuar'}
                      </div>
                    </>
                  ) : (
                    <div className={styles.sbSelHint}>Elige tu equipo<br />en el mapa</div>
                  )}
                </div>
                <div className={styles.sbDivider} />
                <div className={styles.sbCreditsBlock}>
                  <span className={styles.sbCreditsNum}>
                    {creditsSummary.status === 'loading' ? '...' : creditsSummary.status === 'error' ? '!' : creditsSummary.status === 'no_membership' ? '—' : resolvedCreditsBalance ?? 0}
                  </span>
                  <span className={styles.sbCreditsLabel}>{creditsSummary.label}</span>
                </div>
                {selectionError && <div style={{ color: '#b42318', fontSize: 13, marginBottom: 8 }}>{selectionError}</div>}
                <div className={styles.sbPolicy}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <span><strong>Política de cancelación:</strong> puedes cancelar hasta <strong>6 horas antes</strong> del inicio de la clase. Después de ese plazo tu crédito no será reembolsado aunque no asistas.</span>
                </div>
                <button className={styles.strydeConfirmBtn} onClick={handleConfirmReservation} disabled={!selectedSpot || !activeHold?.holdId || isConfirming || remainingHoldMs <= 0}>
                  {isConfirming ? 'Confirmando…' : selectedSpot ? 'Confirmar reserva →' : 'Selecciona un lugar'}
                </button>
              </aside>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
