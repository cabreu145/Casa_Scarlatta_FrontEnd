import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import PaginationControls from '@/components/ui/PaginationControls'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import { queryKeys } from '@/api/queryKeys'
import { useMyPaymentsQuery } from '@/hooks/useApiQueries'

const PAGE_SIZE = 10

const PAYMENT_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Acreditados' },
  { value: 'blocked', label: 'No procesados' },
]

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return String(value)
  return `$${numberValue.toLocaleString()} MXN`
}

function formatLastUpdate(item) {
  return item.appliedAt || item.approvedAt || item.updatedAt || item.createdAt || 'Sin fecha'
}

function getPaymentCategory(item = {}) {
  const status = String(item.status ?? '').toLowerCase()
  const applied = Boolean(item.applied)

  if (status === 'approved' && applied) return 'approved'
  if (status === 'failed' || status === 'rejected' || status === 'cancelled') return 'blocked'
  return 'pending'
}

function getFriendlyPaymentState(item = {}) {
  const status = String(item.status ?? '').toLowerCase()
  const applied = Boolean(item.applied)

  if (status === 'approved' && applied) return 'Acreditado'
  if (status === 'approved' && !applied) return 'Aprobado, actualizando créditos'
  if (status === 'pending' || status === 'in_process' || status === 'authorized') return 'Pendiente de acreditación'
  if (status === 'created') return 'Esperando confirmación'
  if (status === 'failed' || status === 'rejected' || status === 'cancelled') return 'No procesado'
  return 'En validación'
}

function getPaymentSupportMessage(item = {}) {
  const paymentMethodId = String(item.paymentMethodId ?? '').toLowerCase()
  const paymentTypeId = String(item.paymentTypeId ?? '').toLowerCase()
  const fingerprint = `${paymentMethodId} ${paymentTypeId}`.trim()

  if (fingerprint.includes('oxxo') || fingerprint.includes('ticket')) {
    return 'Si pagaste en OXXO o tienda autorizada, la acreditación puede tardar de 1 a 2 días hábiles.'
  }
  if (fingerprint.includes('spei') || fingerprint.includes('bank_transfer') || fingerprint.includes('transfer')) {
    return 'Si pagaste por transferencia, la acreditación puede tardar hasta que Mercado Pago confirme la operación.'
  }
  if (
    fingerprint.includes('7eleven') ||
    fingerprint.includes('seven eleven') ||
    fingerprint.includes('circle_k') ||
    fingerprint.includes('soriana') ||
    fingerprint.includes('extra') ||
    fingerprint.includes('calimax') ||
    fingerprint.includes('bbva') ||
    fingerprint.includes('santander')
  ) {
    return 'Si pagaste en tienda autorizada, la acreditación puede tardar entre minutos y horas, según confirmación de Mercado Pago.'
  }
  return 'Tus créditos se acreditarán automáticamente cuando Mercado Pago confirme el pago.'
}

function buildCardCopy(item = {}) {
  const status = String(item.status ?? '').toLowerCase()
  const applied = Boolean(item.applied)

  if (status === 'approved' && applied) {
    return {
      title: 'Pago aprobado',
      message: 'Tus créditos fueron actualizados correctamente.',
      statusLabel: getFriendlyPaymentState(item),
      supportMessage: null,
    }
  }

  if (status === 'approved' && !applied) {
    return {
      title: 'Pago aprobado, actualizando créditos',
      message: 'Mercado Pago ya aprobó tu pago. Estamos terminando de actualizar tus créditos.',
      statusLabel: getFriendlyPaymentState(item),
      supportMessage: getPaymentSupportMessage(item),
    }
  }

  if (status === 'pending' || status === 'in_process' || status === 'authorized') {
    return {
      title: 'Pago pendiente de acreditación',
      message: 'Recibimos tu solicitud de pago. Tus créditos se acreditarán automáticamente cuando Mercado Pago confirme el pago.',
      statusLabel: getFriendlyPaymentState(item),
      supportMessage: getPaymentSupportMessage(item),
    }
  }

  if (status === 'created') {
    return {
      title: 'Pago creado, esperando confirmación',
      message: 'Tu checkout fue creado correctamente. Si ya realizaste el pago, puedes verificar el estado más tarde.',
      statusLabel: getFriendlyPaymentState(item),
      supportMessage: null,
    }
  }

  if (status === 'failed' || status === 'rejected' || status === 'cancelled') {
    return {
      title: 'No pudimos confirmar tu pago',
      message: 'Mercado Pago no pudo procesar esta operación. Tus créditos no fueron modificados.',
      statusLabel: getFriendlyPaymentState(item),
      supportMessage: null,
    }
  }

  return {
    title: 'Estamos consultando el estado real de tu pago.',
    message: '',
    statusLabel: getFriendlyPaymentState(item),
    supportMessage: null,
  }
}

