import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'

const navigateMock = vi.fn()
const getPaymentStatusMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/services/paymentsApiService', () => ({
  getPaymentStatusApi: (...args) => getPaymentStatusMock(...args),
}))

function createWrapper(queryClient, initialEntry, { strict = false } = {}) {
  const content = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PaymentReturnPage />
      </MemoryRouter>
    </QueryClientProvider>
  )

  return strict ? <StrictMode>{content}</StrictMode> : content
}

let PaymentReturnPage

describe('PaymentReturnPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset()
    getPaymentStatusMock.mockReset()
    localStorage.clear()
    sessionStorage.clear()
    vi.useRealTimers()
    ;({ default: PaymentReturnPage } = await import('./PaymentReturnPage'))
  })

  test('llama una sola vez a getPaymentStatusApi por external_reference', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref123',
      status: 'pending',
      applied: false,
      paymentMethodId: 'oxxo',
    })

    render(createWrapper(queryClient, '/pago/success?external_reference=ref123'))

    expect(await screen.findByText(/Pago pendiente de acreditación/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledTimes(1)
      expect(getPaymentStatusMock).toHaveBeenCalledWith({ externalReference: 'ref123' })
    })
  })

  test('no llama API si falta external_reference', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(createWrapper(queryClient, '/pago/success'))

    expect(await screen.findByText(/No encontramos la referencia del pago/i)).toBeInTheDocument()
    expect(getPaymentStatusMock).not.toHaveBeenCalled()
  })

  test('pending e in_process no invalidan créditos', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-pending',
      status: 'in_process',
      applied: false,
    })

    render(createWrapper(queryClient, '/pago/pending?external_reference=ref-pending'))

    expect(await screen.findByText(/Pago pendiente de acreditación/i)).toBeInTheDocument()
    expect(screen.getByText(/Este proceso puede tardar unos minutos u horas/i)).toBeInTheDocument()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  test('approved + applied invalida una sola vez y no invalida payments.status', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref999',
      status: 'approved',
      applied: true,
      packageId: 2,
      amount: 1500,
      credits: 8,
    })

    render(createWrapper(queryClient, '/pago/success?external_reference=ref999'))

    expect(await screen.findByText(/Pago aprobado/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(7)
    })

    const invalidatedKeys = invalidateSpy.mock.calls.map(([arg]) => JSON.stringify(arg.queryKey))
    expect(invalidatedKeys).toEqual(expect.arrayContaining([
      JSON.stringify(queryKeys.myFinancialState),
      JSON.stringify(queryKeys.myMemberships),
      JSON.stringify(queryKeys.myCreditMovements()),
      JSON.stringify(queryKeys.myPayments()),
      JSON.stringify(queryKeys.notifications.list()),
      JSON.stringify(queryKeys.notifications.unreadCount()),
      JSON.stringify(queryKeys.activity.list()),
    ]))
    expect(invalidatedKeys).not.toContain(JSON.stringify(queryKeys.payments.status('ref999')))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2700))
    })

    expect(navigateMock).toHaveBeenCalledWith('/cliente/dashboard', { replace: true })
  }, 10000)

  test('StrictMode no duplica invalidaciones approved + applied', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-strict',
      status: 'approved',
      applied: true,
    })

    render(createWrapper(queryClient, '/pago/success?external_reference=ref-strict', { strict: true }))

    expect(await screen.findByText(/Pago aprobado/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledTimes(7)
    })
  })

  test('failure y rejected muestran estado controlado', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-fail',
      status: 'failed',
      applied: false,
    })

    render(createWrapper(queryClient, '/pago/failure?external_reference=ref-fail'))

    expect(await screen.findByText(/No pudimos confirmar tu pago/i)).toBeInTheDocument()
    expect(screen.getByText(/Tus créditos no fueron modificados/i)).toBeInTheDocument()
  })

  test('botón verificar usa refetch del hook, no llamada manual extra en mount', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const user = userEvent.setup()
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-manual',
      status: 'approved',
      applied: false,
    })

    render(createWrapper(queryClient, '/pago/success?external_reference=ref-manual'))

    expect(await screen.findByRole('button', { name: /Verificar estado del pago/i })).toBeInTheDocument()
    expect(getPaymentStatusMock).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /Verificar estado del pago/i }))

    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledTimes(2)
    })
  })
})
