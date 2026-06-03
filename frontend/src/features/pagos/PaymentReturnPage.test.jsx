<<<<<<< HEAD
import { render, screen, waitFor, act } from '@testing-library/react'
=======
import { render, screen, waitFor } from '@testing-library/react'
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

<<<<<<< HEAD
const navigateMock = vi.fn()
=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
const getPaymentStatusMock = vi.fn()
const getCreditMovementsMock = vi.fn()
const loadFinancialStateMock = vi.fn()

<<<<<<< HEAD
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
vi.mock('@/services/paymentsApiService', () => ({
  getPaymentStatusApi: (...args) => getPaymentStatusMock(...args),
}))

vi.mock('@/services/financialStateApiService', () => ({
  getMyCreditMovementsPaginatedApi: (...args) => getCreditMovementsMock(...args),
}))

vi.mock('@/stores/financialStateStore', () => ({
  useFinancialStateStore: (selector) =>
    selector({
      loadFinancialState: loadFinancialStateMock,
    }),
}))

describe('PaymentReturnPage', () => {
  beforeEach(() => {
<<<<<<< HEAD
    navigateMock.mockReset()
    getPaymentStatusMock.mockReset()
    getCreditMovementsMock.mockReset()
    loadFinancialStateMock.mockReset()
    localStorage.clear()
    sessionStorage.clear()
    vi.useRealTimers()
=======
    getPaymentStatusMock.mockReset()
    getCreditMovementsMock.mockReset()
    loadFinancialStateMock.mockReset()
    sessionStorage.clear()
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  })

  test('consulta estado real y no asume aprobado por /success', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref123',
      status: 'pending',
      applied: false,
<<<<<<< HEAD
      paymentMethodId: 'oxxo',
=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/success?external_reference=ref123']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledWith({ externalReference: 'ref123' })
    })
<<<<<<< HEAD
    expect(await screen.findByText(/Pago pendiente de acreditación/i)).toBeInTheDocument()
    expect(screen.getByText(/1 a 2 días hábiles/i)).toBeInTheDocument()
    expect(screen.queryByText(/Detalles técnicos para soporte/i)).toBeInTheDocument()
  })

  test('pending genérico no inventa OXXO', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-generic',
      status: 'pending',
      applied: false,
    })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/pending?external_reference=ref-generic']}>
=======
    expect(screen.getByText(/pendiente de confirmación/i)).toBeInTheDocument()
  })

  test('approved + applied refresca estado financiero', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref999',
      status: 'approved',
      applied: true,
    })
    loadFinancialStateMock.mockResolvedValue({})
    getCreditMovementsMock.mockResolvedValue({ items: [], page: 1, pageSize: 8, total: 0 })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/success?external_reference=ref999']}>
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
        <PaymentReturnPage />
      </MemoryRouter>
    )

<<<<<<< HEAD
    expect(await screen.findByText(/Pago pendiente de acreditación/i)).toBeInTheDocument()
    expect(screen.getByText(/Este proceso puede tardar unos minutos u horas/i)).toBeInTheDocument()
  })

  test('created muestra confirmacion pendiente', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-created',
      status: 'created',
      applied: false,
    })
=======
    await waitFor(() => {
      expect(loadFinancialStateMock).toHaveBeenCalled()
      expect(getCreditMovementsMock).toHaveBeenCalled()
    })
    expect(screen.getByText(/Pago aprobado\. Tus créditos fueron actualizados/i)).toBeInTheDocument()
  })

  test('created no se marca como exito y permite revalidaci?n manual', async () => {
    getPaymentStatusMock
      .mockResolvedValueOnce({
        externalReference: 'ref-created',
        status: 'created',
        applied: false,
      })
      .mockResolvedValueOnce({
        externalReference: 'ref-created',
        status: 'approved',
        applied: true,
      })
    loadFinancialStateMock.mockResolvedValue({})
    getCreditMovementsMock.mockResolvedValue({ items: [], page: 1, pageSize: 8, total: 0 })
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/success?external_reference=ref-created']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Pago creado, esperando confirmación/i)).toBeInTheDocument()
<<<<<<< HEAD
    expect(screen.getByRole('button', { name: /Verificar estado del pago/i })).toBeInTheDocument()
    expect(screen.getByText(/Volver a Paquetes & Pagos/i)).toBeInTheDocument()
=======
    await userEvent.click(screen.getByRole('button', { name: /Verificar estado del pago/i }))

    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledTimes(2)
      expect(loadFinancialStateMock).toHaveBeenCalled()
    })
  })

  test('pending e in_process muestran espera controlada sin exito', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-process',
      status: 'in_process',
      applied: false,
    })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/pending?external_reference=ref-process']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

    expect(await screen.findByText(/pendiente de confirmación/i)).toBeInTheDocument()
    expect(screen.getByText(/se actualizarán automáticamente/i)).toBeInTheDocument()
    expect(screen.queryByText(/créditos fueron actualizados/i)).not.toBeInTheDocument()
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  })

  test('approved sin applied muestra actualizacion pendiente', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-wait',
      status: 'approved',
      applied: false,
    })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/success?external_reference=ref-wait']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

