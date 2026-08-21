import { useState } from 'react'
import { ChevronDown, CreditCard, RotateCcw, Ticket } from 'lucide-react'
import { groupCreditMovements } from '@/utils/groupCreditMovements'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatDelta(value) {
  const amount = Number(value ?? 0)
  return `${amount > 0 ? '+' : ''}${amount}`
}

function isAmountHidden(movement) {
  return (movement?.displayAmountMode ?? movement?.display_amount_mode) === 'hidden'
}

function titleForMovement(movement) {
  if (movement.displayTitle) return movement.displayTitle
  if (movement.reason === 'reservation_cancel_refund' || movement.reason === 'occurrence_cancel_refund') return 'Crédito devuelto'
  return movement.reason ?? movement.type ?? 'Movimiento de crédito'
}

function descriptionForMovement(movement) {
  if (movement.displayDescription) return movement.displayDescription
  return [
    movement.className,
    movement.coachName ? `con ${movement.coachName}` : null,
    movement.spotNumber ? `Lugar ${movement.spotNumber}` : null,
  ].filter(Boolean).join(' · ')
}

function GroupIcon({ group, hasClass }) {
  const hasRefund = group.refundedCredits > 0
  const Icon = hasRefund ? RotateCcw : hasClass ? Ticket : CreditCard
  const color = hasRefund ? '#4ade80' : group.netCredits < 0 ? '#f87171' : '#d7a7ad'
  return (
    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', color, background: `${color}18` }}>
      <Icon size={16} aria-hidden="true" />
    </div>
  )
}

export default function CreditMovementsGroupedList({ movements, variant = 'client', admin = false }) {
  const [openGroups, setOpenGroups] = useState({})
  const groups = groupCreditMovements(movements)
  const showTechnicalDetails = admin || variant === 'admin'

  return (
    <div style={{ display: 'grid' }}>
      {groups.map((group, index) => {
        const isOpen = Boolean(openGroups[group.key])
        const hasClass = Boolean(group.className)
        const spotsLabel = group.spots.length > 1
          ? `${group.spots.length} lugares: ${group.spots.join(', ')}`
          : group.spots.length === 1
            ? `Lugar ${group.spots[0]}`
            : null
        const statusText = group.usedCredits < 0 && group.refundedCredits > 0 && group.netCredits === 0
          ? 'Crédito usado y devuelto'
          : hasClass && group.usedCredits < 0
            ? 'Cada lugar consume 1 crédito'
            : descriptionForMovement(group.movements[0])
        const visibleMovements = group.movements.filter((movement) => !isAmountHidden(movement))
        const visibleNetCredits = visibleMovements.reduce(
          (sum, movement) => sum + Number(movement.delta ?? movement.amount ?? 0),
          0
        )
        const title = hasClass
          ? `${group.className}${group.coachName ? ` con ${group.coachName}` : ''}`
          : titleForMovement(group.movements[0])
        const subtitle = [
          formatDate(group.classStartAt ?? group.classDate ?? group.movements[0]?.createdAt),
          spotsLabel,
        ].filter(Boolean).join(' · ')

        return (
          <div key={group.key} style={{ borderBottom: index < groups.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <button
              type="button"
              onClick={() => setOpenGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 2px', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              aria-expanded={isOpen}
            >
              <GroupIcon group={group} hasClass={hasClass} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: 650 }}>{title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
                {statusText && <div style={{ color: group.netCredits === 0 ? '#d7a7ad' : 'var(--muted)', fontSize: 11, marginTop: 3 }}>{statusText}</div>}
              </div>
              {visibleMovements.length > 0 && (
                <div style={{ color: visibleNetCredits < 0 ? '#f87171' : visibleNetCredits > 0 ? '#4ade80' : 'var(--muted)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Total {formatDelta(visibleNetCredits)}
                </div>
              )}
              <ChevronDown size={17} aria-hidden="true" style={{ color: 'var(--muted)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }} />
            </button>
            {isOpen && (
              <div style={{ marginLeft: 42, padding: '0 0 8px', display: 'grid', gap: 5 }}>
                {group.movements.map((movement) => {
                  const delta = Number(movement.delta ?? movement.amount ?? 0)
                  return (
                    <div key={`movement-${movement.movementId ?? movement.id}-${movement.reservationId ?? ''}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: 600 }}>
                          {movement.spotNumber ? `Lugar ${movement.spotNumber} · ` : ''}{titleForMovement(movement)}
                        </div>
                        {movement.reservationStatus && <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>Reserva {movement.reservationStatus}</div>}
                        {showTechnicalDetails && <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>Reserva #{movement.reservationId ?? '—'} · Movimiento #{movement.movementId ?? movement.id ?? '—'} · {movement.reason ?? '—'}</div>}
                      </div>
                      {!isAmountHidden(movement) && <div style={{ color: delta < 0 ? '#f87171' : delta > 0 ? '#4ade80' : 'var(--muted)', fontSize: 12, fontWeight: 700 }}>{formatDelta(delta)}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
