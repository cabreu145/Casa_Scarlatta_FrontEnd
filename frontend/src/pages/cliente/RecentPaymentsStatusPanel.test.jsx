import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const getPaymentStatusMock = vi.fn()
let paymentsQueryState = {
  data: { page: 1, pageSize: 10, total: 0, items: [] },
  isLoading: false,
  error: null,
}

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})

vi.mock('@/services/paymentsApiService', () => ({
  getPaymentStatusApi: (...args) => getPaymentStatusMock(...args),
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useMyPaymentsQuery: () => paymentsQueryState,
}))

describe('RecentPaymentsStatusPanel', () => {
  beforeEach(() => {
    testQueryClient.clear()
    getPaymentStatusMock.mockReset()
    paymentsQueryState = {
      data: { page: 1, pageSize: 10, total: 0, items: [] },
      isLoading: false,
      error: null,
    }
  })

  test('carga pagos desde backend y muestra pendiente de acreditación con detalles cerrados', async () => {
    paymentsQueryState = {
      data: {
        page: 1,
        pageSize: 10,
        total: 11,
        items: [
          {
            externalReference: 'ref-oxxo',
            status: 'pending',
            applied: false,
            packageName: 'Plan OXXO',
            amount: 1500,
            credits: 8,
            paymentMethodId: 'oxxo',
            paymentTypeId: 'ticket',
            createdAt: '2026-06-02T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      error: null,
    }

    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')

    render(
      <QueryClientProvider client={testQueryClient}>
        <RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={vi.fn()} />
      </QueryClientProvider>
    )

    expect(screen.getByText(/Estado de pagos recientes/i)).toBeInTheDocument()
    expect(screen.getByText(/Pendiente de acredit/i)).toBeInTheDocument()
    expect(screen.getByText(/1 a 2 d/i)).toBeInTheDocument()
    expect(screen.getByText(/Última actualización/i)).toBeInTheDocument()
    const details = screen.getByText(/Detalles técnicos para soporte/i).closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument()
  })

  test('verificar estado actualiza item y dispara refetch financiero cuando pasa a acreditado', async () => {
    const refreshMock = vi.fn()
    const user = userEvent.setup()

    paymentsQueryState = {
      data: {
        page: 1,
        pageSize: 10,
        total: 1,
        items: [
          {
            externalReference: 'ref-pending',
            status: 'pending',
            applied: false,
            packageName: 'Plan 1',
            amount: 2100,
            credits: 12,
            createdAt: '2026-06-02T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      error: null,
    }

    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-pending',
      status: 'approved',
      applied: true,
      packageName: 'Plan 1',
      amount: 2100,
      credits: 12,
      approvedAt: '2026-06-02T11:00:00Z',
      appliedAt: '2026-06-02T11:01:00Z',
    })

    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')
    const { rerender } = render(
      <QueryClientProvider client={testQueryClient}>
        <RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={refreshMock} />
      </QueryClientProvider>
    )

    expect(screen.getByText(/Pendiente de acredit/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Verificar estado/i }))

    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledWith({ externalReference: 'ref-pending' })
      expect(refreshMock).toHaveBeenCalled()
    })

    paymentsQueryState = {
      data: {
        page: 1,
        pageSize: 10,
        total: 1,
        items: [
          {
            externalReference: 'ref-pending',
            status: 'approved',
            applied: true,
            packageName: 'Plan 1',
            amount: 2100,
            credits: 12,
            approvedAt: '2026-06-02T11:00:00Z',
            appliedAt: '2026-06-02T11:01:00Z',
            createdAt: '2026-06-02T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      error: null,
    }
    rerender(
      <QueryClientProvider client={testQueryClient}>
        <RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={refreshMock} />
      </QueryClientProvider>
    )

    const card = screen.getByText('Plan 1')
    expect(card.closest('article')).toHaveTextContent('Acreditado')
  })

  test('muestra no procesado para falla y omite fuente localStorage', async () => {
    paymentsQueryState = {
      data: {
        page: 1,
        pageSize: 10,
        total: 1,
        items: [
          {
            externalReference: 'ref-failed',
            status: 'failed',
            applied: false,
            packageName: 'Plan 2',
            amount: 1800,
            credits: 10,
            createdAt: '2026-06-02T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      error: null,
    }

    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')
    render(
      <QueryClientProvider client={testQueryClient}>
        <RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={vi.fn()} />
      </QueryClientProvider>
    )

    const card = screen.getByText('Plan 2')
    expect(card.closest('article')).toHaveTextContent(/No procesado/i)
    expect(screen.queryByText(/No tienes pagos recientes en seguimiento/i)).not.toBeInTheDocument()
  })
})
