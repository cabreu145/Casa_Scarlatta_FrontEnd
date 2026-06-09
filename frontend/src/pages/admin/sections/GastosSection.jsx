import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'
import PosEntityModal from '../components/PosEntityModal'
import PaginationControls from '@/components/ui/PaginationControls'
import { useGastosStore } from '@/stores/gastosStore'
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHODS,
  buildExpenseApiPayload,
  validateExpenseApiPayload,
} from '../expenseApiPayload'
import {
  useCancelExpenseMutation,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExpenseDetailQuery,
  useExpensesQuery,
  useUpdateExpenseMutation,
} from '@/hooks/useApiQueries'

const useApiModeDefault = import.meta.env.VITE_USE_API_AUTH === 'true'

function todayLocalDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Merida',
  }).format(new Date())
}

function money(value) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  const date = raw.length === 10 ? new Date(`${raw}T00:00:00`) : new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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
  return ({
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    other: 'Otro',
  })[key] ?? (method ? String(method) : '—')
}

function statusLabel(status) {
  const key = String(status ?? '').trim().toLowerCase()
  return key === 'cancelled' ? 'Cancelado' : 'Activo'
}

function mapLegacyExpense(expense = {}) {
  const source = expense ?? {}
  const status = String(source.status ?? source.estado ?? '').trim().toLowerCase() === 'cancelled'
    ? 'cancelled'
    : 'active'
  const amountMxn = Number(source.amountMxn ?? source.amount_mxn ?? source.monto ?? 0)
  return {
    id: source.id ?? source.expenseId ?? source.gastoId ?? `gasto-${Math.random().toString(36).slice(2, 8)}`,
    expenseDate: source.expenseDate ?? source.expense_date ?? source.fecha ?? todayLocalDate(),
    category: source.category ?? source.categoria ?? source.tipo ?? 'insumos',
    description: source.description ?? source.descripcion ?? source.concepto ?? '',
    amountMxn: Number.isFinite(amountMxn) ? amountMxn : 0,
    paymentMethod: source.paymentMethod ?? source.payment_method ?? source.metodoPago ?? 'cash',
    status,
    notes: source.notes ?? source.notas ?? '',
    createdByUserId: source.createdByUserId ?? source.created_by_user_id ?? source.adminId ?? null,
    createdAt: source.createdAt ?? source.created_at ?? null,
    updatedAt: source.updatedAt ?? source.updated_at ?? null,
    cancelledAt: source.cancelledAt ?? source.cancelled_at ?? null,
    cancelledByUserId: source.cancelledByUserId ?? source.cancelled_by_user_id ?? null,
    cancelReason: source.cancelReason ?? source.cancel_reason ?? '',
    isCancelled: status === 'cancelled',
    isActive: status === 'active',
    raw: source,
  }
}

function createLegacyExpense(form) {
  const created = {
    id: `gasto-${Date.now()}`,
    expenseDate: form.expenseDate,
    category: form.category,
    description: form.description,
    amountMxn: Number(form.amountMxn),
    paymentMethod: form.paymentMethod,
    status: 'active',
    notes: form.notes ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByUserId: null,
    cancelledAt: null,
    cancelledByUserId: null,
    cancelReason: '',
    concept: form.description,
    monto: Number(form.amountMxn),
    tipo: form.category,
    fecha: form.expenseDate,
    hora: new Date().toTimeString().slice(0, 5),
  }
  useGastosStore.setState((state) => ({
    gastos: [...state.gastos, created],
  }))
  return created
}

function updateLegacyExpense(id, form) {
  let updated = null
  useGastosStore.setState((state) => ({
    gastos: state.gastos.map((item) => {
      if (String(item.id) !== String(id)) return item
      updated = {
        ...item,
        expenseDate: form.expenseDate,
        category: form.category,
        description: form.description,
        amountMxn: Number(form.amountMxn),
        paymentMethod: form.paymentMethod,
        notes: form.notes ?? '',
        updatedAt: new Date().toISOString(),
        concept: form.description,
        monto: Number(form.amountMxn),
        tipo: form.category,
        fecha: form.expenseDate,
      }
      return updated
    }),
  }))
  return updated
}

function cancelLegacyExpense(id, reason) {
  let updated = null
  useGastosStore.setState((state) => ({
    gastos: state.gastos.map((item) => {
      if (String(item.id) !== String(id)) return item
      updated = {
        ...item,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: reason || '',
        updatedAt: new Date().toISOString(),
      }
      return updated
    }),
  }))
  return updated
}

