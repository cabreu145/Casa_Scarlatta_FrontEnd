/**
 * InfiniteList.jsx
 * ─────────────────────────────────────────────────────
 * Componente reutilizable de lista con infinite scroll.
 * Carga items en lotes usando IntersectionObserver.
 *
 * Props:
 *   items        array de datos a mostrar
 *   renderItem   (item, index) => ReactNode
 *   pageSize     cuántos items cargar por lote (default: 20)
 *   emptyNode    ReactNode cuando no hay items
 *   loadingNode  ReactNode mientras carga más (opcional)
 *   gap          gap entre items en px (default: 0)
 *   darkMode     boolean
 * ─────────────────────────────────────────────────────
 */
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

export default function InfiniteList({
  items = [],
  renderItem,
  pageSize = 20,
  emptyNode,
  loadingNode,
  gap = 0,
  darkMode = false,
}) {
  const { visibleItems, sentinelRef, hasMore, total } = useInfiniteScroll(items, pageSize)

  if (items.length === 0) {
    return emptyNode ?? (
      <div style={{
        textAlign:  'center',
        padding:    '40px 0',
        color:      darkMode ? 'rgba(255,255,255,0.35)' : 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        fontSize:   14,
      }}>
        Sin resultados
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {visibleItems.map((item, idx) => renderItem(item, idx))}
      </div>

      {/* Centinela — cuando es visible carga más items */}
      {hasMore && (
        <div ref={sentinelRef} style={{ padding: '16px 0', textAlign: 'center' }}>
          {loadingNode ?? (
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize:   12,
              color:      darkMode ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)',
            }}>
              Cargando más... ({visibleItems.length} de {total})
            </span>
          )}
        </div>
      )}

      {!hasMore && total > pageSize && (
        <div style={{
          textAlign:  'center',
          padding:    '12px 0',
          fontFamily: 'var(--font-body)',
          fontSize:   11,
          color:      darkMode ? 'rgba(255,255,255,0.2)' : 'var(--text-muted)',
        }}>
          {total} resultado{total !== 1 ? 's' : ''} en total
        </div>
      )}
    </div>
  )
}
