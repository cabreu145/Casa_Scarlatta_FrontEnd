import { formatHour } from '@/utils/formatters'
import { formatClassDate, getClassDisplayDate, getClassTimeToken } from '@/utils/classSchedule'

import { normalizeDiscipline } from '@/utils/discipline'
import CoachAvatar from '@/components/common/CoachAvatar'
import s from './ClientPanel.module.css'

function DisciplinePill({ d }) {
  const normalized = normalizeDiscipline(d)
  if (normalized === 'stryde') return <span className={`${s.pill} ${s.pillStride}`}>STRYDE</span>
  if (normalized === 'slow') return <span className={`${s.pill} ${s.pillSlow}`}>SLOW</span>
  return <span className={s.pill}>Sin tipo</span>
}

function StatusPill({ status }) {
  const map = {
    confirmada: s.statusConfirmada,
    cancelada: s.statusCancelada,
    pendiente: s.statusPendiente,
    no_asistio: s.statusCancelada,
    completada: s.statusConfirmada,
  }
  const labels = {
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    pendiente: 'Pendiente',
    no_asistio: 'No asistio',
    completada: 'Completada',
  }
  return <span className={`${s.statusPill} ${map[status] ?? ''}`}>{labels[status] ?? status}</span>
}

export default function ClassCard({ cls, showCancel, onCancel, coachFoto }) {
  const coachName = cls?.coach ?? 'Por definir'
  const resolvedCoachFoto = coachFoto ?? cls?.coachAvatarUrl ?? cls?.avatarUrl ?? null
  const title = cls?.title ?? 'Clase'
  const dateLabel = cls?.displayDate ?? formatClassDate(getClassDisplayDate({
    classDate: cls?.classDate ?? cls?.claseFecha ?? null,
    occurrenceDate: cls?.occurrenceDate ?? null,
    classStartAt: cls?.classStartAt ?? null,
    startAt: cls?.startAt ?? null,
    fecha: cls?.date ?? null,
  }))
  const timeToken = getClassTimeToken({
    time: cls?.time ?? null,
    displayTime: cls?.displayTime ?? null,
    startTime: cls?.startTime ?? null,
    classStartTime: cls?.classStartTime ?? null,
  })
  const timeLabel = formatHour(timeToken ?? cls?.time ?? cls?.displayTime ?? cls?.startTime ?? cls?.classStartTime)
  const discipline = cls?.discipline ?? cls?.tipo ?? 'Sin tipo'
  const status = cls?.status ?? 'pendiente'
  const location = cls?.location ?? ''

  return (
    <div className={s.classCard}>
      <div className={s.classDateBlock}>
        <div className={s.classDateDay}>{dateLabel}</div>
        <div className={s.classDateTime}>{timeLabel}</div>
      </div>
      <div className={s.classInfo}>
        <div className={s.classTitle}>{title}</div>
        <div className={s.classCoach} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CoachAvatar name={coachName} avatarUrl={resolvedCoachFoto} size={22} />
          {coachName}{location ? ` · ${location}` : ''}
        </div>
        <div style={{ marginTop: 5 }}><DisciplinePill d={discipline} /></div>
      </div>
      <div className={s.classRight}>
        {(() => {
          if (status !== 'confirmada') return <StatusPill status={status} />
          const sessionDate = cls?.claseFecha ?? cls?.classDate ?? null
          if (sessionDate && timeToken) {
            const classTime = new Date(`${sessionDate}T${timeToken}:00`)
            if (classTime <= new Date()) {
              return (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                  Clase finalizada
                </span>
              )
            }
          }
          return (
            <>
              <StatusPill status="confirmada" />
              {showCancel && <button className={s.btnCancelSm} onClick={onCancel}>Cancelar</button>}
            </>
          )
        })()}
      </div>
    </div>
  )
}
