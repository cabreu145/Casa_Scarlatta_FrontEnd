import { CheckCircle, X } from 'lucide-react'
import {
  BenchIcon,
  BenchMini,
  TreadMini,
  TreadmillIcon,
  YogaMatIcon,
  buildStrydeLayout,
  getRotationBlocks,
} from '@/features/clases/SeatSelector'
import styles from '@/features/clases/SeatSelector.module.css'
import {
  getEquipmentSpotKey,
  getEquipmentSpotLabel,
  getEquipmentSpotStatusLabel,
} from './equipmentLayoutConfig'

function getVisualState(spot, selectedSpotId) {
  if (!spot) return 'occupied'
  const spotId = Number(spot.spotId)
  const activeSelectedSpotId = selectedSpotId == null ? null : Number(selectedSpotId)

  if (activeSelectedSpotId != null && spotId === activeSelectedSpotId) {
    return 'selected'
  }
  if (activeSelectedSpotId != null && (spot.heldByMe || spot.status === 'held_by_me')) {
    return 'available'
  }
  if (spot.heldByMe || spot.status === 'held_by_me') return 'selected'
  if (spot.status === 'held' || spot.status === 'reserved' || spot.status === 'inactive') {
    return 'occupied'
  }
  return 'available'
}

function isSpotDisabled(spot, busy) {
  if (!spot || busy) return true
  return spot.status === 'held' || spot.status === 'reserved' || spot.status === 'inactive'
}

function buildSpotLookup(spots) {
  return new Map((spots ?? []).map((spot) => [getEquipmentSpotKey(spot), spot]))
}

function getSpot(lookup, equipmentType, label) {
  return lookup.get(`${equipmentType}:${String(label).padStart(2, '0')}`) ?? null
}

function SpotStatusDot({ slow, state }) {
  const colorClass = state === 'selected'
    ? slow ? styles.indWine : styles.strydeWine
    : state === 'available'
      ? slow ? styles.indGreen : styles.strydeGreen
      : slow ? styles.indGray : styles.strydeGray

  return (
    <span
      className={`${slow ? styles.statusIndicator : styles.strydeStatusDot} ${colorClass}`}
    />
  )
}

function SlowMatButton({ spot, selectedSpotId, busy, onSelect }) {
  const state = getVisualState(spot, selectedSpotId)
  const label = spot?.label ?? '--'
  const statusLabel = spot ? getEquipmentSpotStatusLabel(spot) : 'No disponible'

  return (
    <button
      type="button"
      className={[
        styles.machineCard,
        state === 'occupied' ? styles.cardOccupied : styles.cardAvailable,
        state === 'selected' ? styles.cardSelected : '',
      ].filter(Boolean).join(' ')}
      onClick={() => spot && onSelect(spot)}
      disabled={isSpotDisabled(spot, busy)}
      aria-label={`Tapete ${label} · ${statusLabel}`}
      aria-pressed={state === 'selected'}
      data-spot-key={spot ? getEquipmentSpotKey(spot) : `mat:${label}`}
    >
      <SpotStatusDot slow state={state} />
      <div className={styles.matIconWrap}><YogaMatIcon state={state} /></div>
      <span className={styles.machineNumber}>{label}</span>
    </button>
  )
}

function StrydeSpotButton({ visualEquipment, spot, selectedSpotId, busy, onSelect }) {
  const state = getVisualState(spot, selectedSpotId)
  const isBench = visualEquipment.type === 'bench'
  const statusLabel = spot ? getEquipmentSpotStatusLabel(spot) : 'No disponible'

  return (
    <button
      type="button"
      className={[
        styles.strydeCard,
        isBench ? styles.strydeCardBench : styles.strydeCardTread,
        state === 'occupied' ? styles.strydeOccupied : styles.strydeAvail,
        state === 'selected' ? styles.strydeSelected : '',
        visualEquipment.mode === 'rotation' ? styles.strydeCardRot : styles.strydeCardStatic,
      ].filter(Boolean).join(' ')}
      onClick={() => spot && onSelect(spot)}
      disabled={isSpotDisabled(spot, busy)}
      aria-label={`${visualEquipment.label} ${visualEquipment.num} · ${statusLabel}`}
      aria-pressed={state === 'selected'}
      data-spot-key={spot ? getEquipmentSpotKey(spot) : `${visualEquipment.type}:${visualEquipment.num}`}
    >
      <SpotStatusDot state={state} />
      <div className={isBench ? styles.benchIconWrap : styles.treadIconWrap}>
        {isBench ? <BenchIcon state={state} /> : <TreadmillIcon state={state} />}
      </div>
      <span className={styles.strydeEquipNum}>{visualEquipment.num}</span>
      {visualEquipment.mode === 'rotation' ? (
        <div className={styles.modeTagRot}>
          <BenchMini active={false} />
          <span className={styles.modeTagArrow}>⇆</span>
          <TreadMini active={false} />
        </div>
      ) : (
        <div className={styles.modeTagStatic}><BenchMini active={false} /></div>
      )}
      <span className={styles.cardTooltip}>
        {visualEquipment.mode === 'rotation' ? 'Bench & Treadmill' : 'Bench Only'}
      </span>
    </button>
  )
}