function deleteLegacyExpense(id) {
  useGastosStore.setState((state) => ({
    gastos: state.gastos.filter((item) => String(item.id) !== String(id)),
  }))
}

export default function GastosSection({ inPanel = false, isActive = true, useApiMode: useApiModeOverride } = {}) {
  const legacyExpenses = useGastosStore((state) => state.gastos)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [expenseModal, setExpenseModal] = useState(null)
  const [expenseForm, setExpenseForm] = useState({
    expenseDate: todayLocalDate(),
    category: 'insumos',
    description: '',
    amountMxn: '',
    paymentMethod: 'cash',
    notes: '',
  })
  const [detailId, setDetailId] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)

  const apiEnabled = (typeof useApiModeOverride === 'boolean' ? useApiModeOverride : useApiModeDefault) && isActive

  const expensesQuery = useExpensesQuery({
    page,
    pageSize,
    from,
    to,
    category: category === 'all' ? undefined : category,
    status: status === 'all' ? undefined : status,
    paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod,
    enabled: apiEnabled,
  })
  const expenseDetailQuery = useExpenseDetailQuery(detailId, {
    enabled: Boolean(apiEnabled && detailId),
  })
  const createMutation = useCreateExpenseMutation()
  const updateMutation = useUpdateExpenseMutation()
  const cancelMutation = useCancelExpenseMutation()
  const deleteMutation = useDeleteExpenseMutation()

  const apiExpenses = expensesQuery.data?.items ?? []

  const visibleExpenses = useMemo(() => {
    if (apiEnabled) return apiExpenses
    return legacyExpenses
      .map(mapLegacyExpense)
      .filter((expense) => {
        if (from && expense.expenseDate < from) return false
        if (to && expense.expenseDate > to) return false
        if (category !== 'all' && expense.category !== category) return false
        if (status !== 'all' && expense.status !== status) return false
        if (paymentMethod !== 'all' && expense.paymentMethod !== paymentMethod) return false
        return true
      })
  }, [apiEnabled, apiExpenses, legacyExpenses, from, to, category, status, paymentMethod])

  const summary = useMemo(() => {
    const active = visibleExpenses.filter((expense) => expense.status !== 'cancelled')
    const cancelled = visibleExpenses.filter((expense) => expense.status === 'cancelled')
    return {
      activeTotal: active.reduce((sum, expense) => sum + Number(expense.amountMxn ?? 0), 0),
      cancelledTotal: cancelled.reduce((sum, expense) => sum + Number(expense.amountMxn ?? 0), 0),
      count: visibleExpenses.length,
    }
  }, [visibleExpenses])

  const totalPages = apiEnabled ? Math.max(1, Math.ceil((expensesQuery.data?.total ?? 0) / pageSize)) : 1
  const detail = apiEnabled ? expenseDetailQuery.data ?? null : visibleExpenses.find((expense) => String(expense.id) === String(detailId)) ?? null

  const openCreateModal = () => {
    setExpenseModal({ mode: 'create', expense: null })
    setExpenseForm({
      expenseDate: todayLocalDate(),
      category: 'insumos',
      description: '',
      amountMxn: '',
      paymentMethod: 'cash',
      notes: '',
    })
  }

  const openEditModal = (expense) => {
    if (!expense || expense.status === 'cancelled') return
    setExpenseModal({ mode: 'edit', expense })
    setExpenseForm({
      expenseDate: expense.expenseDate ?? todayLocalDate(),
      category: expense.category ?? 'insumos',
      description: expense.description ?? '',
      amountMxn: String(expense.amountMxn ?? ''),
      paymentMethod: expense.paymentMethod ?? 'cash',
      notes: expense.notes ?? '',
    })
  }

  const closeExpenseModal = () => {
    setExpenseModal(null)
    setExpenseForm({
      expenseDate: todayLocalDate(),
      category: 'insumos',
      description: '',
      amountMxn: '',
      paymentMethod: 'cash',
      notes: '',
    })
  }

  const saveExpense = async () => {
    const payload = buildExpenseApiPayload(expenseForm)
    const validationError = validateExpenseApiPayload(payload)
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      if (apiEnabled) {
        if (expenseModal?.mode === 'edit' && expenseModal?.expense?.id) {
          await updateMutation.mutateAsync({
            id: expenseModal.expense.id,
            payload: expenseForm,
          })
          toast.success('Gasto actualizado')
        } else {
          await createMutation.mutateAsync(expenseForm)
          toast.success('Gasto creado')
        }
      } else if (expenseModal?.mode === 'edit' && expenseModal?.expense?.id) {
        updateLegacyExpense(expenseModal.expense.id, expenseForm)
        toast.success('Gasto actualizado')
      } else {
        createLegacyExpense(expenseForm)
        toast.success('Gasto creado')
      }
      closeExpenseModal()
      setPage(1)
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar el gasto')
    }
  }

  const openCancelModal = (expense) => {
    if (!expense || expense.status === 'cancelled') return
    setCancelModal(expense)
    setCancelReason('')
  }

  const confirmCancel = async () => {
    if (!cancelModal?.id) return
    try {
      if (apiEnabled) {
        await cancelMutation.mutateAsync({ id: cancelModal.id, reason: cancelReason })
      } else {
        cancelLegacyExpense(cancelModal.id, cancelReason)
      }
      toast.success('Gasto cancelado')
      setCancelModal(null)
      setCancelReason('')
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo cancelar el gasto')
    }
  }

  const confirmDelete = async () => {
    if (!deleteModal?.id) return
    try {
      if (apiEnabled) {
        await deleteMutation.mutateAsync(deleteModal.id)
      } else {
        deleteLegacyExpense(deleteModal.id)
      }
      toast.success('Gasto eliminado')
      setDeleteModal(null)
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo eliminar el gasto')
    }
  }

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>
        <div className={styles.sectionTopRow}>
          <div>
            <div className={styles.cardTitle} style={{ marginBottom: 4 }}>Gastos operativos</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Gastos activos del día impactan cortes abiertos. Corte cerrado conserva snapshot.
            </div>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={openCreateModal}>
            Nuevo gasto
          </button>
        </div>

        <div className={styles.card} style={{ marginBottom: 16 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Resumen</div>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{summary.count} registros</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Activos', value: money(summary.activeTotal) },
              { label: 'Cancelados', value: money(summary.cancelledTotal) },
              { label: 'Conteo', value: String(summary.count) },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div
                  style={{
                    color: 'var(--muted)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                  }}
                >
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
            <div className={styles.cardTitle}>Listado de gastos</div>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Importes en MXN</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
            <input className={styles.searchInput} type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value) }} />
            <input className={styles.searchInput} type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value) }} />
            <select className={styles.formSelect} value={category} onChange={(event) => { setPage(1); setCategory(event.target.value) }}>
              <option value="all">Todas las categorías</option>
              {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select className={styles.formSelect} value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }}>
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <select className={styles.formSelect} value={paymentMethod} onChange={(event) => { setPage(1); setPaymentMethod(event.target.value) }}>
              <option value="all">Todos los métodos</option>
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>

          {apiEnabled && expensesQuery.isLoading && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Cargando gastos...</div>}
          {apiEnabled && expensesQuery.error && <div style={{ color: '#f87171', marginBottom: 12 }}>{expensesQuery.error.message}</div>}

          <div className={styles.tableWrap}>
            {visibleExpenses.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
                No hay gastos para mostrar.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((expense) => {
                    const disabled = expense.status === 'cancelled'
                    return (
                      <tr key={expense.id ?? `${expense.expenseDate}-${expense.description}`}>
                        <td>{formatDate(expense.expenseDate)}</td>
                        <td>{expense.category}</td>
                        <td>{expense.description}</td>
                        <td>{paymentMethodLabel(expense.paymentMethod)}</td>
                        <td>{money(expense.amountMxn)}</td>
                        <td>{statusLabel(expense.status)}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDetailId(expense.id)}>
                              Ver
                            </button>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnGhost}`}
                              onClick={() => openEditModal(expense)}
                              disabled={disabled}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnGhost}`}
                              onClick={() => openCancelModal(expense)}
                              disabled={disabled}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnGhost}`}
                              onClick={() => setDeleteModal(expense)}
                              disabled={disabled}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {apiEnabled && totalPages > 1 && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              label="Gastos"
              compact
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          )}
        </div>
      </div>

      {expenseModal && createPortal(
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeExpenseModal()
          }}
        >
          <PosEntityModal
            title={expenseModal.mode === 'edit' ? 'Editar gasto' : 'Nuevo gasto'}
            ariaLabel={expenseModal.mode === 'edit' ? 'Editar gasto' : 'Nuevo gasto'}
            onClose={closeExpenseModal}
            footer={(
              <>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={closeExpenseModal}>Cancelar</button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={saveExpense}
                  disabled={apiEnabled && (createMutation.isPending || updateMutation.isPending)}
                >
                  {apiEnabled && (createMutation.isPending || updateMutation.isPending)
                    ? 'Guardando...'
                    : expenseModal.mode === 'edit' ? 'Guardar cambios' : 'Guardar gasto'}
                </button>
              </>
            )}
          >
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="expense-date">Fecha</label>
                <input
                  id="expense-date"
                  className={styles.formInput}
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, expenseDate: event.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="expense-category">Categoría</label>
                <select
                  id="expense-category"
                  className={styles.formSelect}
                  value={expenseForm.category}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label className={styles.formLabel} htmlFor="expense-description">Descripción</label>
                <input
                  id="expense-description"
                  className={styles.formInput}
                  value={expenseForm.description}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Compra de agua y limpieza"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="expense-amount">Monto</label>
                <input
                  id="expense-amount"
                  className={styles.formInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amountMxn}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, amountMxn: event.target.value }))}
                  placeholder="350"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="expense-payment-method">Método de pago</label>
                <select
                  id="expense-payment-method"
                  className={styles.formSelect}
                  value={expenseForm.paymentMethod}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                >
                  {EXPENSE_PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label className={styles.formLabel} htmlFor="expense-notes">Notas</label>
                <textarea
                  id="expense-notes"
                  className={styles.formInput}
                  rows={3}
                  value={expenseForm.notes}
                  onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </PosEntityModal>
        </div>,
        document.body
      )}

      {detailId && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetailId(null)
          }}
        >
          <PosEntityModal
            title="Detalle de gasto"
            ariaLabel="Detalle de gasto"
            onClose={() => setDetailId(null)}
            size="lg"
          >
            {apiEnabled && expenseDetailQuery.isLoading && <div style={{ color: 'var(--muted)' }}>Cargando detalle...</div>}
            {apiEnabled && expenseDetailQuery.error && <div style={{ color: '#f87171' }}>{expenseDetailQuery.error.message}</div>}
            {detail && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Fecha', value: formatDate(detail.expenseDate) },
                    { label: 'Categoría', value: detail.category },
                    { label: 'Descripción', value: detail.description },
                    { label: 'Monto', value: money(detail.amountMxn) },
                    { label: 'Método', value: paymentMethodLabel(detail.paymentMethod) },
                    { label: 'Estado', value: statusLabel(detail.status) },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                      <strong style={{ display: 'block', marginTop: 6 }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className={styles.formGroupFull}>
                  <div className={styles.cardTitle} style={{ marginBottom: 10 }}>Notas</div>
                  <div style={{ color: 'var(--text-primary)' }}>{detail.notes || 'Sin notas'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Creado</div>
                    <strong style={{ display: 'block', marginTop: 6 }}>{formatDateTime(detail.createdAt)}</strong>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actualizado</div>
                    <strong style={{ display: 'block', marginTop: 6 }}>{formatDateTime(detail.updatedAt)}</strong>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cancelado</div>
                    <strong style={{ display: 'block', marginTop: 6 }}>{formatDateTime(detail.cancelledAt)}</strong>
                  </div>
                </div>
              </div>
            )}
          </PosEntityModal>
        </div>
      )}

      {cancelModal && createPortal(
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setCancelModal(null)
          }}
        >
          <PosEntityModal
            title="Cancelar gasto"
            ariaLabel="Cancelar gasto"
            onClose={() => setCancelModal(null)}
            footer={(
              <>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setCancelModal(null)}>Cerrar</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmCancel}>
                  Confirmar cancelación
                </button>
              </>
            )}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ color: 'var(--muted)' }}>
                El gasto dejará de contar para cortes futuros o abiertos, pero conservará historial.
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel} htmlFor="expense-cancel-reason">Motivo opcional</label>
                <textarea
                  id="expense-cancel-reason"
                  className={styles.formInput}
                  rows={3}
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Registro duplicado"
                />
              </div>
            </div>
          </PosEntityModal>
        </div>,
        document.body
      )}

      {deleteModal && createPortal(
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setDeleteModal(null)
          }}
        >
          <PosEntityModal
            title="Eliminar gasto"
            ariaLabel="Eliminar gasto"
            onClose={() => setDeleteModal(null)}
            footer={(
              <>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDeleteModal(null)}>Cancelar</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmDelete}>
                  Eliminar gasto
                </button>
              </>
            )}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ color: 'var(--muted)' }}>
                Esta acción dará de baja lógica el gasto. No se borrará físicamente.
              </div>
            </div>
          </PosEntityModal>
        </div>,
        document.body
      )}
    </>
  )
}
