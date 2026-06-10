import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import { getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import { useFinancialStateStore } from '@/stores/financialStateStore'
import {
  readLastPaymentExternalReference,
  readRecentPaymentReferences,
  upsertRecentPaymentReference,
} from './paymentTracking'
import { resolvePaymentUiState } from './paymentUi'

const POLL_INTERVAL_MS = 4000
const MAX_POLL_ATTEMPTS = 6

function resolveRouteKind(pathname) {
  if (pathname.endsWith('/pago/success')) return 'success'
  if (pathname.endsWith('/pago/pending')) return 'pending'
  if (pathname.endsWith('/pago/failure')) return 'failure'
  return 'unknown'
}

function parseReturnParams(search) {
  const params = new URLSearchParams(search)
  return {
    paymentId: params.get('payment_id'),
    status: params.get('status'),
    collectionStatus: params.get('collection_status'),
    paymentStatus: params.get('payment_status'),
    paymentStatusDetail: params.get('payment_status_detail'),
    paymentMethodId: params.get('payment_method_id'),
    paymentTypeId: params.get('payment_type_id'),
    preferenceId: params.get('preference_id'),
  }
}

function resolveExternalReference(search) {
  const params = new URLSearchParams(search)
  const fromQuery = params.get('external_reference')
  if (fromQuery) return fromQuery
  return readLastPaymentExternalReference()
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return String(value)
  return `$${numberValue.toLocaleString()} MXN`
}

function useOptionalQueryClient() {
  try {
    return useQueryClient()
  } catch {
    return null
  }
}

export default function PaymentReturnPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeKind = useMemo(() => resolveRouteKind(location.pathname), [location.pathname])
  const returnParams = useMemo(() => parseReturnParams(location.search), [location.search])
  const externalReference = useMemo(() => resolveExternalReference(location.search), [location.search])

  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const attemptsRef = useRef(0)
  const timeoutRef = useRef(null)
  const redirectRef = useRef(null)
  const queryClient = useOptionalQueryClient()
  const loadFinancialState = useFinancialStateStore((s) => s.loadFinancialState)

  const recentReference = useMemo(() => {
    const items = readRecentPaymentReferences()
    return items.find((item) => item.externalReference === externalReference) ?? null
  }, [externalReference, statusData])

  const uiState = useMemo(
    () => resolvePaymentUiState({ statusData, routeKind, returnParams }),
    [statusData, routeKind, returnParams]
  )

  const paymentSummary = useMemo(() => ({
    packageLabel:
      recentReference?.packageName ??
      (statusData?.packageId ? `Paquete #${statusData.packageId}` : 'Paquete'),
    credits: recentReference?.credits ?? statusData?.credits ?? null,
    amount: recentReference?.amount ?? statusData?.amount ?? null,
  }), [recentReference, statusData])

  const technicalRows = [
    ['externalReference', statusData?.externalReference ?? externalReference],
    ['status', statusData?.status],
    ['applied', statusData?.applied],
    ['paymentId', statusData?.paymentId],
    ['preferenceId', statusData?.preferenceId],
    ['merchantOrderId', statusData?.merchantOrderId],
    ['paymentMethodId', statusData?.paymentMethodId],
    ['paymentTypeId', statusData?.paymentTypeId],
    ['statusDetail', statusData?.statusDetail],
    ['failureReason', statusData?.failureReason],
    ['approvedAt', statusData?.approvedAt],
    ['appliedAt', statusData?.appliedAt],
  ]

  const stopTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (redirectRef.current) {
      clearTimeout(redirectRef.current)
      redirectRef.current = null
    }
  }

  const scheduleRedirectToPagos = () => {
    if (redirectRef.current) {
      clearTimeout(redirectRef.current)
      redirectRef.current = null
    }
    redirectRef.current = setTimeout(() => {
      navigate('/cliente/dashboard?section=pagos', { replace: true })
    }, 2600)
  }

  useEffect(() => {
    let active = true

    const refreshFinancial = async () => {
      if (queryClient) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
          queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
          queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.myPayments() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.activity.list() }),
        ])
      }
      await loadFinancialState({ force: true, enabled: true }).catch(() => {})
      await getMyCreditMovementsPaginatedApi({ page: 1, pageSize: 8 }).catch(() => {})
    }

    const fetchStatus = async ({ manual = false } = {}) => {
      if (!externalReference) {
        if (!active) return
        setError('No pudimos identificar la referencia del pago. Vuelve a Paquetes & Pagos e intenta nuevamente.')
        setLoading(false)
        setIsRefreshing(false)
        return
      }

      try {
        if (manual) setIsRefreshing(true)

        const data = await getPaymentStatusApi({ externalReference })
        if (!active) return

        setStatusData(data)
        setError('')
        setLoading(false)
        setIsRefreshing(false)

        upsertRecentPaymentReference({
          externalReference: data.externalReference ?? externalReference,
          packageId: data.packageId ?? recentReference?.packageId ?? null,
          packageName: recentReference?.packageName ?? null,
          amount: data.amount ?? recentReference?.amount ?? null,
          credits: data.credits ?? recentReference?.credits ?? null,
          status: data.status ?? null,
          applied: data.applied ?? null,
          paymentMethodId: data.paymentMethodId ?? null,
          paymentTypeId: data.paymentTypeId ?? null,
          statusDetail: data.statusDetail ?? null,
          failureReason: data.failureReason ?? null,
          paymentId: data.paymentId ?? null,
          preferenceId: data.preferenceId ?? null,
          merchantOrderId: data.merchantOrderId ?? null,
          approvedAt: data.approvedAt ?? null,
          appliedAt: data.appliedAt ?? null,
        })

        const shouldKeepPolling =
          data.status === 'created' ||
          data.status === 'pending' ||
          data.status === 'in_process' ||
          (data.status === 'approved' && !data.applied)

        if (data.status === 'approved' && data.applied) {
          await refreshFinancial()
          scheduleRedirectToPagos()
        }

        if (shouldKeepPolling && attemptsRef.current < MAX_POLL_ATTEMPTS) {
          attemptsRef.current += 1
          timeoutRef.current = setTimeout(() => fetchStatus(), POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (!active) return
        setError(err?.message || 'No se pudo consultar estado de pago')
        setLoading(false)
        setIsRefreshing(false)
      }
    }

    fetchStatus()

    return () => {
      active = false
      stopTimers()
    }
  }, [externalReference, loadFinancialState, navigate])

  const canManualRefresh = !loading && !error && Boolean(externalReference) && uiState.allowManualRefresh
  const canShowRetry = uiState.canRetry
  const statusChipClass = uiState.tone === 'success'
    ? { background: 'rgba(22, 163, 74, 0.12)', color: '#166534' }
    : uiState.tone === 'danger'
      ? { background: 'rgba(180, 35, 24, 0.12)', color: '#b42318' }
      : { background: 'rgba(123, 30, 43, 0.12)', color: '#7B1E2B' }

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Estado del pago</h1>
      {loading && <p>Cargando estado del pago...</p>}
      {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
      {!loading && !error && (
        <>
          <section style={{
            border: '1px solid rgba(42, 26, 31, 0.12)',
            borderRadius: 20,
            padding: 20,
            background: 'rgba(245, 239, 234, 0.72)',
            marginTop: 16,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              ...statusChipClass,
            }}>
              {uiState.statusLabel}
            </div>

            <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', fontWeight: 400 }}>
              {uiState.title}
            </h2>
            {uiState.message && <p style={{ margin: 0, lineHeight: 1.55 }}>{uiState.message}</p>}
            {uiState.supportMessage && <p style={{ margin: '8px 0 0', color: 'var(--muted)', lineHeight: 1.55 }}>{uiState.supportMessage}</p>}

            <div style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              marginTop: 20,
            }}>
              <div style={{ padding: 12, borderRadius: 16, background: '#fff', border: '1px solid rgba(42, 26, 31, 0.08)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Paquete</div>
                <div style={{ fontWeight: 600 }}>{paymentSummary.packageLabel}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 16, background: '#fff', border: '1px solid rgba(42, 26, 31, 0.08)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Créditos</div>
                <div style={{ fontWeight: 600 }}>{paymentSummary.credits ?? 'N/A'}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 16, background: '#fff', border: '1px solid rgba(42, 26, 31, 0.08)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Monto</div>
                <div style={{ fontWeight: 600 }}>{formatCurrency(paymentSummary.amount)}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 16, background: '#fff', border: '1px solid rgba(42, 26, 31, 0.08)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Estado amigable</div>
                <div style={{ fontWeight: 600 }}>{uiState.statusLabel}</div>
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {(uiState.allowManualRefresh || isRefreshing) && (
              <button
                type="button"
        onClick={() => {
                  attemptsRef.current = 0
                  stopTimers()
                  setError('')
                  setIsRefreshing(true)
                  getPaymentStatusApi({ externalReference })
                    .then(async (data) => {
                      setStatusData(data)
                      setIsRefreshing(false)

                      upsertRecentPaymentReference({
                        externalReference: data.externalReference ?? externalReference,
                        packageId: data.packageId ?? recentReference?.packageId ?? null,
                        packageName: recentReference?.packageName ?? null,
                        amount: data.amount ?? recentReference?.amount ?? null,
                        credits: data.credits ?? recentReference?.credits ?? null,
                        status: data.status ?? null,
                        applied: data.applied ?? null,
                        paymentMethodId: data.paymentMethodId ?? null,
                        paymentTypeId: data.paymentTypeId ?? null,
                        statusDetail: data.statusDetail ?? null,
                        failureReason: data.failureReason ?? null,
                        paymentId: data.paymentId ?? null,
                        preferenceId: data.preferenceId ?? null,
                        merchantOrderId: data.merchantOrderId ?? null,
                        approvedAt: data.approvedAt ?? null,
                        appliedAt: data.appliedAt ?? null,
                      })

                      if (data.status === 'approved' && data.applied) {
                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.myPayments() }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() }),
                          queryClient.invalidateQueries({ queryKey: queryKeys.activity.list() }),
                        ])
                        await loadFinancialState({ force: true, enabled: true }).catch(() => {})
                        await getMyCreditMovementsPaginatedApi({ page: 1, pageSize: 8 }).catch(() => {})
                        scheduleRedirectToPagos()
                      }
                    })
                    .catch((err) => {
                      setError(err?.message || 'No se pudo consultar estado de pago')
                      setIsRefreshing(false)
                    })
                }}
                disabled={!canManualRefresh || isRefreshing}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(42, 26, 31, 0.16)',
                  background: '#fff',
                  cursor: canManualRefresh && !isRefreshing ? 'pointer' : 'default',
                }}
              >
                {isRefreshing ? 'Verificando...' : 'Verificar estado del pago'}
              </button>
            )}

            {uiState.canRedirectToDashboard ? (
              <Link to="/cliente/dashboard?section=pagos">Ir a Paquetes & Pagos</Link>
            ) : (
              <>
                <Link to="/cliente/dashboard?section=pagos">Volver a Paquetes & Pagos</Link>
                {canShowRetry && (
                  <Link to="/cliente/dashboard?section=pagos">Intentar nuevamente</Link>
                )}
              </>
            )}
          </div>

          <details style={{
            marginTop: 20,
            border: '1px solid rgba(42, 26, 31, 0.12)',
            borderRadius: 16,
            padding: 16,
            background: '#fff',
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Detalles técnicos para soporte</summary>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {technicalRows.map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14 }}>
                  <strong>{label}</strong>
                  <span>{value === null || value === undefined || value === '' ? 'N/A' : String(value)}</span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </main>
  )
}