export default function RecentPaymentsStatusPanel({ enabled, onFinancialRefreshRequested }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [refreshingRefs, setRefreshingRefs] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')
  const paymentsQuery = useMyPaymentsQuery({
    page,
    pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
    enabled,
  })
  const items = paymentsQuery.data?.items ?? []
  const total = paymentsQuery.data?.total ?? 0
  const loading = paymentsQuery.isLoading
  const error = paymentsQuery.error?.message ?? ''

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  const visibleItems = useMemo(
    () => items.filter((item) => statusFilter === 'all' || getPaymentCategory(item) === statusFilter),
    [items, statusFilter]
  )

  const refreshOne = useCallback(async (item) => {
    if (!item?.externalReference) return
    setRefreshingRefs((prev) => ({ ...prev, [item.externalReference]: true }))
    try {
      const statusData = await getPaymentStatusApi({ externalReference: item.externalReference })
      if (statusData.status === 'approved' && statusData.applied) {
        onFinancialRefreshRequested?.()
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.myPayments({ page, pageSize, status: statusFilter === 'all' ? 'all' : statusFilter }),
      })
      return statusData
    } catch (err) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.myPayments({ page, pageSize, status: statusFilter === 'all' ? 'all' : statusFilter }),
      })
      return null
    } finally {
      setRefreshingRefs((prev) => ({ ...prev, [item.externalReference]: false }))
    }
  }, [onFinancialRefreshRequested, page, pageSize, queryClient, statusFilter])

  if (!enabled) return null

  return (
    <section style={{
      marginTop: 24,
      padding: 20,
      borderRadius: 24,
      border: '1px solid rgba(42, 26, 31, 0.12)',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>
            Estado de pagos recientes
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Historial  del cliente. Verifica pendientes, acreditados y no procesados.
          </p>
        </div>

        <label style={{ display: 'grid', gap: 4, minWidth: 180, fontSize: 12, color: 'var(--muted)' }}>
          Filtro
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(42, 26, 31, 0.16)',
              padding: '8px 10px',
              background: '#fff',
            }}
          >
            {PAYMENT_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Cargando pagos recientes...</div>}
      {!loading && error && <div style={{ color: '#b42318', fontSize: 13 }}>{error}</div>}
      {!loading && !error && total === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>No tienes pagos recientes en seguimiento.</div>
      )}
      {!loading && !error && total > 0 && visibleItems.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          No hay pagos en esta categoría en esta página. Cambia de filtro o página.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {visibleItems.map((item) => {
          const cardCopy = buildCardCopy(item)
          const isRefreshing = Boolean(refreshingRefs[item.externalReference])
          return (
            <article
              key={item.externalReference}
              style={{
                border: '1px solid rgba(42, 26, 31, 0.12)',
                borderRadius: 18,
                padding: 16,
                background: 'rgba(245, 239, 234, 0.55)',
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.packageName ?? (item.packageId ? `Paquete #${item.packageId}` : 'Paquete')}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {formatCurrency(item.amount)} · {item.credits ?? 'N/A'} créditos
                  </div>
                </div>
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: item.status === 'approved' && item.applied
                    ? 'rgba(22, 163, 74, 0.12)'
                    : item.status === 'failed' || item.status === 'rejected' || item.status === 'cancelled'
                      ? 'rgba(180, 35, 24, 0.12)'
                      : 'rgba(123, 30, 43, 0.12)',
                  color: item.status === 'approved' && item.applied
                    ? '#166534'
                    : item.status === 'failed' || item.status === 'rejected' || item.status === 'cancelled'
                      ? '#b42318'
                      : '#7B1E2B',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {cardCopy.statusLabel}
                </div>
              </div>

              {cardCopy.message && <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{cardCopy.message}</div>}
              {cardCopy.supportMessage && <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{cardCopy.supportMessage}</div>}
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Última actualización: {formatLastUpdate(item)}
              </div>

              {item.statusError && <div style={{ color: '#b42318', fontSize: 13 }}>{item.statusError}</div>}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => refreshOne(item)}
                  disabled={isRefreshing}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(42, 26, 31, 0.16)',
                    background: '#fff',
                  }}
                >
                  {isRefreshing ? 'Verificando...' : 'Verificar estado'}
                </button>
              </div>

              <details style={{
                marginTop: 2,
                borderTop: '1px solid rgba(42, 26, 31, 0.08)',
                paddingTop: 12,
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Detalles técnicos para soporte</summary>
                <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
                  {[
                    ['externalReference', item.externalReference],
                    ['paymentId', item.paymentId],
                    ['preferenceId', item.preferenceId],
                    ['merchantOrderId', item.merchantOrderId],
                    ['paymentMethodId', item.paymentMethodId],
                    ['paymentTypeId', item.paymentTypeId],
                    ['statusDetail', item.statusDetail],
                    ['failureReason', item.failureReason],
                    ['approvedAt', item.approvedAt],
                    ['appliedAt', item.appliedAt],
                    ['createdAt', item.createdAt],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <strong>{label}</strong>
                      <span>{value === null || value === undefined || value === '' ? 'N/A' : String(value)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </article>
          )
        })}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        label="Pagos"
        onPrev={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />
    </section>
  )
}
