import { useEffect, useMemo, useRef, useState } from 'react'
<<<<<<< HEAD
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import { useFinancialStateStore } from '@/stores/financialStateStore'
import {
  readLastPaymentExternalReference,
  readRecentPaymentReferences,
  upsertRecentPaymentReference,
} from './paymentTracking'
import { resolvePaymentUiState } from './paymentUi'
=======
import { Link, useLocation } from 'react-router-dom'
import { getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import { useFinancialStateStore } from '@/stores/financialStateStore'
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)

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
<<<<<<< HEAD
    paymentTypeId: params.get('payment_type_id'),
=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    preferenceId: params.get('preference_id'),
  }
}

function resolveExternalReference(search) {
  const params = new URLSearchParams(search)
  const fromQuery = params.get('external_reference')
  if (fromQuery) return fromQuery
<<<<<<< HEAD
  return readLastPaymentExternalReference()
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return String(value)
  return `$${numberValue.toLocaleString()} MXN`
=======
  return sessionStorage.getItem('last_payment_external_reference')
}

function isNullLike(value) {
  return value === null || value === undefined || value === '' || value === 'null'
}

function buildPendingSupportMessage(statusData) {
  const paymentMethodId = String(statusData.paymentMethodId ?? '').toLowerCase()
  const paymentTypeId = String(statusData.paymentTypeId ?? '').toLowerCase()
  const paymentMethod = String(statusData.paymentMethod ?? '').toLowerCase()
  const paymentType = String(statusData.paymentType ?? '').toLowerCase()
  const fingerprint = [paymentMethodId, paymentTypeId, paymentMethod, paymentType].join(' ')

  if (fingerprint.includes('oxxo')) {
    return 'La acreditación puede tardar de 1 a 2 días hábiles.'
  }
  if (
    fingerprint.includes('spei') ||
    fingerprint.includes('bank_transfer') ||
    fingerprint.includes('transfer') ||
    fingerprint.includes('cash') ||
    fingerprint.includes('ticket') ||
    fingerprint.includes('7eleven') ||
    fingerprint.includes('seven eleven') ||
    fingerprint.includes('circle_k') ||
    fingerprint.includes('soriana') ||
    fingerprint.includes('extra') ||
    fingerprint.includes('calimax') ||
    fingerprint.includes('bbva') ||
    fingerprint.includes('santander')
  ) {
    return 'La acreditación puede tardar hasta que Mercado Pago confirme el pago.'
  }
  return 'Tus créditos se actualizarán automáticamente cuando Mercado Pago confirme la acreditación.'
}

function resolveUiState(statusData, routeKind, returnParams) {
  const status = statusData?.status
  const applied = Boolean(statusData?.applied)
  const failedByProviderReturn =
    routeKind === 'failure' &&
    isNullLike(returnParams.paymentId) &&
    (
      returnParams.paymentStatus === 'failed' ||
      returnParams.paymentStatusDetail === 'payment_creation_failed' ||
      returnParams.collectionStatus === 'null' ||
      returnParams.status === 'null'
    )

  if (status === 'approved' && applied) {
    return {
      tone: 'success',
      title: 'Pago aprobado. Tus créditos fueron actualizados.',
      detail: '',
      allowPolling: false,
      allowManualRefresh: false,
      canRetry: false,
    }
  }
  if (status === 'approved' && !applied) {
    return {
      tone: 'info',
      title: 'Tu pago fue aprobado, pero estamos terminando de actualizar tus créditos.',
      detail: 'Presiona verificar estado en unos segundos.',
      allowPolling: true,
      allowManualRefresh: true,
      canRetry: false,
    }
  }
  if (status === 'pending' || status === 'in_process') {
    return {
      tone: 'info',
      title: 'Tu pago está pendiente de confirmación.',
      detail: buildPendingSupportMessage(statusData),
      allowPolling: true,
      allowManualRefresh: true,
      canRetry: false,
    }
  }
  if (status === 'created' && failedByProviderReturn) {
    return {
      tone: 'danger',
      title: 'Mercado Pago no pudo procesar tu pago.',
      detail: 'Tus créditos no fueron modificados. Puedes intentar con otro medio de pago.',
      allowPolling: false,
      allowManualRefresh: true,
      canRetry: true,
    }
  }
  if (status === 'created' && !applied) {
    return {
      tone: 'info',
      title: 'Pago creado, esperando confirmación.',
      detail: 'Si ya realizaste el pago, puedes verificar el estado más tarde.',
      allowPolling: true,
      allowManualRefresh: true,
      canRetry: false,
    }
  }
  if (status === 'rejected' || status === 'failed' || status === 'cancelled') {
    return {
      tone: 'danger',
      title: 'Mercado Pago no pudo procesar tu pago.',
      detail: 'Tus créditos no fueron modificados. Puedes intentar con otro medio de pago.',
      allowPolling: false,
      allowManualRefresh: false,
      canRetry: true,
    }
  }
  return {
    tone: 'info',
    title: 'Estamos consultando el estado real de tu pago.',
    detail: '',
    allowPolling: false,
    allowManualRefresh: true,
    canRetry: false,
  }
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return String(value)
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
}

