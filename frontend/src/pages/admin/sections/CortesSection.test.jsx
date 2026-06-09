import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import CortesSection from './CortesSection'

const toastSuccess = vi.fn()
const toastError = vi.fn()
const executeMutateAsync = vi.fn()

const apiState = {
  today: {
    data: {
      date: '2026-06-09',
      isClosed: false,
      salesCount: 4,
      subtotalMxn: 1000,
      taxMxn: 160,
      totalMxn: 1160,
      cashTotalMxn: 500,
      cardTotalMxn: 300,
      transferTotalMxn: 360,
      otherTotalMxn: 0,
      expensesTotalMxn: 0,
      netTotalMxn: 1160,
    },
    isLoading: false,
    error: null,
  },
  list: {
    data: {
      page: 1,
      pageSize: 20,
      total: 1,
      items: [
        {
          id: 11,
          date: '2026-06-08',
          isClosed: true,
          salesCount: 2,
          totalMxn: 500,
          cashTotalMxn: 500,
          cardTotalMxn: 0,
          transferTotalMxn: 0,
          netTotalMxn: 500,
        },
      ],
    },
    isLoading: false,
    error: null,
  },
  detail: {
    data: {
      id: 11,
      date: '2026-06-08',
      salesCount: 1,
      subtotalMxn: 100,
      taxMxn: 16,
      totalMxn: 116,
      expensesTotalMxn: 0,
      netTotalMxn: 116,
      sales: [
        {
          id: 100,
          folio: 'POS-000100',
          customerName: 'Cliente Demo',
          paymentMethod: 'cash',
          subtotalMxn: 100,
          taxMxn: 16,
          totalMxn: 116,
          createdAt: '2026-06-08T12:00:00-06:00',
        },
      ],
    },
    isLoading: false,
    error: null,
  },
}

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args) => toastSuccess(...args),
    error: (...args) => toastError(...args),
  },
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useTodayCashClosingQuery: () => apiState.today,
  useCashClosingsQuery: () => apiState.list,
  useCashClosingDetailQuery: () => apiState.detail,
  useExecuteCashClosingMutation: () => ({
    mutateAsync: executeMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@/stores/cortesStore', () => ({
  useCortesStore: () => ({
    cortes: [
      {
        id: 21,
        fecha: '2026-06-07',
        estado: 'cerrado',
        totalReservas: 3,
        totalIngresos: 900,
        totalEfectivo: 400,
        totalTarjeta: 500,
        totalTransferencia: 0,
        totalOther: 0,
        totalGastos: 0,
        neto: 900,
        ejecutadoPorNombre: 'Admin Demo',
        sales: [],
      },
    ],
    ejecutarCorte: vi.fn(),
  }),
}))

describe('CortesSection', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
    executeMutateAsync.mockReset()
    apiState.today.data.isClosed = false
    executeMutateAsync.mockResolvedValue({
      id: 12,
      date: '2026-06-09',
      isClosed: true,
      totalMxn: 1160,
      netTotalMxn: 1160,
    })
  })

  test('muestra resumen, historial y detalle de corte', async () => {
    const user = userEvent.setup()
    render(<CortesSection inPanel isActive useApiMode />)

    expect(screen.getByText('Corte de hoy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Realizar corte/i })).toBeEnabled()
    expect(screen.getByText('Abierto')).toBeInTheDocument()
    expect(screen.getAllByText('09/06/2026')).toHaveLength(1)

    const table = screen.getByRole('table')
    expect(within(table).getByText('08/06/2026')).toBeInTheDocument()
    expect(within(table).getByRole('button', { name: /Ver detalle/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ver detalle/i }))
    const detailDialog = screen.getByRole('dialog', { name: /Detalle de corte/i })
    expect(within(detailDialog).getByText('Cliente Demo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Realizar corte/i }))
    const confirmDialog = screen.getByRole('dialog', { name: /Realizar corte/i })
    await user.type(within(confirmDialog).getByPlaceholderText(/Cierre de caja turno tarde/i), 'Cierre turno tarde')
    await user.click(within(confirmDialog).getByRole('button', { name: /Confirmar corte/i }))

    expect(executeMutateAsync).toHaveBeenCalledWith({
      date: '2026-06-09',
      notes: 'Cierre turno tarde',
    })
    expect(toastSuccess).toHaveBeenCalledWith('Corte ejecutado')
  })

  test('deshabilita realizar corte cuando ya esta cerrado', () => {
    apiState.today.data.isClosed = true
    render(<CortesSection inPanel isActive useApiMode />)
    expect(screen.getByRole('button', { name: /Realizar corte/i })).toBeDisabled()
    expect(screen.getAllByText('Cerrado')).toHaveLength(2)
  })

  test('muestra mensaje claro para corte duplicado', async () => {
    const user = userEvent.setup()
    executeMutateAsync.mockRejectedValueOnce(new Error('CASH_CLOSING_ALREADY_EXISTS'))
    render(<CortesSection inPanel isActive useApiMode />)

    await user.click(screen.getByRole('button', { name: /Realizar corte/i }))
    const confirmDialog = screen.getByRole('dialog', { name: /Realizar corte/i })
    await user.click(within(confirmDialog).getByRole('button', { name: /Confirmar corte/i }))

    expect(toastError).toHaveBeenCalledWith('Ya existe un corte para esta fecha.')
  })
})
