import toast from 'react-hot-toast'
import { useState } from 'react'
import styles from '../AdminPanel.module.css'
import PaginationControls from '@/components/ui/PaginationControls'
import {
  formatPackagePriceLabel,
  formatPackageCreditsLabel,
  formatPackageShareabilityLabel,
  formatPackageValidityLabel,
  getPackageBenefits,
  getPackageDisplayName,
} from '@/utils/packageDisplay'

export default function PaquetesSection({
  paquetes,
  transacciones,
  usuarios,
  openModal,
  setModalEditPaquete,
  setEditPaqueteForm,
  eliminarPaquete,
  marcarDestacado,
  useApiMode = false,
  isLoading = false,
  error = '',
  total = 0,
  page = 1,
  pageSize = 20,
  search = '',
  setSearch,
  status = 'all',
  setStatus,
  onPageChange,
  onToggleActive,
  onToggleFeatured,
}) {
  const [packageToInactivate, setPackageToInactivate] = useState(null)
  const totalPages = Math.max(1, Math.ceil((total || paquetes.length || 0) / pageSize))

  if (useApiMode) {
    return (
      <>
        <div className={styles.sectionTopRow}>
          <div className={styles.usersFilters} style={{ gap: 10 }}>
            <input
              className={styles.searchInput}
              placeholder="Buscar paquete..."
              value={search}
              onChange={(event) => setSearch?.(event.target.value)}
            />
            <select
              className={styles.formSelect}
              value={status}
              onChange={(event) => setStatus?.(event.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('paquete')}>
            + Nuevo Paquete
          </button>
        </div>

        {error && <div style={{ padding: '8px 0', color: '#f87171' }}>{error}</div>}
        {isLoading && <div style={{ padding: '8px 0', color: 'var(--muted)' }}>Cargando catálogo...</div>}

        <div className={styles.paquetesGrid}>
          {paquetes.map((p) => (
            <div key={p.id} className={`${styles.paqueteCard} ${p.isFeatured ? styles.featured : ''}`}>
              {p.isFeatured && <div className={styles.paqueteBadge}>⭐ Más popular</div>}
              <div className={styles.paqueteName}>{getPackageDisplayName(p)}</div>
              <div className={styles.paqueteClases}>
                {formatPackageCreditsLabel(p)} créditos
                {formatPackageValidityLabel(p) ? ` · ${formatPackageValidityLabel(p).replace('Válido por ', '')}` : ''}
              </div>
              <div className={styles.paquetePrice}>
                {formatPackagePriceLabel(p)}
              </div>
              <div className={styles.paqueteStats}>
                <div className={styles.paqueteStat}><strong>{getPackageBenefits(p).length}</strong> beneficios</div>
                <div className={styles.paqueteStat}><strong>{p.isActive ? 'activo' : 'inactivo'}</strong></div>
                {formatPackageShareabilityLabel(p) && (
                  <div className={styles.paqueteStat}><strong>{formatPackageShareabilityLabel(p)}</strong></div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 11, padding: '6px' }}
                  onClick={() => {
                    setModalEditPaquete(p)
                    setEditPaqueteForm({
                      nombre: useApiMode ? String(p.name ?? '') : String(p.name ?? p.nombre ?? ''),
                      precio: String(p.precio ?? p.priceMxn ?? p.price_mxn ?? 0),
                      clases: String(p.creditos ?? p.clases ?? 0),
                      vigencia: String(p.durationDays ?? p.duration_days ?? ''),
                      destacado: Boolean(p.isFeatured),
                      isActive: Boolean(p.isActive),
                      beneficios: [...getPackageBenefits(p)],
                      isShareable: Boolean(p.isShareable),
                      maxBeneficiaries: Number(p.maxBeneficiaries ?? p.max_beneficiaries ?? 0),
                    })
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 11, padding: '6px', color: '#ef4444' }}
                  onClick={async () => {
                    setPackageToInactivate(p)
                  }}
                >
                  🚫 Inactivar
                </button>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 11, padding: '6px', gridColumn: '1/-1', color: p.isActive ? '#d97706' : '#16a34a' }}
                  onClick={() => onToggleActive?.(p.id, !p.isActive)}
                >
                  {p.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 11, padding: '6px', gridColumn: '1/-1', color: '#d97706' }}
                  onClick={() => onToggleFeatured?.(p.id, !p.isFeatured)}
                >
                  {p.isFeatured ? 'Quitar destacado' : 'Marcar popular'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ marginTop: 16 }}>
            <PaginationControls
              page={page}
              totalPages={totalPages}
              label="Paquetes"
              compact
              onPrev={() => onPageChange?.(Math.max(1, page - 1))}
              onNext={() => onPageChange?.(Math.min(totalPages, page + 1))}
            />
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Historial de ventas de paquetes</div>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              Disponible próximamente en Reportes
            </span>
          </div>
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            Historial de ventas disponible próximamente en Reportes.
          </div>
        </div>
        {packageToInactivate && (
          <div
            className={`${styles.modalOverlay} ${styles.open}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) setPackageToInactivate(null)
            }}
          >
            <div className={styles.modal} style={{ maxWidth: 520 }}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Inactivar paquete</div>
                <button className={styles.modalClose} onClick={() => setPackageToInactivate(null)}>×</button>
              </div>
              <div style={{ padding: '8px 0 18px', color: 'var(--muted)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                Este paquete dejará de mostrarse como activo y no estará disponible para nuevas compras o asignaciones. El historial se conservará.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setPackageToInactivate(null)}>
                  Cancelar
                </button>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  onClick={async () => {
                    const pkg = packageToInactivate
                    setPackageToInactivate(null)
                    await eliminarPaquete?.(pkg.id)
                  }}
                >
                  Inactivar paquete
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className={styles.sectionTopRow}>
        <div />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('paquete')}>
          + Nuevo Paquete
        </button>
      </div>
          <div className={styles.paquetesGrid}>
        {paquetes.map((p) => (
          <div key={p.id} className={`${styles.paqueteCard} ${p.destacado ? styles.featured : ''}`}>
            {p.destacado && <div className={styles.paqueteBadge}>⭐ Más popular</div>}
            <div className={styles.paqueteName}>{getPackageDisplayName(p)}</div>
            <div className={styles.paqueteClases}>
              {formatPackageCreditsLabel(p)} clases
              {formatPackageValidityLabel(p) ? ` · ${formatPackageValidityLabel(p).replace('Válido por ', '')}` : ''}
            </div>
            <div className={styles.paquetePrice}>
              {formatPackagePriceLabel(p)}
            </div>
            <div className={styles.paqueteStats}>
              <div className={styles.paqueteStat}><strong>{getPackageBenefits(p).length}</strong> beneficios</div>
              <div className={styles.paqueteStat}><strong>{formatPackageShareabilityLabel(p) || 'No compartible'}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '6px' }}
                onClick={() => {
                  setModalEditPaquete(p)
                  setEditPaqueteForm({
                    nombre: useApiMode ? String(p.name ?? '') : String(p.name ?? p.nombre ?? ''),
                    precio: String(p.precio ?? p.priceMxn ?? p.price_mxn ?? 0),
                    clases: String(p.clases ?? p.creditos ?? 0),
                    vigencia: String(p.vigencia ?? p.durationDays ?? p.duration_days ?? ''),
                    destacado: Boolean(p.destacado ?? p.isFeatured),
                    beneficios: [...getPackageBenefits(p)],
                    isShareable: Boolean(p.isShareable),
                    maxBeneficiaries: Number(p.maxBeneficiaries ?? p.max_beneficiaries ?? 0),
                  })
                }}
              >âœï¸ Editar</button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '6px', color: '#ef4444' }}
                onClick={() => setPackageToInactivate(p)}
              >
                🚫 Inactivar
              </button>
              {!p.destacado && (
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 11, padding: '6px', gridColumn: '1/-1', color: '#d97706' }}
                  onClick={() => { marcarDestacado(p.id); toast.success(`"${getPackageDisplayName(p)}" marcado como popular`) }}
                >⭐ Marcar popular</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Historial de ventas de paquetes</div>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Descarga disponible en Reportes</span>
        </div>
        <div className={styles.tableWrap}>
          {(() => {
            const ventasPaq = transacciones
              .filter(tx => tx.tipo === 'paquete')
              .slice().reverse()
            if (ventasPaq.length === 0) return (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                No hay ventas de paquetes registradas.
              </div>
            )
            return (
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th><th>Paquete</th><th>Fecha compra</th>
                    <th>Vencimiento</th><th>Clases rest.</th><th>Monto</th><th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasPaq.map((tx, i) => {
                    const usuario = usuarios.find(u => u.id === tx.userId)
                    const paqInfo = paquetes.find(p => tx.concepto?.includes(getPackageDisplayName(p)))
                    const vencimiento = (() => {
                      if (!tx.fecha || !paqInfo?.vigencia) return '—'
                      const dias = parseInt(paqInfo.vigencia) || 30
                      const d = new Date(tx.fecha + 'T00:00:00')
                      d.setDate(d.getDate() + dias)
                      return d.toISOString().split('T')[0]
                    })()
                    const clasesRest = usuario?.clasesPaquete ?? '—'
                    return (
                      <tr key={i}>
                        <td>{usuario?.nombre ?? tx.userId ?? '—'}</td>
                        <td>{tx.concepto ?? '—'}</td>
                        <td>{tx.fecha ?? '—'}</td>
                        <td>{vencimiento}</td>
                        <td>{clasesRest}</td>
                        <td className={styles.mono}>{tx.monto}</td>
                        <td>{tx.metodoPago ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          })()}
        </div>
      </div>
      {packageToInactivate && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPackageToInactivate(null)
          }}
        >
          <div className={styles.modal} style={{ maxWidth: 520 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Inactivar paquete</div>
              <button className={styles.modalClose} onClick={() => setPackageToInactivate(null)}>×</button>
            </div>
            <div style={{ padding: '8px 0 18px', color: 'var(--muted)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              Este paquete dejará de mostrarse como activo y no estará disponible para nuevas compras o asignaciones. El historial se conservará.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setPackageToInactivate(null)}>
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={async () => {
                  const pkg = packageToInactivate
                  setPackageToInactivate(null)
                  await eliminarPaquete?.(pkg.id)
                }}
              >
                Inactivar paquete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
