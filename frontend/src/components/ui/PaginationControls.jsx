export default function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  label = 'Página',
  compact = false,
}) {
  if (!totalPages || totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: compact ? 'flex-end' : 'space-between', gap: 10, marginTop: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
        {label} {page} de {totalPages}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onPrev} disabled={page <= 1} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
          Anterior
        </button>
        <button type="button" onClick={onNext} disabled={page >= totalPages} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
          Siguiente
        </button>
      </div>
    </div>
  )
}
