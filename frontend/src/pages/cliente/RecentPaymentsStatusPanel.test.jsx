import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { upsertRecentPaymentReference } from '@/features/pagos/paymentTracking'

const getPaymentStatusMock = vi.fn()

vi.mock('@/services/paymentsApiService', () => ({
  getPaymentStatusApi: (...args) => getPaymentStatusMock(...args),
}))

describe('RecentPaymentsStatusPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    getPaymentStatusMock.mockReset()
  })

  test('muestra pagos recientes y etiqueta pendiente de acreditacion', async () => {
    upsertRecentPaymentReference({
      externalReference: 'ref-oxxo',
      packageId: 2,
      packageName: 'Plan OXXO',
      amount: 1500,
      credits: 8,
    })
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-oxxo',
      status: 'pending',
      applied: false,
      paymentMethodId: 'oxxo',
    })
    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')

    render(<RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={vi.fn()} />)

    expect(await screen.findByText(/Estado de pagos recientes/i)).toBeInTheDocument()
    expect(await screen.findByText(/Pendiente de acreditación/i)).toBeInTheDocument()
    expect(screen.getByText(/1 a 2 días hábiles/i)).toBeInTheDocument()
    expect(getPaymentStatusMock).toHaveBeenCalledWith({ externalReference: 'ref-oxxo' })
  })

  test('approved + applied=true dispara refetch financiero y permite quitar de la lista', async () => {
    const refreshMock = vi.fn()
    upsertRecentPaymentReference({
      externalReference: 'ref-ok',
      packageId: 3,
      packageName: 'Plan OK',
      amount: 2000,
      credits: 12,
    })
    getPaymentStatusMock.mockResolvedValue({
      externalReference: 'ref-ok',
      status: 'approved',
      applied: true,
      packageId: 3,
      amount: 2000,
      credits: 12,
    })
    const { default: RecentPaymentsStatusPanel } = await import('./RecentPaymentsStatusPanel')

    render(<RecentPaymentsStatusPanel enabled onFinancialRefreshRequested={refreshMock} />)

    expect(await screen.findByText(/Acreditado/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled()
    })

    await userEvent.click(screen.getByRole('button', { name: /Quitar de la lista/i }))
    expect(screen.getByText(/No tienes pagos recientes en seguimiento/i)).toBeInTheDocument()
  })
})
