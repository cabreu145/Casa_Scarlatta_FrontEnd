import { formatHour } from '@/utils/formatters'
import { getClassTimeToken } from '@/utils/classSchedule'
import { normalizeDiscipline } from '@/utils/discipline'
import { useConfiguracionStore } from '@/stores/configuracionStore'
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
  const normalized = normalizeDiscipline(d)
  if (normalized === 'stryde') return <span className={`${s.pill} ${s.pillStride}`}>STRYDE</span>
  if (normalized === 'slow') return <span className={`${s.pill} ${s.pillSlow}`}>SLOW</span>
  return <span className={s.pill}>Sin tipo</span>
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

export default function MisClasesCard({ cls, dayIsoDate, onCancel, coachFoto }) {
  const initials = cls.coach.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const { bg, text } = avatarStyle(cls.coach)
  const timeToken = getClassTimeToken({
    time: cls?.time ?? null,
    displayTime: cls?.displayTime ?? null,
    startTime: cls?.startTime ?? null,
    classStartTime: cls?.classStartTime ?? null,
  })
  return (
    <div className={s.mcCard}>
      <div className={s.mcAvatarCol}>
        <div className={s.mcAvatar} style={{ background: coachFoto ? 'transparent' : bg, overflow: 'hidden', padding: 0 }}>
          {coachFoto ? (
            <img src={coachFoto} alt={cls.coach} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
          ) : (
            <span style={{ color: text }}>{initials}</span>
          )}
        </div>
      </div>
      <div className={s.mcTimeCol}>
        <div className={s.mcTimeVal}>{formatHour(timeToken ?? cls.time ?? cls.displayTime ?? cls.startTime ?? cls.classStartTime)}</div>
        <div className={s.mcTimeSub}>50 min</div>
      </div>
      <div className={s.mcBody}>
        <div className={s.mcTitle}>{cls.title}</div>
        <div className={s.mcMeta}>{cls.coach} · {cls.location || 'Sala Principal'}</div>
        <div style={{ marginTop: 6 }}><DisciplinePill d={cls.discipline} /></div>
      </div>
      <div className={s.mcActions}>
        {(() => {
          if (cls.status !== 'confirmada') return <StatusPill status={cls.status} />
          const fechaRef = dayIsoDate ?? cls.claseFecha
          if (!fechaRef || !timeToken) return <StatusPill status="confirmada" />
          const classTime = new Date(fechaRef + 'T' + timeToken + ':00')
          const n = new Date()
          if (classTime <= n) {
            return (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                Clase finalizada
              </span>
            )
          }
          // Límite de cancelación configurable desde el panel admin
          // [BACKEND] → GET /api/configuracion → horasCancelacion
          const horasCancelacion = useConfiguracionStore.getState().get('horasCancelacion')
          const canCancel = (classTime - n) > horasCancelacion * 60 * 60 * 1000
          return (
            <>
              <StatusPill status="confirmada" />
              {canCancel
                ? <button className={s.btnCancelSm} onClick={onCancel}>Cancelar</button>
                : <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7, textAlign: 'center' }}>Sin cancelación disponible</span>
              }
            </>
          )
        })()}
      </div>
    </div>
  )
}
