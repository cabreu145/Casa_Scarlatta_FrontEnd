import { useMemo, useState } from 'react'
import DateNavigator from '@/components/ui/DateNavigator'
import PaginationControls from '@/components/ui/PaginationControls'
import { useActividadStore, TIPO_LABELS, TIPO_ICONOS } from '@/stores/actividadStore'
import { useActivityQuery } from '@/hooks/useApiQueries'
import styles from '../AdminPanel.module.css'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'reservas', label: 'Reservas' },
  { value: 'cancelaciones', label: 'Cancelaciones' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'paquetes', label: 'Paquetes' },
  { value: 'ventas_pos', label: 'Ventas POS' },
  { value: 'cortes', label: 'Cortes' },
  { value: 'clases', label: 'Clases' },
  { value: 'coaches', label: 'Coaches' },
  { value: 'sesiones_cliente', label: 'Sesiones cliente' },
  { value: 'lista_espera', label: 'Lista espera' },
]

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.filter((item) => item.value).map((item) => [item.value, item.label]))
const CATEGORY_ICONS = {
  reservas: '📅',
  cancelaciones: '✖',
  usuarios: '👤',
  paquetes: '🎁',
  ventas_pos: '🧾',
  cortes: '✂',
  clases: '🏋',
  coaches: '🧑‍🏫',
  sesiones_cliente: '⏱',
  lista_espera: '⌛',
  sistema: '⚙',
}

function todayLocalDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Merida' }).format(new Date())
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function friendlyError(error) {
  const response = error?.response?.data
  return String(response?.detail || response?.message || error?.message || 'No se pudo cargar actividad').trim()
}

function formatEntityLabel(item) {
  if (!item?.entityType && item?.entityId == null) return ''
  const type = item.entityType ? String(item.entityType).replaceAll('_', ' ') : 'entidad'
  return item.entityId == null ? type : `${type} #${item.entityId}`
}

function formatMetadataValue(value) {
  if (value == null) return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return Object.entries(value).slice(0, 3).map(([key, val]) => `${key}: ${formatMetadataValue(val)}`).join(' · ')
  return String(value)
}

