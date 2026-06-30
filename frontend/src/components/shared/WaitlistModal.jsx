import { useUsuariosStore } from '@/stores/usuariosStore'
import { useWaitlistByOccurrenceQuery } from '@/hooks/useApiQueries'

const COLORS = {
  card: '#2C1A1E',
  border: '#3C2A2E',
  textPrimary: '#E8E2DB',
  textMuted: '#A69A93',
}

const STATUS_LABELS = {
  esperando: 'Esperando',
  notificado: 'Notificado',
  expirado: 'Expiró',
  asignado: 'Asignado',
  cancelado: 'Cancelado',
}

const STATUS_STYLES = {
  esperando: { background: 'rgba(245,158,11,0.18)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.35)' },
  notificado: { background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.35)' },
  expirado: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' },
  asignado: { background: 'rgba(34,197,94,0.18)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' },
  cancelado: { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
}

function formatJoinedAt(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function WaitlistModal({ occurrenceId, claseNombre, dayLabel, onClose, resolveUserName }) {
  const usuarios = useUsuariosStore((store) => store.usuarios)

  const fallbackResolveName = (userId) => {
    const u = usuarios.find((usr) => Number(usr.id) === Number(userId))
    return u?.nombre ?? u?.name ?? `Usuario #${userId}`
  }
  const getName = (entry) => entry.userName || (resolveUserName ?? fallbackResolveName)(entry.userId)

  const waitlistQuery = useWaitlistByOccurrenceQuery(occurrenceId, {
    enabled: Boolean(occurrenceId),
    refetchInterval: occurrenceId ? 5000 : false,
  })

  const allEntries = waitlistQuery.data?.entries ?? []
  const entries = allEntries
    .filter((e) => e.status === 'esperando' || e.status === 'notificado')
    .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))

  const errorMessage = waitlistQuery.error
    ? (waitlistQuery.error?.status === 403
      ? 'No tienes permisos para ver la lista de espera de esta clase.'
      : waitlistQuery.error?.status === 404
        ? 'Ocurrencia no encontrada.'
        : waitlistQuery.error?.status === 401
          ? 'Sesión expirada o no autenticado.'
          : (waitlistQuery.error?.message ?? 'No se pudo cargar la lista de espera.'))
    : ''

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 14, width: '92vw', maxWidth: 480, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: 'var(--font-body, sans-serif)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '16px 18px', borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
                boxShadow: '0 0 0 0 rgba(245,158,11,0.6)',
                animation: 'waitlistPulse 1.6s ease-out infinite',
              }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
                Lista de espera
              </span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
              {claseNombre}{dayLabel ? ` · ${dayLabel}` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'transparent', color: COLORS.textMuted,
              fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 2,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '8px 0', flex: 1 }}>
          {waitlistQuery.isLoading ? (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 13, padding: '24px 16px' }}>
              Cargando lista de espera...
            </p>
          ) : errorMessage ? (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 13, padding: '24px 16px' }}>
              {errorMessage}
            </p>
          ) : entries.length === 0 ? (
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 13, padding: '24px 16px' }}>
              Nadie en lista de espera por ahora.
            </p>
          ) : (
            entries.map((entry) => {
              const statusStyle = STATUS_STYLES[entry.status] ?? STATUS_STYLES.waiting
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px', borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(245,158,11,0.18)', color: '#FBBF24',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {entry.posicion ?? '—'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      {getName(entry)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      Se unió: {formatJoinedAt(entry.fechaIngreso) || '—'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    whiteSpace: 'nowrap', ...statusStyle,
                  }}>
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderTop: `1px solid ${COLORS.border}`,
        }}>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>
            {entries.length} en espera · se actualiza automáticamente
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
              background: 'rgba(255,255,255,0.04)', color: COLORS.textPrimary, cursor: 'pointer', fontSize: 13,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes waitlistPulse {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
          70% { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
      `}</style>
    </div>
  )
}
