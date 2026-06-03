import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const getMyPaymentsApiMock = vi.fn()
const getPaymentStatusMock = vi.fn()

vi.mock('@/services/clientPaymentsApiService', () => ({
  getMyPaymentsApi: (...args) => getMyPaymentsApiMock(...args),
}))

vi.mock('@/services/paymentsApiService', () => ({
  getPaymentStatusApi: (...args) => getPaymentStatusMock(...args),
}))

describe('RecentPaymentsStatusPanel', () => {
  beforeEach(() => {
    getMyPaymentsApiMock.mockReset()
    getPaymentStatusMock.mockReset()
  })

  test('carga pagos desde backend y muestra pendiente de acreditación con detalles cerrados', async () => {
    getMyPaymentsApiMock.mockResolvedValue({
      page: 1,
      page_size: 10,
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
    })

    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')
    render(<RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={vi.fn()} />)

    expect(await screen.findByText(/Estado de pagos recientes/i)).toBeInTheDocument()
    expect(await screen.findByText(/Pendiente de acreditación/i)).toBeInTheDocument()
    expect(screen.getByText(/1 a 2 días hábiles/i)).toBeInTheDocument()
    expect(screen.getByText(/Última actualización/i)).toBeInTheDocument()
    const details = screen.getByText(/Detalles técnicos para soporte/i).closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument()
    expect(getMyPaymentsApiMock).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
  })

  test('verificar estado actualiza item y dispara refetch financiero cuando pasa a acreditado', async () => {
    const refreshMock = vi.fn()
    getMyPaymentsApiMock
      .mockResolvedValueOnce({
      page: 1,
      page_size: 10,
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
      })
      .mockResolvedValueOnce({
        page: 1,
        page_size: 10,
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
      })
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
    render(<RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={refreshMock} />)

    expect(await screen.findByText(/Pendiente de acreditación/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Verificar estado/i }))

    await waitFor(() => {
      expect(getPaymentStatusMock).toHaveBeenCalledWith({ externalReference: 'ref-pending' })
    })
    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled()
    })
    const card = await screen.findByText('Plan 1')
    expect(card.closest('article')).toHaveTextContent('Acreditado')
  })

  test('muestra no procesado para falla y omite fuente localStorage', async () => {
    getMyPaymentsApiMock.mockResolvedValue({
      page: 1,
      page_size: 10,
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
    })

    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')
    render(<RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={vi.fn()} />)

    const card = await screen.findByText('Plan 2')
    expect(card.closest('article')).toHaveTextContent('No procesado')
    expect(screen.queryByText(/No tienes pagos recientes en seguimiento/i)).not.toBeInTheDocument()
  })
})
