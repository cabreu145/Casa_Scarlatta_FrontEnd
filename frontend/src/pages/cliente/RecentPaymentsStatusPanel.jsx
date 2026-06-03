import { useEffect, useMemo, useState } from 'react'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import {
  readRecentPaymentReferences,
  removeRecentPaymentReference,
  upsertRecentPaymentReference,
} from '@/features/pagos/paymentTracking'
import { getFriendlyPaymentState, resolvePaymentUiState } from '@/features/pagos/paymentUi'

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return String(value)
  return `$${numberValue.toLocaleString()} MXN`
}

function formatLastUpdate(item) {
  return item.appliedAt || item.approvedAt || item.updatedAt || item.createdAt || 'Sin fecha'
}

export default function RecentPaymentsStatusPanel({ enabled, onFinancialRefreshRequested }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshingRefs, setRefreshingRefs] = useState({})
  const [openDetails, setOpenDetails] = useState({})

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    [items]
  )

  const syncItem = (reference, statusData) => {
    const mergedList = upsertRecentPaymentReference({
      externalReference: reference.externalReference,
      packageId: statusData.packageId ?? reference.packageId ?? null,
      packageName: reference.packageName ?? null,
      amount: statusData.amount ?? reference.amount ?? null,
      credits: statusData.credits ?? reference.credits ?? null,
      status: statusData.status ?? reference.status ?? null,
      applied: statusData.applied ?? reference.applied ?? null,
      paymentMethodId: statusData.paymentMethodId ?? reference.paymentMethodId ?? null,
      paymentTypeId: statusData.paymentTypeId ?? reference.paymentTypeId ?? null,
      statusDetail: statusData.statusDetail ?? reference.statusDetail ?? null,
      failureReason: statusData.failureReason ?? reference.failureReason ?? null,
      paymentId: statusData.paymentId ?? reference.paymentId ?? null,
      preferenceId: statusData.preferenceId ?? reference.preferenceId ?? null,
      merchantOrderId: statusData.merchantOrderId ?? reference.merchantOrderId ?? null,
      approvedAt: statusData.approvedAt ?? reference.approvedAt ?? null,
      appliedAt: statusData.appliedAt ?? reference.appliedAt ?? null,
      createdAt: reference.createdAt ?? null,
    })
    setItems(mergedList)
    return mergedList.find((item) => item.externalReference === reference.externalReference) ?? reference
  }

  const refreshOne = async (reference) => {
    if (!reference?.externalReference) return
    setRefreshingRefs((prev) => ({ ...prev, [reference.externalReference]: true }))
    try {
      const statusData = await getPaymentStatusApi({ externalReference: reference.externalReference })
      const merged = syncItem(reference, statusData)
      if (statusData.status === 'approved' && statusData.applied) {
        onFinancialRefreshRequested?.()
      }
      return merged
    } catch (err) {
      setError(err?.message || 'No se pudo consultar estado de pago')
      return null
    } finally {
      setRefreshingRefs((prev) => ({ ...prev, [reference.externalReference]: false }))
    }
  }

  useEffect(() => {
    if (!enabled) return
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const stored = readRecentPaymentReferences()
        if (!active) return
        if (!stored.length) {
          setItems([])
          return
        }
        const results = await Promise.all(stored.map(async (reference) => {
          try {
            const statusData = await getPaymentStatusApi({ externalReference: reference.externalReference })
            return syncItem(reference, statusData)
          } catch (err) {
            return {
              ...reference,
              status: reference.status ?? null,
              statusError: err?.message || 'No se pudo consultar estado de pago',
            }
          }
        }))
        if (!active) return
        setItems(results)
        const approvedApplied = results.some((item) => item.status === 'approved' && item.applied)
        if (approvedApplied) {
          onFinancialRefreshRequested?.()
        }
      } catch (err) {
        if (!active) return
        setError(err?.message || 'No se pudo cargar historial local de pagos')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [enabled, onFinancialRefreshRequested])

  if (!enabled) return null

  return (
    <section style={{
      marginTop: 24,
      padding: 20,
      borderRadius: 24,
      border: '1px solid rgba(42, 26, 31, 0.12)',
      background: '#fff',
    }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>
          Estado de pagos recientes
        </h2>
        
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Cargando pagos recientes...</div>}
      {!loading && error && <div style={{ color: '#b42318', fontSize: 13 }}>{error}</div>}
      {!loading && !error && orderedItems.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>No tienes pagos recientes en seguimiento.</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {orderedItems.map((item) => {
          const liveState = getFriendlyPaymentState(item)
          const panelState = resolvePaymentUiState({ statusData: item })
          const isRefreshing = Boolean(refreshingRefs[item.externalReference])
          const hasTechOpen = Boolean(openDetails[item.externalReference])
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
                  {liveState}
                </div>
              </div>

              {panelState.message && <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{panelState.message}</div>}
              {panelState.supportMessage && <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{panelState.supportMessage}</div>}
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
                <button
                  type="button"
                  onClick={() => setOpenDetails((prev) => ({ ...prev, [item.externalReference]: !prev[item.externalReference] }))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(42, 26, 31, 0.16)',
                    background: '#fff',
                  }}
                >
                  {hasTechOpen ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
                <button
                  type="button"
                  onClick={() => setItems(removeRecentPaymentReference(item.externalReference))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(42, 26, 31, 0.16)',
                    background: '#fff',
                  }}
                >
                  Quitar de la lista
                </button>
              </div>

              {hasTechOpen && (
                <details open style={{
                  marginTop: 2,
                  borderTop: '1px solid rgba(42, 26, 31, 0.08)',
                  paddingTop: 12,
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Detalles técnicos para soporte</summary>
                  <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
                    {[
                      ['externalReference', item.externalReference],
                      ['status', item.status],
                      ['applied', item.applied],
                      ['paymentId', item.paymentId],
                      ['preferenceId', item.preferenceId],
                      ['merchantOrderId', item.merchantOrderId],
                      ['paymentMethodId', item.paymentMethodId],
                      ['paymentTypeId', item.paymentTypeId],
                      ['statusDetail', item.statusDetail],
                      ['failureReason', item.failureReason],
                      ['approvedAt', item.approvedAt],
                      ['appliedAt', item.appliedAt],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <strong>{label}</strong>
                        <span>{value === null || value === undefined || value === '' ? 'N/A' : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
