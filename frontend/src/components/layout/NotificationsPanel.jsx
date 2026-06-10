import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCheck, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/useApiQueries'
import styles from './Navbar.module.css'

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'No leídas' },
  { value: 'reservas', label: 'Reservas' },
  { value: 'cancelaciones', label: 'Cancelaciones' },
  { value: 'lista_espera', label: 'Lista espera' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'paquetes', label: 'Paquetes' },
  { value: 'clases', label: 'Clases' },
  { value: 'coaches', label: 'Coaches' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'sistema', label: 'Sistema' },
]

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

function previewMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return ''
  const entries = Object.entries(metadata).filter(([, value]) => value != null && value !== '')
  if (entries.length === 0) return ''
  return entries.slice(0, 2).map(([key, value]) => `${key}: ${String(value)}`).join(' · ')
}

export default function NotificationsPanel({ open, onClose, enabled = false }) {
  const panelRef = useRef(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const pageSize = 10

  const unreadOnly = filter === 'unread'
  const category = filter === 'all' || filter === 'unread' ? undefined : filter

  const notificationsQuery = useNotificationsQuery({
    page,
    pageSize,
    unreadOnly,
    category,
    enabled: Boolean(enabled && open),
  })
  const markReadMutation = useMarkNotificationReadMutation()
  const markAllMutation = useMarkAllNotificationsReadMutation()

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  const items = notificationsQuery.data?.items ?? []
  const total = notificationsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isRefetching = notificationsQuery.isFetching && !notificationsQuery.isLoading

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  )

  const handleMarkRead = async (id) => {
    try {
      await markReadMutation.mutateAsync(id)
    } catch (error) {
      // Mantener panel vivo; error se refleja en query si backend falla.
      console.error('[NotificationsPanel] mark read failed', error)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllMutation.mutateAsync()
    } catch (error) {
      console.error('[NotificationsPanel] mark all failed', error)
    }
  }

  if (!open) return null

  return createPortal(
    <div className={styles.notifPortal}>
      <div className={styles.notifPanel} ref={panelRef} role="dialog" aria-label="Notificaciones">
      <div className={styles.notifHeader}>
        <div>
          <div className={styles.notifTitle}>Notificaciones</div>
          <div className={styles.notifSub}>
            {isRefetching ? 'Actualizando...' : `${total} evento${total === 1 ? '' : 's'}`}
          </div>
        </div>
        <button type="button" className={styles.notifClose} onClick={onClose} aria-label="Cerrar notificaciones">
          <X size={16} />
        </button>
      </div>

      <div className={styles.notifFilterRow}>
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.notifFilter}${filter === option.value ? ` ${styles.notifFilterActive}` : ''}`}
            onClick={() => {
              setFilter(option.value)
              setPage(1)
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.notifActions}>
        <button
          type="button"
          className={styles.notifAction}
          onClick={handleMarkAll}
          disabled={markAllMutation.isPending || unreadCount === 0}
        >
          <CheckCheck size={14} />
          Marcar todas
        </button>
      </div>

      <div className={styles.notifList}>
        {notificationsQuery.isLoading && (
          <div className={styles.notifEmpty}>Cargando notificaciones...</div>
        )}

        {!notificationsQuery.isLoading && notificationsQuery.error && (
          <div className={styles.notifEmpty}>
            {notificationsQuery.error.message}
          </div>
        )}

        {!notificationsQuery.isLoading && !notificationsQuery.error && items.length === 0 && (
          <div className={styles.notifEmpty}>No hay notificaciones para mostrar.</div>
        )}

        {!notificationsQuery.isLoading && !notificationsQuery.error && items.map((item) => (
          <article
            key={item.id}
            className={`${styles.notifItem}${item.read ? '' : ` ${styles.notifUnread}`}`}
          >
            <div className={styles.notifItemTop}>
              <div>
                <div className={styles.notifItemTitle}>{item.title}</div>
                <div className={styles.notifItemMeta}>
                  {item.category || 'sistema'} · {formatDateTime(item.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className={styles.notifMarkRead}
                onClick={() => handleMarkRead(item.id)}
                disabled={item.read || markReadMutation.isPending}
                aria-label={`Marcar ${item.title} como leída`}
              >
                <Check size={14} />
              </button>
            </div>

            <div className={styles.notifMessage}>{item.message || 'Sin mensaje'}</div>

            {previewMetadata(item.metadata) && (
              <div className={styles.notifMetadata}>{previewMetadata(item.metadata)}</div>
            )}
          </article>
        ))}
      </div>

      <div className={styles.notifFooter}>
        <div className={styles.notifFooterText}>
          Página {page} de {totalPages}
        </div>
        <div className={styles.notifPager}>
          <button
            type="button"
            className={styles.notifPagerBtn}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <button
            type="button"
            className={styles.notifPagerBtn}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  )
}
