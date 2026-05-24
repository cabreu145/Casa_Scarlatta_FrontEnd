/**
 * useInfiniteScroll.js
 * Hook que implementa infinite scroll usando IntersectionObserver.
 * Devuelve los items visibles y una ref para el elemento centinela.
 *
 * Uso:
 *   const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(items, 20)
 *   visibleItems.map(item => <Item />)
 *   {hasMore && <div ref={sentinelRef} />}
 */
import { useState, useEffect, useRef } from 'react'

export function useInfiniteScroll(items = [], pageSize = 20) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sentinelRef = useRef(null)

  // Reset cuando cambia la lista de items
  useEffect(() => {
    setVisibleCount(pageSize)
  }, [items, pageSize])

  // IntersectionObserver: carga más cuando el centinela es visible
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, items.length))
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [items.length, pageSize])

  const visibleItems = items.slice(0, visibleCount)
  const hasMore      = visibleCount < items.length

  return { visibleItems, sentinelRef, hasMore, total: items.length }
}