function CoachBadge({ coachName, dark = false }) {
  const initials = String(coachName ?? 'Coach')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={dark ? styles.instructorBadge : styles.slowInstructorBadge}>
      <div className={dark ? styles.instructorAvatar : styles.slowInstructorAvatar}>{initials}</div>
      <span className={dark ? styles.instructorName : styles.slowInstructorName}>{coachName ?? 'Coach'}</span>
      <span className={dark ? styles.instructorTitle : styles.slowInstructorTitle}>COACH</span>
    </div>
  )
}

function CreditsBlock({ creditsSummary, creditsBalance }) {
  const value = creditsSummary.status === 'loading'
    ? '...'
    : creditsSummary.status === 'error'
      ? '!'
      : creditsSummary.status === 'no_membership'
        ? '-'
        : creditsBalance ?? 0

  return (
    <div className={styles.sbCreditsBlock}>
      <span className={styles.sbCreditsNum}>{value}</span>
      <span className={styles.sbCreditsLabel}>{creditsSummary.label}</span>
    </div>
  )
}

function Policy() {
  return (
    <div className={styles.sbPolicy}>
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      <span><strong>Política de cancelación:</strong> puedes cancelar hasta <strong>6 horas antes</strong> del inicio de la clase. Después de ese plazo tu crédito no será reembolsado aunque no asistas.</span>
    </div>
  )
}

function Legend({ slow }) {
  const entries = [
    { className: slow ? styles.indGreen : styles.strydeGreen, label: 'Disponible' },
    { className: slow ? styles.indGray : styles.strydeGray, label: 'Ocupado' },
    { className: slow ? styles.indWine : styles.strydeWine, label: 'Tu lugar' },
  ]

  return entries.map(({ className, label }) => (
    <span key={label} className={styles.legendItem}>
      <span className={`${slow ? styles.statusIndicator : styles.strydeStatusDot} ${className}`} style={{ position: 'static', width: 8, height: 8 }} />
      {label}
    </span>
  ))
}

function SuccessView({ slow, className, classDateTime, coachName, successSpotLabel, onClose }) {
  return (
    <div className={styles.successView}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: 14, right: 14 }}>
        <X size={20} />
      </button>
      <CheckCircle size={52} strokeWidth={1.5} className={styles.successIcon} />
      <h2 className={styles.successTitle}>Reserva confirmada</h2>
      <p className={styles.successSub}>
        <strong>{className}</strong><br />
        {classDateTime} · Coach: {coachName}
      </p>
      <p className={styles.successSeat}>{successSpotLabel}</p>
      <p className={styles.successCredits}>Tus créditos y reservas se actualizaron correctamente.</p>
      <button className={slow ? styles.slowConfirmBtn : styles.strydeConfirmBtn} onClick={onClose}>Cerrar</button>
    </div>
  )
}

