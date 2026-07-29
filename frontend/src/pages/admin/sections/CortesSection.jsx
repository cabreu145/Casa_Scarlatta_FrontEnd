import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'
import PaginationControls from '@/components/ui/PaginationControls'
import { useCortesStore } from '@/stores/cortesStore'
import {
  useCashClosingsQuery,
  useCashClosingDetailQuery,
  useExecuteCashClosingMutation,
  useExecuteCashShiftMutation,
  useCashShiftSummaryQuery,
  useOpenCashShiftMutation,
} from '@/hooks/useApiQueries'

const useApiMode = import.meta.env.VITE_USE_API_AUTH === 'true'

const SHIFTS = [
  { key: 'turno_1', label: 'Turno 1' },
  { key: 'turno_2', label: 'Turno 2' },
]

const SHIFT_ERROR_MESSAGES = {
  CASH_SHIFT_ALREADY_OPEN: 'Este turno ya tiene caja abierta.',
  CASH_SHIFT_NOT_OPEN: 'Primero abre la caja de este turno.',
  CASH_SHIFT_ALREADY_CLOSED: 'Este turno ya fue cerrado.',
  CASH_SHIFT_NOT_FOUND: 'No encontramos el corte de este turno.',
  CASH_SHIFT_INVALID: 'Turno inválido.',
  CASH_CLOSING_ALREADY_EXISTS: 'Ya existe un corte para esta fecha y turno.',
  CASH_OPENING_CASH_INVALID: 'El fondo inicial no es válido.',
  CASH_COUNTED_CASH_INVALID: 'El efectivo contado no es válido.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
}