<<<<<<< HEAD
    expect(await screen.findByText(/Pago aprobado, actualizando créditos/i)).toBeInTheDocument()
    expect(screen.getByText(/Verifica nuevamente en unos segundos/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verificar estado del pago/i })).toBeInTheDocument()
    expect(loadFinancialStateMock).not.toHaveBeenCalled()
  })

  test('approved + applied refresca estado financiero y redirige a dashboard pagos', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref999',
      status: 'approved',
      applied: true,
      packageId: 2,
      amount: 1500,
      credits: 8,
    })
    loadFinancialStateMock.mockResolvedValue({})
    getCreditMovementsMock.mockResolvedValue({ items: [], page: 1, pageSize: 8, total: 0 })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/success?external_reference=ref999']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Pago aprobado/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(loadFinancialStateMock).toHaveBeenCalled()
      expect(getCreditMovementsMock).toHaveBeenCalled()
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2700))
    })

    expect(navigateMock).toHaveBeenCalledWith('/cliente/dashboard?section=pagos', { replace: true })
    expect(screen.getByText(/Ir a Paquetes & Pagos/i)).toBeInTheDocument()
  }, 10000)

=======
    expect(await screen.findByText(/terminando de actualizar tus créditos/i)).toBeInTheDocument()
    expect(screen.getByText(/Presiona verificar estado/i)).toBeInTheDocument()
    expect(loadFinancialStateMock).not.toHaveBeenCalled()
  })

>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  test('ruta failure con payment_id null no muestra aprobado y consulta por external_reference', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-fail',
      status: 'created',
      applied: false,
    })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/failure?payment_id=null&status=null&external_reference=ref-fail&payment_status=failed&payment_status_detail=payment_creation_failed']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledWith({ externalReference: 'ref-fail' })
    })
<<<<<<< HEAD
    expect(await screen.findByText(/No pudimos confirmar tu pago/i)).toBeInTheDocument()
    expect(screen.getByText(/Tus créditos no fueron modificados/i)).toBeInTheDocument()
    expect(screen.queryByText(/Pago aprobado/i)).not.toBeInTheDocument()
=======
    expect(await screen.findByText(/Mercado Pago no pudo procesar tu pago/i)).toBeInTheDocument()
    expect(screen.getByText(/Tus créditos no fueron modificados/i)).toBeInTheDocument()
    expect(screen.queryByText(/créditos fueron actualizados/i)).not.toBeInTheDocument()
    expect(loadFinancialStateMock).not.toHaveBeenCalled()
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  })

  test('failed muestra pago no procesado', async () => {
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-rejected',
      status: 'failed',
      applied: false,
    })
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/failure?external_reference=ref-rejected']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

<<<<<<< HEAD
    expect(await screen.findByText(/No pudimos confirmar tu pago/i)).toBeInTheDocument()
=======
    expect(await screen.findByText(/Mercado Pago no pudo procesar tu pago/i)).toBeInTheDocument()
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
    expect(screen.getByText(/Tus créditos no fueron modificados/i)).toBeInTheDocument()
  })

  test('sin external_reference muestra error controlado', async () => {
    const { default: PaymentReturnPage } = await import('./PaymentReturnPage')

    render(
      <MemoryRouter initialEntries={['/pago/success']}>
        <PaymentReturnPage />
      </MemoryRouter>
    )

    expect(await screen.findByText(/No pudimos identificar la referencia del pago/i)).toBeInTheDocument()
    expect(getPaymentStatusMock).not.toHaveBeenCalled()
  })
})