export default function EquipmentSeatSelectorView({
  discipline,
  spots,
  className,
  coachName,
  classDateTime,
  selectedSpotId,
  activeHold,
  holdCountdown,
  creditsSummary,
  creditsBalance,
  selectionError,
  isBusy,
  isConfirming,
  reservationSuccess,
  successSpotLabel,
  onSelectSpot,
  onConfirm,
  onClose,
}) {
  const slow = discipline === 'slow'
  const lookup = buildSpotLookup(spots)
  const backendSelectedSpot = (spots ?? []).find((spot) => spot.heldByMe || spot.status === 'held_by_me')
  const effectiveSelectedSpotId = selectedSpotId ?? backendSelectedSpot?.spotId ?? null
  const selectedSpot = (spots ?? []).find((spot) => Number(spot.spotId) === Number(effectiveSelectedSpotId)) ?? null

  if (reservationSuccess) {
    return (
      <div className={styles.backdrop} onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className={slow ? styles.slowModal : styles.strydeModal} role="dialog" aria-modal="true" aria-label="Reserva confirmada">
          <SuccessView
            slow={slow}
            className={className}
            classDateTime={classDateTime}
            coachName={coachName}
            successSpotLabel={successSpotLabel}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (slow) {
    const topRow = ['01', '02', '03', '04', '05']
    const bottomRow = ['06', '07', '08', '09', '10']
    return (
      <div className={styles.backdrop} onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className={styles.slowModal} role="dialog" aria-modal="true" aria-label="Seleccionar lugar">
          <div className={styles.fitnessLayout}>
            <div className={styles.machineSection}>
              <div className={styles.slowMirrors}>
                {Array.from({ length: 5 }, (_, index) => <div key={index} className={styles.slowMirrorArch} />)}
              </div>
              <div className={styles.frenteBanner}>
                <div className={styles.frenteLine} />
                <span className={styles.frenteLabel}>FRENTE</span>
                <div className={styles.frenteLine} />
              </div>
              <div className={styles.machineGrid} style={{ '--cols': 5 }} role="group" aria-label="Fila frontal">
                {topRow.map((label) => (
                  <SlowMatButton
                    key={`mat:${label}`}
                    spot={getSpot(lookup, 'mat', label)}
                    selectedSpotId={effectiveSelectedSpotId}
                    busy={isBusy}
                    onSelect={onSelectSpot}
                  />
                ))}
              </div>
              <CoachBadge coachName={coachName} />
              <div className={styles.machineGrid} style={{ '--cols': 5 }} role="group" aria-label="Fila trasera">
                {bottomRow.map((label) => (
                  <SlowMatButton
                    key={`mat:${label}`}
                    spot={getSpot(lookup, 'mat', label)}
                    selectedSpotId={effectiveSelectedSpotId}
                    busy={isBusy}
                    onSelect={onSelectSpot}
                  />
                ))}
              </div>
              <div className={styles.fitnessLegend}><Legend slow /></div>
            </div>
            <aside className={styles.reservationSidebar}>
              <div className={styles.sbBlock}>
                <div className={styles.sbTopRow}>
                  <span className={styles.sbSlowBadge}>SLOW</span>
                  <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className={styles.sbTitle}>{className}</div>
                <div className={styles.sbCoach}>Coach {coachName}</div>
                <div className={styles.sbTime}>{classDateTime}</div>
              </div>
              <div className={styles.sbDivider} />
              <div className={styles.sbSelectionBlock}>
                {selectedSpot ? (
                  <>
                    <div className={styles.sbSelLabel}>Tu lugar elegido</div>
                    <div className={styles.sbSelMat}>{getEquipmentSpotLabel(selectedSpot)}</div>
                    <div className={styles.sbSelDetail}>
                      {activeHold?.expiresAt && holdCountdown ? `Tienes ${holdCountdown} para confirmar tu lugar` : 'Preparando bloqueo temporal'}
                    </div>
                  </>
                ) : <div className={styles.sbSelHint}>Elige tu lugar<br />en el mapa</div>}
              </div>
              <div className={styles.sbDivider} />
              <CreditsBlock creditsSummary={creditsSummary} creditsBalance={creditsBalance} />
              {selectionError ? <div style={{ color: '#b42318', fontSize: 13, marginBottom: 8 }}>{selectionError}</div> : null}
              <Policy />
              <button className={styles.slowConfirmBtn} onClick={onConfirm} disabled={!selectedSpot || !activeHold?.holdId || isConfirming}>
                {isConfirming ? 'Confirmando...' : selectedSpot ? 'Confirmar reserva →' : 'Selecciona un lugar'}
              </button>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  const strydeLayout = buildStrydeLayout()
  const benchRows = strydeLayout.filter((row) => row.rowType === 'bench')
  const treadRows = strydeLayout.filter((row) => row.rowType === 'treadmill')
  const selectedEquipment = strydeLayout
    .flatMap((row) => row.equipment)
    .find((equipment) => {
      const spot = getSpot(lookup, equipment.type, equipment.num)
      return Number(spot?.spotId) === Number(effectiveSelectedSpotId)
    }) ?? null

  const renderStrydeRow = (row, classNameOverride) => (
    <div key={row.ariaLabel} className={classNameOverride} role="group" aria-label={row.ariaLabel}>
      {row.equipment.map((equipment) => (
        <StrydeSpotButton
          key={`${equipment.type}:${equipment.num}`}
          visualEquipment={equipment}
          spot={getSpot(lookup, equipment.type, equipment.num)}
          selectedSpotId={effectiveSelectedSpotId}
          busy={isBusy}
          onSelect={onSelectSpot}
        />
      ))}
    </div>
  )

  return (
    <div className={styles.backdrop} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={styles.strydeModal} role="dialog" aria-modal="true" aria-label="Seleccionar equipo">
        <div className={styles.strydeLayout}>
          <div className={styles.strydeSection}>
            <div className={styles.strydeRoom}>
              <div className={styles.strydeWall}>
                <div className={styles.strydeWallLine} />
                <span className={styles.strydeWallLabel}>FRENTE</span>
                <div className={styles.strydeWallLine} />
              </div>
              {benchRows[0] ? renderStrydeRow(benchRows[0], styles.strydeBenchRow) : null}
              <div className={styles.strydeInstructorZone}>
                <div className={styles.strydeZoneLine} />
                <CoachBadge coachName={coachName} dark />
                <div className={styles.strydeZoneLine} />
              </div>
              {benchRows[1] ? renderStrydeRow(benchRows[1], styles.strydeBenchRowFront) : null}
              {treadRows.map((row) => renderStrydeRow(row, styles.strydeTreadRow))}
            </div>
            <div className={styles.strydeLegend}><Legend /></div>
          </div>
          <aside className={styles.strydeSidebar}>
            <div className={styles.sbBlock}>
              <div className={styles.sbTopRow}>
                <span className={styles.strydeXBadge}>STRYDE X</span>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
              </div>
              <div className={styles.sbTitle}>{className}</div>
              <div className={styles.sbCoach}>Coach {coachName}</div>
              <div className={styles.sbTime}>{classDateTime}</div>
            </div>
            <div className={styles.sbDivider} />
            <div className={styles.sbSelectionBlock}>
              {selectedSpot && selectedEquipment ? (
                <>
                  <div className={styles.sbSelLabel}>Tu equipo</div>
                  <div className={styles.sbSelMat} style={{ fontSize: 18 }}>{getEquipmentSpotLabel(selectedSpot)}</div>
                  {selectedEquipment.mode === 'rotation' ? (
                    <div className={styles.rotationFlow}>
                      <p className={styles.rfTitle}>ROTATION FLOW</p>
                      <div className={styles.rfTimeline}>
                        {getRotationBlocks(selectedEquipment.type).map((type, index) => (
                          <div key={`${type}-${index}`} className={styles.rfStep}>
                            <div className={styles.rfIconBlock}>
                              <div className={styles.rfIcon}>{type === 'bench' ? <BenchMini active /> : <TreadMini active />}</div>
                              <span className={styles.rfBlock}>B{index + 1}</span>
                            </div>
                            {index < 3 ? <span className={styles.rfArrow}>›</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.benchOnlyFlow}>
                      <BenchMini active />
                      <div>
                        <p className={styles.bofTitle}>Bench Only</p>
                        <p className={styles.bofSub}>No rota · Toda la clase</p>
                      </div>
                    </div>
                  )}
                  <div className={styles.sbSelDetail}>
                    {activeHold?.expiresAt && holdCountdown ? `Tienes ${holdCountdown} para confirmar tu lugar` : 'Preparando bloqueo temporal'}
                  </div>
                </>
              ) : <div className={styles.sbSelHint}>Elige tu equipo<br />en el mapa</div>}
            </div>
            <div className={styles.sbDivider} />
            <CreditsBlock creditsSummary={creditsSummary} creditsBalance={creditsBalance} />
            {selectionError ? <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 8 }}>{selectionError}</div> : null}
            <Policy />
            <button className={styles.strydeConfirmBtn} onClick={onConfirm} disabled={!selectedSpot || !activeHold?.holdId || isConfirming}>
              {isConfirming ? 'Confirmando...' : selectedSpot ? 'Confirmar reserva →' : 'Selecciona un lugar'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
