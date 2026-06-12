import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import { usePaymentStatusQuery } from '@/hooks/useApiQueries'
import {
  readLastPaymentExternalReference,
  readRecentPaymentReferences,
  upsertRecentPaymentReference,
} from './paymentTracking'
import { resolvePaymentUiState } from './paymentUi'

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

export default function PaymentReturnPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const routeKind = useMemo(() => resolveRouteKind(location.pathname), [location.pathname])
  const returnParams = useMemo(() => parseReturnParams(location.search), [location.search])
  const externalReference = useMemo(() => resolveExternalReference(location.search), [location.search])
  const redirectRef = useRef(null)
  const handledApprovedRef = useRef(false)
  const syncedStatusRef = useRef('')

  const paymentStatusQuery = usePaymentStatusQuery(externalReference, {
    enabled: Boolean(externalReference),
  })

  const statusData = paymentStatusQuery.data ?? null
  const loading = Boolean(externalReference) ? paymentStatusQuery.isLoading : false
  const isRefreshing = Boolean(externalReference)
    ? paymentStatusQuery.isFetching && !paymentStatusQuery.isLoading
    : false
  const error = !externalReference
    ? 'No encontramos la referencia del pago. Revisa tu historial de pagos.'
    : (paymentStatusQuery.error?.message ?? '')

  const recentReference = useMemo(() => {
    const items = readRecentPaymentReferences()
    return items.find((item) => item.externalReference === externalReference) ?? null
  }, [externalReference])

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

  function stopRedirectTimer() {
    if (redirectRef.current) {
      clearTimeout(redirectRef.current)
      redirectRef.current = null
    }
  }

  function scheduleRedirectToPagos() {
    stopRedirectTimer()
    redirectRef.current = setTimeout(() => {
      navigate('/cliente/dashboard', { replace: true })
    }, 2600)
  }

  useEffect(() => {
    if (!statusData) return

    const statusFingerprint = JSON.stringify([
      statusData.externalReference ?? externalReference,
      statusData.status ?? '',
      Boolean(statusData.applied),
      statusData.paymentId ?? '',
      statusData.appliedAt ?? '',
    ])

    if (syncedStatusRef.current === statusFingerprint) return
    syncedStatusRef.current = statusFingerprint

    upsertRecentPaymentReference({
      externalReference: statusData.externalReference ?? externalReference,
      packageId: statusData.packageId ?? recentReference?.packageId ?? null,
      packageName: recentReference?.packageName ?? null,
      amount: statusData.amount ?? recentReference?.amount ?? null,
      credits: statusData.credits ?? recentReference?.credits ?? null,
      status: statusData.status ?? null,
      applied: statusData.applied ?? null,
      paymentMethodId: statusData.paymentMethodId ?? null,
      paymentTypeId: statusData.paymentTypeId ?? null,
      statusDetail: statusData.statusDetail ?? null,
      failureReason: statusData.failureReason ?? null,
      paymentId: statusData.paymentId ?? null,
      preferenceId: statusData.preferenceId ?? null,
      merchantOrderId: statusData.merchantOrderId ?? null,
      approvedAt: statusData.approvedAt ?? null,
      appliedAt: statusData.appliedAt ?? null,
    })
  }, [externalReference, recentReference, statusData])

  useEffect(() => {
    if (handledApprovedRef.current) return
    if (!statusData) return
    if (statusData.status !== 'approved' || !statusData.applied) return

    handledApprovedRef.current = true

    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myPayments() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.list() }),
    ]).catch(() => {})

    scheduleRedirectToPagos()
  }, [queryClient, statusData])

  useEffect(() => () => {
    stopRedirectTimer()
  }, [])

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
                  paymentStatusQuery.refetch()
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
              <Link to="/cliente/dashboard">Ir a Paquetes & Pagos</Link>
            ) : (
              <>
                <Link to="/cliente/dashboard">Volver a Paquetes & Pagos</Link>
                {canShowRetry && (
                  <Link to="/cliente/dashboard">Intentar nuevamente</Link>
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
