import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import { useFinancialStateStore } from '@/stores/financialStateStore'

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
    preferenceId: params.get('preference_id'),
  }
}

function resolveExternalReference(search) {
  const params = new URLSearchParams(search)
  const fromQuery = params.get('external_reference')
  if (fromQuery) return fromQuery
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
}

export default function PaymentReturnPage() {
  const location = useLocation()
  const routeKind = useMemo(() => resolveRouteKind(location.pathname), [location.pathname])
  const returnParams = useMemo(() => parseReturnParams(location.search), [location.search])
  const externalReference = useMemo(() => resolveExternalReference(location.search), [location.search])
  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const attemptsRef = useRef(0)
  const timeoutRef = useRef(null)
  const loadFinancialState = useFinancialStateStore((s) => s.loadFinancialState)

  useEffect(() => {
    let active = true

    const stopPolling = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

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
        if (manual) {
          setIsRefreshing(true)
        }
        const data = await getPaymentStatusApi({ externalReference })
        if (!active) return
        setStatusData(data)
        setError('')
        setLoading(false)
        setIsRefreshing(false)

        const shouldKeepPolling =
          data.status === 'created' ||
          data.status === 'pending' ||
          data.status === 'in_process' ||
          (data.status === 'approved' && !data.applied)
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
        setLoading(false)
        setIsRefreshing(false)
      }
    }

    fetchStatus()
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

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>Estado del pago</h1>
      {loading && <p>Cargando estado del pago...</p>}
      {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
      {!loading && !error && (
        <>
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
    </main>
  )
}
