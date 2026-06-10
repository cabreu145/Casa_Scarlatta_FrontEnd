import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'
import PosEntityModal from '../components/PosEntityModal'
import PaginationControls from '@/components/ui/PaginationControls'
import { useCortesStore } from '@/stores/cortesStore'
import {
  useCashClosingsQuery,
  useCashClosingDetailQuery,
  useExecuteCashClosingMutation,
  useTodayCashClosingQuery,
} from '@/hooks/useApiQueries'

const useApiMode = import.meta.env.VITE_USE_API_AUTH === 'true'

function money(value) {
  const number = Number(value ?? 0)
  return `$${number.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
}

function formatDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  const date = raw.length === 10 ? new Date(`${raw}T00:00:00`) : new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

function paymentMethodLabel(method) {
  const key = String(method ?? '').trim().toLowerCase()
  return {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    other: 'Otro',
  }[key] ?? (method ? String(method) : '—')
}

function mapLegacyClosing(corte = {}) {
  const source = corte ?? {}
  return {
    id: source.id ?? source.cashClosingId ?? null,
    cashClosingId: source.id ?? source.cashClosingId ?? null,
    date: source.fecha ?? source.date ?? null,
    isClosed: String(source.estado ?? '').toLowerCase() === 'cerrado',
    salesCount: Number(source.totalReservas ?? source.salesCount ?? 0),
    subtotalMxn: Number(source.totalIngresos ?? source.subtotalMxn ?? 0),
    taxMxn: Number(source.taxMxn ?? 0),
    totalMxn: Number(source.totalIngresos ?? source.totalMxn ?? 0),
    cashTotalMxn: Number(source.totalEfectivo ?? 0),
    cardTotalMxn: Number(source.totalTarjeta ?? 0),
    transferTotalMxn: Number(source.totalTransferencia ?? 0),
    otherTotalMxn: Number(source.totalOther ?? 0),
    expensesTotalMxn: Number(source.totalGastos ?? 0),
    netTotalMxn: Number(source.neto ?? source.totalMxn ?? 0),
    notes: source.notas ?? source.notes ?? '',
    createdAt: source.createdAt ?? null,
    createdByName: source.ejecutadoPorNombre ?? '',
    sales: Array.isArray(source.sales) ? source.sales : [],
    raw: source,
  }
}

export default function CortesSection({ isActive = true, inPanel = false, useApiMode: useApiModeOverride } = {}) {
  const legacyCortes = useCortesStore((state) => state.cortes)
  const legacyExecute = useCortesStore((state) => state.ejecutarCorte)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedDetailId, setSelectedDetailId] = useState(null)

  const apiEnabled = (typeof useApiModeOverride === 'boolean' ? useApiModeOverride : useApiMode) && isActive
  const todayQuery = useTodayCashClosingQuery({ enabled: apiEnabled })
  const listQuery = useCashClosingsQuery({
    page,
    pageSize,
    from,
    to,
    enabled: apiEnabled,
  })
  const detailQuery = useCashClosingDetailQuery(selectedDetailId, {
    enabled: Boolean(apiEnabled && selectedDetailId),
  })
  const executeMutation = useExecuteCashClosingMutation()

  const summary = useMemo(() => {
    if (apiEnabled) return todayQuery.data ?? null
    return mapLegacyClosing(legacyCortes[legacyCortes.length - 1] ?? null)
  }, [apiEnabled, legacyCortes, todayQuery.data])

  const history = useMemo(() => {
    if (apiEnabled) return listQuery.data?.items ?? []
    return [...legacyCortes].reverse().map(mapLegacyClosing)
  }, [apiEnabled, legacyCortes, listQuery.data])

  const totalPages = apiEnabled
    ? Math.max(1, Math.ceil((listQuery.data?.total ?? 0) / pageSize))
    : 1

  const loadingSummary = apiEnabled && todayQuery.isLoading
  const loadingHistory = apiEnabled && listQuery.isLoading
  const summaryError = apiEnabled ? todayQuery.error?.message ?? '' : ''
  const historyError = apiEnabled ? listQuery.error?.message ?? '' : ''

  const handleExecute = async () => {
    try {
      if (apiEnabled) {
        await executeMutation.mutateAsync({ date: summary?.date, notes })
      } else {
        legacyExecute({
          fecha: summary?.date,
          notas: notes,
          estado: 'cerrado',
        })
      }
      setConfirmOpen(false)
      setNotes('')
      toast.success('Corte ejecutado')
    } catch (error) {
      const code = String(error?.code ?? error?.response?.data?.code ?? '').trim()
      const raw = String(error?.message ?? '').trim()
      if (code === 'CASH_CLOSING_ALREADY_EXISTS' || raw === 'CASH_CLOSING_ALREADY_EXISTS') {
        toast.error('Ya existe un corte para esta fecha.')
        return
      }
      toast.error(raw || 'No se pudo ejecutar el corte')
    }
  }

  const closeDetail = () => {
    setSelectedDetailId(null)
  }

  const detail = apiEnabled ? detailQuery.data ?? null : null

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>
        <div className={styles.sectionTopRow}>
          <div>
            <div className={styles.cardTitle} style={{ marginBottom: 4 }}>Resumen de hoy</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Corte diario con snapshot histórico de ventas incluidas.
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setConfirmOpen(true)}
            disabled={Boolean(summary?.isClosed)}
          >
            Realizar corte
          </button>
        </div>

        {loadingSummary && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Cargando resumen...</div>}
        {summaryError && <div style={{ color: '#f87171', marginBottom: 12 }}>{summaryError}</div>}

        <div className={styles.card} style={{ marginBottom: 16 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Corte de hoy</div>
            <span style={{ color: summary?.isClosed ? '#4ade80' : '#fbbf24', fontSize: 12, fontWeight: 600 }}>
              {summary?.isClosed ? 'Cerrado' : 'Abierto'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Fecha', value: formatDate(summary?.date) },
              { label: 'Ventas', value: String(summary?.salesCount ?? 0) },
              { label: 'Subtotal', value: money(summary?.subtotalMxn ?? 0) },
              { label: 'IVA', value: money(summary?.taxMxn ?? 0) },
              { label: 'Total ventas', value: money(summary?.totalMxn ?? 0) },
              { label: 'Efectivo', value: money(summary?.cashTotalMxn ?? 0) },
              { label: 'Tarjeta', value: money(summary?.cardTotalMxn ?? 0) },
              { label: 'Transferencia', value: money(summary?.transferTotalMxn ?? 0) },
              { label: 'Otro', value: money(summary?.otherTotalMxn ?? 0) },
              { label: 'Gastos', value: money(summary?.expensesTotalMxn ?? 0) },
              { label: 'Neto', value: money(summary?.netTotalMxn ?? 0) },
            ].map((item) => (
              <div key={item.label} style={{ padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Historial de cortes</div>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Fechas en America/Merida</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
            <input className={styles.searchInput} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input className={styles.searchInput} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>

          {historyError && <div style={{ color: '#f87171', marginBottom: 12 }}>{historyError}</div>}
          {loadingHistory && apiEnabled && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Cargando historial...</div>}

          <div className={styles.tableWrap}>
            {history.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
                No hay cortes para mostrar.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Ventas</th>
                    <th>Total</th>
                    <th>Efectivo</th>
                    <th>Tarjeta</th>
                    <th>Transferencia</th>
                    <th>Neto</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id ?? `${item.date}-${item.totalMxn}`}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.isClosed ? 'Cerrado' : 'Abierto'}</td>
                      <td>{item.salesCount ?? 0}</td>
                      <td>{money(item.totalMxn ?? 0)}</td>
                      <td>{money(item.cashTotalMxn ?? 0)}</td>
                      <td>{money(item.cardTotalMxn ?? 0)}</td>
                      <td>{money(item.transferTotalMxn ?? 0)}</td>
                      <td>{money(item.netTotalMxn ?? 0)}</td>
                      <td>
                          <button
                          type="button"
                          className={`${styles.btn} ${styles.btnGhost}`}
                          onClick={() => setSelectedDetailId(item.id)}
                          disabled={!apiEnabled || !item.id}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {apiEnabled && totalPages > 1 && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              label="Cortes"
              compact
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          )}
        </div>
      </div>

      {confirmOpen && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setConfirmOpen(false)
          }}
        >
          <PosEntityModal
            title="Realizar corte"
            ariaLabel="Realizar corte"
            onClose={() => setConfirmOpen(false)}
            footer={(
              <>
                <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </button>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  type="button"
                  onClick={handleExecute}
                  disabled={Boolean(summary?.isClosed) || executeMutation.isPending}
                >
                  {executeMutation.isPending ? 'Procesando...' : 'Confirmar corte'}
                </button>
              </>
            )}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ color: 'var(--muted)' }}>
                {summary?.isClosed
                  ? 'El corte de hoy ya fue realizado.'
                  : 'Confirma el cierre del día con el resumen actual.'}
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Notas opcionales</label>
                <textarea
                  className={styles.formInput}
                  rows={3}
                  placeholder="Cierre de caja turno tarde"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gap: 8, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Fecha</span>
                  <strong>{formatDate(summary?.date)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Total</span>
                  <strong>{money(summary?.totalMxn ?? 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Neto</span>
                  <strong>{money(summary?.netTotalMxn ?? 0)}</strong>
                </div>
              </div>
            </div>
          </PosEntityModal>
        </div>
      )}

      {selectedDetailId && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDetail()
          }}
        >
          <PosEntityModal
            title="Detalle de corte"
            ariaLabel="Detalle de corte"
            onClose={closeDetail}
            size="lg"
          >
            {apiEnabled && detailQuery.isLoading && <div style={{ color: 'var(--muted)' }}>Cargando detalle...</div>}
            {apiEnabled && detailQuery.error && <div style={{ color: '#f87171' }}>{detailQuery.error.message}</div>}
            {detail && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Fecha', value: formatDate(detail.date) },
                    { label: 'Ventas', value: String(detail.salesCount ?? detail.sales.length ?? 0) },
                    { label: 'Subtotal', value: money(detail.subtotalMxn) },
                    { label: 'IVA', value: money(detail.taxMxn) },
                    { label: 'Total', value: money(detail.totalMxn) },
                    { label: 'Gastos', value: money(detail.expensesTotalMxn) },
                    { label: 'Neto', value: money(detail.netTotalMxn) },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                      <strong style={{ display: 'block', marginTop: 6 }}>{item.value}</strong>
                    </div>
                  ))}
                </div>

                <div>
                  <div className={styles.cardTitle} style={{ marginBottom: 10 }}>Ventas incluidas</div>
                  <div className={styles.tableWrap}>
                    {detail.sales.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>
                        Este corte no contiene ventas incluidas.
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Folio</th>
                            <th>Cliente</th>
                            <th>Fecha/hora</th>
                            <th>Método</th>
                            <th>Subtotal</th>
                            <th>IVA</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.sales.map((sale) => (
                            <tr key={sale.id ?? sale.folio}>
                              <td>{sale.folio}</td>
                              <td>{sale.customerName || sale.customerEmail || 'Venta mostrador'}</td>
                              <td>{formatDateTime(sale.createdAt)}</td>
                              <td>{paymentMethodLabel(sale.paymentMethod)}</td>
                              <td>{money(sale.subtotalMxn)}</td>
                              <td>{money(sale.taxMxn)}</td>
                              <td>{money(sale.totalMxn)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </PosEntityModal>
        </div>
      )}
    </>
  )
}