function metadataPreview(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return []
  return Object.entries(metadata)
    .filter(([, value]) => value != null && value !== '')
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${formatMetadataValue(value)}`)
}

function getDateRange(filter) {
  const today = todayLocalDate()
  const current = new Date(`${today}T00:00:00`)

  switch (filter?.tipo) {
    case 'hoy':
      return { from: today, to: today }
    case 'semana': {
      const start = new Date(current)
      start.setDate(start.getDate() - 6)
      return {
        from: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Merida' }).format(start),
        to: today,
      }
    }
    case 'mes': {
      const start = new Date(current)
      start.setDate(1)
      const end = new Date(current)
      end.setMonth(end.getMonth() + 1, 0)
      return {
        from: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Merida' }).format(start),
        to: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Merida' }).format(end),
      }
    }
    case 'fecha':
      return filter.fecha ? { from: filter.fecha, to: filter.fecha } : {}
    case 'rango':
      if (filter.fechaDesde && filter.fechaHasta) return { from: filter.fechaDesde, to: filter.fechaHasta }
      return {}
    case 'todos':
    default:
      return {}
  }
}

function LegacyActividadView() {
  const { eventos, limpiarEventos } = useActividadStore()
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [rangoFecha, setRangoFecha] = useState({ tipo: 'hoy' })
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false)
  const [expandido, setExpandido] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]
  const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const mes = hoy.slice(0, 7)

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
      if (rangoFecha.tipo === 'hoy' && e.fecha !== hoy) return false
      if (rangoFecha.tipo === 'semana' && e.fecha < semana) return false
      if (rangoFecha.tipo === 'mes' && e.fecha.slice(0, 7) !== mes) return false
      if (rangoFecha.tipo === 'fecha' && e.fecha !== rangoFecha.fecha) return false
      return true
    })
  }, [eventos, filtroTipo, rangoFecha, hoy, semana, mes])

  const eventosVisibles = expandido ? eventosFiltrados : eventosFiltrados.slice(0, DEFAULT_PAGE_SIZE)
  const hayMasEventos = eventosFiltrados.length > DEFAULT_PAGE_SIZE

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
            {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} encontrado{eventosFiltrados.length !== 1 ? 's' : ''}
            {eventos.length > 0 && ` · ${eventos.length} en total`}
          </div>
        </div>
        {eventos.length > 0 && (
          confirmarLimpiar ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                ¿Limpiar todo el historial?
              </span>
              <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: 12, padding: '5px 12px', color: '#ef4444' }} onClick={() => { limpiarEventos(); setConfirmarLimpiar(false) }}>Confirmar</button>
              <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setConfirmarLimpiar(false)}>Cancelar</button>
            </div>
          ) : (
            <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: 12, padding: '5px 14px', color: 'var(--text-muted)' }} onClick={() => setConfirmarLimpiar(true)}>🗑 Limpiar historial</button>
          )
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'reserva_creada', label: 'Reservas' },
            { value: 'reserva_cancelada', label: 'Cancelaciones' },
            { value: 'usuario_nuevo', label: 'Usuarios' },
            { value: 'paquete_vendido', label: 'Paquetes' },
            { value: 'insumo_vendido', label: 'Ventas POS' },
            { value: 'corte_caja', label: 'Cortes' },
            { value: 'clase_creada', label: 'Clases' },
            { value: 'coach_agregado', label: 'Coaches' },
            { value: 'login_cliente', label: '🔑 Sesiones cliente' },
            { value: 'lista_espera_unirse', label: '⏳ Lista espera' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltroTipo(value)}
              className={`${styles.filterChip}${filtroTipo === value ? ' ' + styles.active : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <DateNavigator modo="libre" darkMode onChange={(range) => setRangoFecha(range)} inicial="todos" />
        </div>
      </div>

      <div className={styles.card}>
        {eventosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14 }}>
              {eventos.length === 0
                ? 'No hay eventos registrados aún. La actividad aparecerá aquí automáticamente.'
                : 'No hay eventos que coincidan con filtros seleccionados.'}
            </div>
          </div>
        ) : (
          <>
            {eventosVisibles.map((evento, idx) => (
              <div
                key={evento.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderBottom: idx < eventosVisibles.length - 1 ? '1px solid var(--neutral-border)' : 'none',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  {TIPO_ICONOS[evento.tipo] ?? CATEGORY_ICONS[evento.category] ?? '📌'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {evento.descripcion}
                  </div>
                  {evento.usuarioNombre && (
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}>
                      {evento.usuarioNombre}
                    </div>
                  )}
                </div>

                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {TIPO_LABELS[evento.tipo] ?? evento.tipo}
                </span>

                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  minWidth: 120,
                  textAlign: 'right',
                }}>
                  {new Date(evento.timestamp).toLocaleString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}

            {hayMasEventos && (
              <button
                onClick={() => setExpandido((value) => !value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '9px 0',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {expandido ? '▲ Ver menos' : `▼ Ver ${eventosFiltrados.length - DEFAULT_PAGE_SIZE} más`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ActivityEventCard({ item }) {
  const metadata = metadataPreview(item.metadata)
  const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category ?? 'Sistema'
  const icon = CATEGORY_ICONS[item.category] ?? '📌'
  const entityLabel = formatEntityLabel(item)
  const actorRole = item.actorRole ? String(item.actorRole) : ''

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 14,
        alignItems: 'start',
        padding: '14px 16px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
      }}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{item.title}</strong>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
          }}>
            {categoryLabel}
          </span>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>
          {item.description || 'Sin descripción'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {item.actorName ? (
            <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              {item.actorName}
              {actorRole ? ` · ${actorRole}` : ''}
            </span>
          ) : null}
          {entityLabel ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {entityLabel}
            </span>
          ) : null}
        </div>

        {metadata.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {metadata.map((entry) => (
              <span
                key={entry}
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {entry}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', minWidth: 130 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {item.action || 'evento'}
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: 12, marginTop: 6 }}>
          {formatDateTime(item.createdAt)}
        </div>
      </div>
    </article>
  )
}

function ActivityApiView() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [category, setCategory] = useState('')
  const [dateFilter, setDateFilter] = useState({ tipo: 'todos' })

  const range = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const query = useActivityQuery({
    page,
    pageSize: Math.min(pageSize, MAX_PAGE_SIZE),
    category,
    from: range.from,
    to: range.to,
    enabled: true,
  })

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const errorMessage = friendlyError(query.error)
  const isRefetching = query.isFetching && !query.isLoading

  return (
    <div>
      <div className={styles.sectionTopRow}>
        <div>
          <div className={styles.cardTitle} style={{ marginBottom: 4 }}>Actividad</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            {isRefetching ? 'Actualizando eventos reales…' : 'Actividad real desde backend.'}
          </div>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          {total} evento{total === 1 ? '' : 's'}
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 16 }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Filtros</div>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Admin only</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`${styles.filterChip}${category === option.value ? ' ' + styles.active : ''}`}
                onClick={() => {
                  setPage(1)
                  setCategory(option.value)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <DateNavigator
            modo="libre"
            darkMode
            inicial={dateFilter.tipo || 'todos'}
            onChange={(value) => {
              setPage(1)
              setDateFilter(value)
            }}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Eventos</div>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            {items.length} mostrados · página {page} de {totalPages}
          </span>
        </div>

        {query.isLoading && (
          <div style={{ padding: '18px 0', color: 'var(--muted)' }}>
            Cargando actividad...
          </div>
        )}

        {!query.isLoading && query.error && (
          <div style={{ padding: '18px 0', color: '#f87171' }}>
            {errorMessage}
          </div>
        )}

        {!query.isLoading && !query.error && items.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
            No hay eventos para este rango.
          </div>
        )}

        {!query.isLoading && !query.error && items.length > 0 && (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((item) => (
              <ActivityEventCard key={item.id ?? `${item.category}-${item.createdAt}-${item.title}`} item={item} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            Mostrando {items.length} de {total} eventos
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            label="Página"
            compact
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        </div>
      </div>
    </div>
  )
}

export default function ActividadSection({ useApiMode = false }) {
  const apiEnabled = Boolean(useApiMode || import.meta.env.VITE_USE_API_AUTH === 'true')

  if (apiEnabled) {
    return <ActivityApiView />
  }

  return <LegacyActividadView />
}