export default function PaymentReturnPage() {
  const location = useLocation()
<<<<<<< HEAD
  const navigate = useNavigate()
  const routeKind = useMemo(() => resolveRouteKind(location.pathname), [location.pathname])
  const returnParams = useMemo(() => parseReturnParams(location.search), [location.search])
  const externalReference = useMemo(() => resolveExternalReference(location.search), [location.search])

=======
  const routeKind = useMemo(() => resolveRouteKind(location.pathname), [location.pathname])
  const returnParams = useMemo(() => parseReturnParams(location.search), [location.search])
  const externalReference = useMemo(() => resolveExternalReference(location.search), [location.search])
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const attemptsRef = useRef(0)
  const timeoutRef = useRef(null)
<<<<<<< HEAD
  const redirectRef = useRef(null)
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

=======
  const loadFinancialState = useFinancialStateStore((s) => s.loadFinancialState)

  useEffect(() => {
    let active = true

    const stopPolling = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    const refreshFinancial = async () => {
      await loadFinancialState().catch(() => {})
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
<<<<<<< HEAD
        if (manual) setIsRefreshing(true)

        const data = await getPaymentStatusApi({ externalReference })
        if (!active) return

=======
        if (manual) {
          setIsRefreshing(true)
        }
        const data = await getPaymentStatusApi({ externalReference })
        if (!active) return
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
        setStatusData(data)
        setError('')
        setLoading(false)
        setIsRefreshing(false)

<<<<<<< HEAD
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

=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
        const shouldKeepPolling =
          data.status === 'created' ||
          data.status === 'pending' ||
          data.status === 'in_process' ||
          (data.status === 'approved' && !data.applied)
<<<<<<< HEAD

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
=======
        if (data.status === 'approved' && data.applied) {
          await refreshFinancial()
        }
        if (shouldKeepPolling && attemptsRef.current < MAX_POLL_ATTEMPTS) {
          attemptsRef.current += 1
          timeoutRef.current = setTimeout(fetchStatus, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (!active) return
        setError(err.message || 'No se pudo consultar estado de pago')
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
        setLoading(false)
        setIsRefreshing(false)
      }
    }

    fetchStatus()
<<<<<<< HEAD

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
=======
    return () => {
      active = false
      stopPolling()
    }
  }, [externalReference, loadFinancialState])

  const uiState = resolveUiState(statusData, routeKind, returnParams)
  const canRetry = uiState.canRetry
  const canManualRefresh = !loading && !error && Boolean(externalReference) && uiState.allowManualRefresh
  const evidenceRows = [
    ['Referencia', statusData?.externalReference ?? externalReference],
    ['Estado', statusData?.status],
    ['Aplicado', statusData?.applied],
    ['Paquete', statusData?.packageId],
    ['Monto', statusData?.amount],
    ['Créditos', statusData?.credits],
    ['Método de pago', statusData?.paymentMethod ?? statusData?.paymentMethodId],
    ['Tipo de pago', statusData?.paymentType ?? statusData?.paymentTypeId],
    ['Detalle de estado', statusData?.statusDetail],
    ['Aprobado en', statusData?.approvedAt],
    ['Aplicado en', statusData?.appliedAt],
  ]
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Estado del pago</h1>
      {loading && <p>Cargando estado del pago...</p>}
      {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
      {!loading && !error && (
        <>
<<<<<<< HEAD
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
                        await loadFinancialState().catch(() => {})
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
=======
          <p>{uiState.title}</p>
          {uiState.detail && <p style={{ color: 'var(--muted)' }}>{uiState.detail}</p>}
          <div style={{
            border: '1px solid rgba(42, 26, 31, 0.12)',
            borderRadius: 16,
            padding: 16,
            background: 'rgba(245, 239, 234, 0.55)',
            display: 'grid',
            gap: 10,
            marginTop: 16,
          }}>
            {evidenceRows.map(([label, value]) => (
              <div
                key={label}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14 }}
              >
                <strong>{label}</strong>
                <span>{formatFieldValue(value)}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              attemptsRef.current = 0
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
              setError('')
              setIsRefreshing(true)
              getPaymentStatusApi({ externalReference })
                .then(async (data) => {
                  setStatusData(data)
                  setIsRefreshing(false)
                  if (data.status === 'approved' && data.applied) {
                    await loadFinancialState().catch(() => {})
                    await getMyCreditMovementsPaginatedApi({ page: 1, pageSize: 8 }).catch(() => {})
                  }
                })
                .catch((err) => {
                  setError(err.message || 'No se pudo consultar estado de pago')
                  setIsRefreshing(false)
                })
            }}
            disabled={!canManualRefresh || isRefreshing}
            style={{
              marginTop: 16,
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid rgba(42, 26, 31, 0.16)',
              background: '#fff',
              cursor: canManualRefresh && !isRefreshing ? 'pointer' : 'default',
            }}
          >
            {isRefreshing ? 'Verificando...' : 'Verificar estado del pago'}
          </button>
        </>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <Link to="/cliente/dashboard">Volver a Paquetes & Pagos</Link>
        {canRetry && <Link to="/cliente/dashboard">Reintentar compra</Link>}
      </div>
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    </main>
  )
}
