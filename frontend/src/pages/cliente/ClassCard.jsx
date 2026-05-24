import { formatHour } from '@/utils/formatters'
import s from './ClientPanel.module.css'

const AVATAR_COLORS = [
  { bg: 'var(--brand-wine-13)',  text: '#7B1E2B' },
  { bg: 'rgba(194,107,122,0.18)', text: '#b05060' },
  { bg: 'rgba(154,123,107,0.18)', text: '#7A6560' },
  { bg: 'rgba(92,16,24,0.13)',   text: '#5C1018'  },
]

function avatarStyle(name) {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function DisciplinePill({ d }) {
  return d === 'STRYDE'
    ? <span className={`${s.pill} ${s.pillStride}`}>STRYDE</span>
    : <span className={`${s.pill} ${s.pillSlow}`}>SLOW</span>
}

function StatusPill({ status }) {
  const map = {
    confirmada: s.statusConfirmada,
    cancelada:  s.statusCancelada,
    pendiente:  s.statusPendiente,
    no_asistio: s.statusCancelada,
    completada: s.statusConfirmada,
  }
  const labels = {
    confirmada: 'Confirmada',
    cancelada:  'Cancelada',
    pendiente:  'Pendiente',
    no_asistio: 'No asistió',
    completada: 'Completada',
  }
  return <span className={`${s.statusPill} ${map[status] ?? ''}`}>{labels[status] ?? status}</span>
}

export default function ClassCard({ cls, showCancel, onCancel, coachFoto }) {
  const initials  = cls.coach.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const { bg, text } = avatarStyle(cls.coach)
  return (
    <div className={s.classCard}>
      <div className={s.classDateBlock}>
        <div className={s.classDateDay}>{cls.date.slice(0, 3)}</div>
        <div className={s.classDateTime}>{cls.time}</div>
      </div>
      <div className={s.classInfo}>
        <div className={s.classTitle}>{cls.title}</div>
        <div className={s.classCoach} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: coachFoto ? 'transparent' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: text }}>
            {coachFoto
              ? <img src={coachFoto} alt={cls.coach} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
              : initials}
          </div>
          {cls.coach}{cls.location ? ` · ${cls.location}` : ''}
        </div>
        <div style={{ marginTop: 5 }}><DisciplinePill d={cls.discipline} /></div>
      </div>
      <div className={s.classRight}>
        {(() => {
          if (cls.status !== 'confirmada') return <StatusPill status={cls.status} />
          if (cls.claseFecha && cls.time) {
            const classTime = new Date(cls.claseFecha + 'T' + cls.time + ':00')
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