function shiftErrorMessage(error) {
  const code = String(error?.code ?? error?.response?.data?.code ?? '').trim()
  const msg = String(error?.message ?? '').trim()
  return SHIFT_ERROR_MESSAGES[code] ?? SHIFT_ERROR_MESSAGES[msg] ?? (msg || 'Ocurrió un error inesperado.')
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function money(value) {
  const number = Number(value ?? 0)
  return `$${number.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function paymentMethodLabel(method) {
  const key = String(method ?? '').trim().toLowerCase()
  return { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro' }[key] ?? (method ? String(method) : '—')
}

function DifferenceTag({ value }) {
  if (value === null || value === undefined) return null
  const num = Number(value)
  if (num > 0) return <span style={{ color: '#4ade80', fontWeight: 700 }}>Sobrante</span>
  if (num < 0) return <span style={{ color: '#f87171', fontWeight: 700 }}>Faltante</span>
  return <span style={{ color: '#60a5fa', fontWeight: 700 }}>Cuadrado</span>
}

function StatGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
      {items.map((item) => (
        <div key={item.label} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function mapLegacyClosing(corte = {}) {
  const source = corte ?? {}
  return {
    id: source.id ?? source.cashClosingId ?? null,
    cashClosingId: source.id ?? source.cashClosingId ?? null,
    date: source.fecha ?? source.date ?? null,
    shiftKey: source.shiftKey ?? 'dia_completo',
    shiftLabel: source.shiftLabel ?? 'Día completo',
    status: source.status ?? (String(source.estado ?? '').toLowerCase() === 'cerrado' ? 'closed' : 'open'),
    isOpen: String(source.estado ?? '').toLowerCase() !== 'cerrado',
    isClosed: String(source.estado ?? '').toLowerCase() === 'cerrado',
    salesCount: Number(source.totalReservas ?? source.salesCount ?? 0),
    subtotalMxn: Number(source.totalIngresos ?? source.subtotalMxn ?? 0),
    taxMxn: Number(source.taxMxn ?? 0),
    totalMxn: Number(source.totalIngresos ?? source.totalMxn ?? 0),
    openingCashMxn: Number(source.openingCashMxn ?? 0),
    cashTotalMxn: Number(source.totalEfectivo ?? 0),
    cardTotalMxn: Number(source.totalTarjeta ?? 0),
    transferTotalMxn: Number(source.totalTransferencia ?? 0),
    otherTotalMxn: Number(source.totalOther ?? 0),
    expensesTotalMxn: Number(source.totalGastos ?? 0),
    cashOutflowsMxn: Number(source.cashOutflowsMxn ?? 0),
    expectedCashMxn: Number(source.expectedCashMxn ?? 0),
    countedCashMxn: source.countedCashMxn ?? null,
    cashDifferenceMxn: source.cashDifferenceMxn ?? null,
    netTotalMxn: Number(source.neto ?? source.totalMxn ?? 0),
    notes: source.notas ?? source.notes ?? '',
    createdAt: source.createdAt ?? null,
    createdByName: source.created_by_name ?? source.createdByName ?? source.responsible_name ?? source.ejecutadoPorNombre ?? '',
    sales: Array.isArray(source.sales) ? source.sales : [],
    expenses: Array.isArray(source.expenses) ? source.expenses : [],
    raw: source,
  }
}

export default function CortesSection({ isActive = true, inPanel = false, useApiMode: useApiModeOverride } = {}) {
  const legacyCortes = useCortesStore((state) => state.cortes)
  const legacyExecute = useCortesStore((state) => state.ejecutarCorte)

  const apiEnabled = (typeof useApiModeOverride === 'boolean' ? useApiModeOverride : useApiMode) && isActive

  // Shift selector state
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [selectedShift, setSelectedShift] = useState('turno_1')

  // History filter state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filterShift, setFilterShift] = useState('')

  // Modal state
  const [openingCash, setOpeningCash] = useState('')
  const [openingNotes, setOpeningNotes] = useState('')
  const [openingResponsible, setOpeningResponsible] = useState('')
  const [countedCash, setCountedCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [selectedDetailId, setSelectedDetailId] = useState(null)

  // Shift summary query
  const shiftSummaryQuery = useCashShiftSummaryQuery({
    date: selectedDate,
    shiftKey: selectedShift,
    enabled: apiEnabled,
  })

  // History query
  const listQuery = useCashClosingsQuery({
    page,
    pageSize,
    from,
    to,
    shiftKey: filterShift || undefined,
    enabled: apiEnabled,
  })

  const detailQuery = useCashClosingDetailQuery(selectedDetailId, {
    enabled: Boolean(apiEnabled && selectedDetailId),
  })

  const openMutation = useOpenCashShiftMutation()
  const closeMutation = useExecuteCashShiftMutation()
  // legacy fallback
  const executesMutation = useExecuteCashClosingMutation()

  const shiftSummary = apiEnabled ? shiftSummaryQuery.data ?? null : null

  const history = useMemo(() => {
    if (apiEnabled) return listQuery.data?.items ?? []
    return [...legacyCortes].reverse().map(mapLegacyClosing)
  }, [apiEnabled, legacyCortes, listQuery.data])

  const totalPages = apiEnabled
    ? Math.max(1, Math.ceil((listQuery.data?.total ?? 0) / pageSize))
    : 1

  const handleOpen = async () => {
    const cashValue = String(openingCash).trim()
    if (cashValue === '' || Number.isNaN(Number(cashValue)) || Number(cashValue) < 0) {
      toast.error('Ingresa un fondo inicial válido.')
      return
    }
    try {
      await openMutation.mutateAsync({
        date: selectedDate,
        shiftKey: selectedShift,
        opening_cash_mxn: Number(cashValue),
        notes: openingNotes,
        responsibleName: openingResponsible.trim() || undefined,
      })
      setOpeningCash('')
      setOpeningNotes('')
      setOpeningResponsible('')
      toast.success('Caja abierta correctamente.')
    } catch (error) {
      toast.error(shiftErrorMessage(error))
    }
  }

  const handleClose = async () => {
    const cashValue = String(countedCash).trim()
    if (cashValue === '' || Number.isNaN(Number(cashValue)) || Number(cashValue) < 0) {
      toast.error('Ingresa el efectivo contado.')
      return
    }
    try {
      if (apiEnabled) {
        await closeMutation.mutateAsync({
          date: selectedDate,
          shiftKey: selectedShift,
          counted_cash_mxn: Number(cashValue),
          notes: closingNotes,
          responsibleName: responsibleName.trim() || undefined,
        })
      } else {
        legacyExecute({ fecha: selectedDate, notas: closingNotes, estado: 'cerrado' })
      }
      setCountedCash('')
      setClosingNotes('')
      setResponsibleName('')
      toast.success('Corte ejecutado correctamente.')
    } catch (error) {
      toast.error(shiftErrorMessage(error))
    }
  }

  const shiftLoading = apiEnabled && shiftSummaryQuery.isLoading
  const shiftError = apiEnabled ? (shiftSummaryQuery.error?.message ?? '') : ''

  // Determine which panel to show
  const shiftIsOpen = shiftSummary?.isOpen === true
  const shiftIsClosed = shiftSummary?.isClosed === true
  const shiftNotStarted = shiftSummary !== null && !shiftIsOpen && !shiftIsClosed

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>

        {/* Date + Shift selectors */}
        <div className={styles.card} style={{ marginBottom: 16 }}>
          <div className={styles.cardTitle} style={{ marginBottom: 12 }}>Corte de caja por turno</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label className={styles.formLabel} style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>Fecha</label>
              <input
                className={styles.searchInput}
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setCountedCash(''); setOpeningCash('') }}
              />
            </div>
            <div>
              <label className={styles.formLabel} style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>Turno</label>
              <select
                className={styles.searchInput}
                value={selectedShift}
                onChange={(e) => { setSelectedShift(e.target.value); setCountedCash(''); setOpeningCash('') }}
              >
                {SHIFTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Loading / error state */}
        {shiftLoading && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Cargando turno...</div>}
        {shiftError && !shiftLoading && (
          <div style={{ color: '#f87171', marginBottom: 12 }}>{shiftError}</div>
        )}

        {/* Status badge */}
        {shiftSummary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{shiftSummary.shiftLabel || SHIFTS.find(s => s.key === selectedShift)?.label}</span>
            <span style={{
              padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: shiftIsOpen ? 'rgba(74,222,128,0.12)' : shiftIsClosed ? 'rgba(96,165,250,0.12)' : 'rgba(251,191,36,0.12)',
              color: shiftIsOpen ? '#4ade80' : shiftIsClosed ? '#60a5fa' : '#fbbf24',
            }}>
              {shiftIsOpen ? 'Abierto' : shiftIsClosed ? 'Cerrado' : 'Sin apertura'}
            </span>
          </div>
        )}

        {/* Apertura form — shift not started */}
        {apiEnabled && shiftNotStarted && (
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardTitle} style={{ marginBottom: 12 }}>Apertura de caja</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label className={styles.formLabel}>Fecha</label>
                  <div style={{ padding: '8px 0', fontWeight: 600 }}>{formatDate(selectedDate)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label className={styles.formLabel}>Turno</label>
                  <div style={{ padding: '8px 0', fontWeight: 600 }}>{SHIFTS.find(s => s.key === selectedShift)?.label}</div>
                </div>
              </div>
              <div>
                <label className={styles.formLabel}>Responsable de apertura</label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Nombre de quien abre la caja"
                  value={openingResponsible}
                  onChange={(e) => setOpeningResponsible(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Fondo inicial (MXN)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Notas (opcional)</label>
                <textarea
                  className={styles.formInput}
                  rows={2}
                  placeholder="Apertura turno mañana"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                />
              </div>
              <div>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleOpen}
                  disabled={openMutation.isPending}
                >
                  {openMutation.isPending ? 'Abriendo...' : 'Abrir caja'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open shift — resumen + cierre */}
        {(shiftIsOpen || (!apiEnabled && shiftSummary === null)) && (
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Resumen del turno</div>
            </div>
            <StatGrid items={[
              { label: 'Fecha', value: formatDate(shiftSummary?.date ?? selectedDate) },
              { label: 'Fondo inicial', value: money(shiftSummary?.openingCashMxn ?? 0) },
              { label: 'Ventas', value: String(shiftSummary?.salesCount ?? 0) },
              { label: 'Efectivo ventas', value: money(shiftSummary?.cashTotalMxn ?? 0) },
              { label: 'Tarjeta', value: money(shiftSummary?.cardTotalMxn ?? 0) },
              { label: 'Transferencia', value: money(shiftSummary?.transferTotalMxn ?? 0) },
              { label: 'Otros', value: money(shiftSummary?.otherTotalMxn ?? 0) },
              { label: 'Salidas efectivo', value: money(shiftSummary?.cashOutflowsMxn ?? 0) },
              { label: 'Efectivo esperado', value: money(shiftSummary?.expectedCashMxn ?? 0) },
              { label: 'Total ventas', value: money(shiftSummary?.totalMxn ?? 0) },
              { label: 'Neto', value: money(shiftSummary?.netTotalMxn ?? 0) },
            ]} />

            <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <div className={styles.cardTitle} style={{ marginBottom: 12 }}>Cerrar corte</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className={styles.formLabel}>Responsable del corte</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="Nombre de quien realiza el corte"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Efectivo contado (MXN)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1550"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Notas (opcional)</label>
                  <textarea
                    className={styles.formInput}
                    rows={2}
                    placeholder="Cierre turno mañana"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleClose}
                    disabled={closeMutation.isPending || executesMutation.isPending}
                  >
                    {(closeMutation.isPending || executesMutation.isPending) ? 'Cerrando...' : 'Cerrar corte'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Closed shift — resumen final */}
        {shiftIsClosed && (
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Resumen final del turno</div>
              <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600 }}>Cerrado</span>
            </div>
            <StatGrid items={[
              { label: 'Fecha', value: formatDate(shiftSummary?.date ?? selectedDate) },
              { label: 'Fondo inicial', value: money(shiftSummary?.openingCashMxn ?? 0) },
              { label: 'Efectivo ventas', value: money(shiftSummary?.cashTotalMxn ?? 0) },
              { label: 'Tarjeta', value: money(shiftSummary?.cardTotalMxn ?? 0) },
              { label: 'Transferencia', value: money(shiftSummary?.transferTotalMxn ?? 0) },
              { label: 'Salidas efectivo', value: money(shiftSummary?.cashOutflowsMxn ?? 0) },
              { label: 'Efectivo esperado', value: money(shiftSummary?.expectedCashMxn ?? 0) },
              { label: 'Efectivo contado', value: shiftSummary?.countedCashMxn !== null ? money(shiftSummary?.countedCashMxn) : '—' },
              { label: 'Diferencia', value: shiftSummary?.cashDifferenceMxn !== null ? money(shiftSummary?.cashDifferenceMxn) : '—' },
            ]} />
            {shiftSummary?.cashDifferenceMxn !== null && shiftSummary?.cashDifferenceMxn !== undefined && (
              <div style={{ marginTop: 12, fontSize: 16 }}>
                <DifferenceTag value={shiftSummary.cashDifferenceMxn} />
                {' '}
                {Number(shiftSummary.cashDifferenceMxn) !== 0 && (
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                    ({money(Math.abs(shiftSummary.cashDifferenceMxn))})
                  </span>
                )}
              </div>
            )}
            {shiftSummary?.id && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ marginTop: 14 }}
                onClick={() => setSelectedDetailId(shiftSummary.id)}
                disabled={!apiEnabled}
              >
                Ver detalle completo
              </button>
            )}
          </div>
        )}

        {/* History */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Historial de cortes</div>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Fechas en America/Merida</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
            <input className={styles.searchInput} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} placeholder="Desde" />
            <input className={styles.searchInput} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} placeholder="Hasta" />
            <select className={styles.searchInput} value={filterShift} onChange={(e) => { setFilterShift(e.target.value); setPage(1) }}>
              <option value="">Todos los turnos</option>
              {SHIFTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              <option value="dia_completo">Día completo (legacy)</option>
            </select>
          </div>

          {apiEnabled && listQuery.error && <div style={{ color: '#f87171', marginBottom: 12 }}>{listQuery.error.message}</div>}
          {apiEnabled && listQuery.isLoading && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Cargando historial...</div>}

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
                    <th>Turno</th>
                    <th>Estado</th>
                    <th>Fondo inicial</th>
                    <th>Efectivo esp.</th>
                    <th>Efectivo cont.</th>
                    <th>Diferencia</th>
                    <th>Total ventas</th>
                    <th>Neto</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id ?? `${item.date}-${item.shiftKey}`}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.shiftLabel || item.shiftKey || '—'}</td>
                      <td>
                        <span style={{ color: item.isClosed ? '#4ade80' : item.isOpen ? '#fbbf24' : 'var(--muted)' }}>
                          {item.isClosed ? 'Cerrado' : item.isOpen ? 'Abierto' : item.status ?? '—'}
                        </span>
                      </td>
                      <td>{money(item.openingCashMxn ?? 0)}</td>
                      <td>{item.expectedCashMxn ? money(item.expectedCashMxn) : '—'}</td>
                      <td>{item.countedCashMxn !== null && item.countedCashMxn !== undefined ? money(item.countedCashMxn) : '—'}</td>
                      <td>
                        {item.cashDifferenceMxn !== null && item.cashDifferenceMxn !== undefined
                          ? <><DifferenceTag value={item.cashDifferenceMxn} /> <span style={{ color: 'var(--muted)', fontSize: 12 }}>{money(item.cashDifferenceMxn)}</span></>
                          : '—'}
                      </td>
                      <td>{money(item.totalMxn ?? 0)}</td>
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
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedDetailId && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetailId(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}
        >
          <div role="dialog" aria-modal="true" aria-label="Detalle de corte" style={{ background: '#1C0A0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 860, padding: 32, position: 'relative', color: '#fff' }}>
            <button onClick={() => setSelectedDetailId(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 16, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Detalle de corte</div>
            {detailQuery.data && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>{detailQuery.data.date ? new Date(`${detailQuery.data.date}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {detailQuery.data.shiftLabel || ''}</div>}
            <div>
            {detailQuery.isLoading && <div style={{ color: 'rgba(255,255,255,0.4)', padding: '32px 0', textAlign: 'center' }}>Cargando detalle...</div>}
            {detailQuery.error && <div style={{ color: '#f87171' }}>{detailQuery.error.message}</div>}
            {detailQuery.data && (() => {
              const c = detailQuery.data
              const diff    = c.cashDifferenceMxn
              const counted = c.countedCashMxn
              const tdStyle = { padding: '10px 12px', color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }
              const thStyle = { textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A69A93', borderBottom: '1px solid #3C2A2E', whiteSpace: 'nowrap' }
              const panelStyle = { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }
              const labelStyle = { fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }
              const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }
              const keyStyle = { fontSize: 12, color: 'var(--muted)' }

              let saludBg = 'rgba(34,197,94,0.1)'; let saludBorder = 'rgba(34,197,94,0.3)'; let saludColor = '#22c55e'; let saludTxt = 'Cuadrado'; let saludSub = 'Sin diferencias'
              if (counted === null || counted === undefined) { saludBg = 'rgba(245,158,11,0.1)'; saludBorder = 'rgba(245,158,11,0.3)'; saludColor = '#F59E0B'; saludTxt = 'Sin contar'; saludSub = 'Falta contar efectivo' }
              else if (diff < 0) { saludBg = 'rgba(239,68,68,0.1)'; saludBorder = 'rgba(239,68,68,0.3)'; saludColor = '#ef4444'; saludTxt = `Diferencia ${money(Math.abs(diff))}`; saludSub = 'Revisar ventas' }
              else if (diff > 0) { saludSub = `Sobrante ${money(diff)}` }

              return (
                <div style={{ display: 'grid', gap: 16 }}>
                  {/* Salud + ventas count header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{c.salesCount ?? 0} ventas</div>
                    <div style={{ background: saludBg, border: `1px solid ${saludBorder}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: saludColor }}>✔ {saludTxt}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{saludSub}</div>
                    </div>
                  </div>

                  {/* Apertura / Cierre */}
                  <div style={{ display: 'grid', gridTemplateColumns: c.closedAt ? '1fr 1fr' : '1fr', gap: 12 }}>
                    <div style={panelStyle}>
                      <div style={labelStyle}>Apertura</div>
                      {[['Fondo inicial', money(c.openingCashMxn)], c.openedAt ? ['Hora apertura', formatDateTime(c.openedAt)] : null, c.openingResponsibleName ? ['Responsable apertura', c.openingResponsibleName] : (c.isOpen && c.createdByName ? ['Responsable', c.createdByName] : null)].filter(Boolean).map(([l, v]) => (
                        <div key={l} style={rowStyle}><span style={keyStyle}>{l}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{v}</span></div>
                      ))}
                    </div>
                    {c.closedAt && (
                      <div style={panelStyle}>
                        <div style={labelStyle}>Cierre</div>
                        {[['Hora cierre', formatDateTime(c.closedAt)], c.createdByName ? ['Responsable cierre', c.createdByName] : null].filter(Boolean).map(([l, v]) => (
                          <div key={l} style={rowStyle}><span style={keyStyle}>{l}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{v}</span></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desglose financiero */}
                  <div style={panelStyle}>
                    <div style={labelStyle}>Desglose de ingresos</div>
                    {[
                      { l: 'Total ventas',             v: money(c.totalMxn),          color: '#fff',    bold: true },
                      null,
                      { l: 'Dinero físico (efectivo)', v: money(c.cashTotalMxn),       color: '#60A5FA' },
                      { l: 'Dinero bancario',          v: money((c.cardTotalMxn ?? 0) + (c.transferTotalMxn ?? 0) + (c.otherTotalMxn ?? 0)), color: '#60A5FA' },
                      null,
                      { l: 'Gastos',                   v: money(c.expensesTotalMxn),   color: '#f87171' },
                      { l: 'Utilidad del turno',       v: money(c.netTotalMxn),        color: '#4ade80', bold: true },
                    ].map((item, i) => item === null
                      ? <div key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '6px 0' }} />
                      : <div key={item.l} style={rowStyle}><span style={keyStyle}>{item.l}</span><span style={{ fontSize: item.bold ? 14 : 13, fontWeight: item.bold ? 700 : 500, color: item.color || '#fff' }}>{item.v}</span></div>
                    )}
                  </div>

                  {/* Dinero por entregar + Conteo */}
                  <div style={{ display: 'grid', gridTemplateColumns: counted !== null && counted !== undefined ? '1fr 1fr' : '1fr', gap: 12 }}>
                    <div style={panelStyle}>
                      <div style={labelStyle}>Dinero por entregar ⭐</div>
                      {[
                        { l: 'Efectivo a entregar',      v: money(c.cashTotalMxn) },
                        { l: 'Tarjetas / Transferencia', v: money((c.cardTotalMxn ?? 0) + (c.transferTotalMxn ?? 0) + (c.otherTotalMxn ?? 0)) },
                        { l: 'Total corte',              v: money(c.totalMxn), color: '#E8A4AD', bold: true },
                      ].map(({ l, v, color, bold }) => (
                        <div key={l} style={rowStyle}><span style={keyStyle}>{l}</span><span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color: color || '#fff' }}>{v}</span></div>
                      ))}
                    </div>
                    {counted !== null && counted !== undefined && (
                      <div style={panelStyle}>
                        <div style={labelStyle}>Conteo de caja</div>
                        {[
                          { l: 'Efectivo esperado', v: money(c.expectedCashMxn) },
                          { l: 'Efectivo contado',  v: money(counted) },
                          { l: 'Diferencia',        v: money(diff), color: (diff ?? 0) >= 0 ? '#4ade80' : '#f87171', bold: true },
                        ].map(({ l, v, color, bold }) => (
                          <div key={l} style={rowStyle}><span style={keyStyle}>{l}</span><span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 700 : 500, color: color || '#fff' }}>{v}</span></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ventas */}
                  <div>
                    <div className={styles.cardTitle} style={{ marginBottom: 10 }}>Ventas incluidas ({c.salesCount ?? 0})</div>
                    <div style={{ overflowX: 'auto' }}>
                      {c.sales.length === 0 ? (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>Sin ventas en este corte.</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr>{['Folio','Cliente','Fecha/hora','Método','Subtotal','IVA','Total'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                          <tbody>
                            {c.sales.map((sale) => (
                              <tr key={sale.id ?? sale.folio}>
                                {[sale.folio, sale.customerName || sale.customerEmail || 'Venta mostrador', formatDateTime(sale.createdAt), paymentMethodLabel(sale.paymentMethod), money(sale.subtotalMxn), money(sale.taxMxn), money(sale.totalMxn)].map((v, i) => <td key={i} style={tdStyle}>{v}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Gastos */}
                  {c.expenses.length > 0 && (
                    <div>
                      <div className={styles.cardTitle} style={{ marginBottom: 10 }}>Gastos del turno ({c.expenses.length})</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr>{['Categoría','Descripción','Método','Fecha','Monto'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                          <tbody>
                            {c.expenses.map((exp) => (
                              <tr key={exp.id ?? exp.expenseId}>
                                {[exp.category || '—', exp.description || '—', paymentMethodLabel(exp.paymentMethod), formatDate(exp.expenseDate), money(exp.amountMxn)].map((v, i) => <td key={i} style={tdStyle}>{v}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
