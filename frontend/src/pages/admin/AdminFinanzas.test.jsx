import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const apiState = {
  today: new Date().toISOString().slice(0, 10),
  kpis: {
    data: {
      from: new Date().toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      sales: { count: 12, subtotalMxn: 10000, taxMxn: 1600, totalMxn: 11600 },
      expenses: { count: 3, totalMxn: 1200 },
      net: { totalMxn: 10400 },
      paymentMethods: { cashMxn: 4000, cardMxn: 5000, transferMxn: 2600, otherMxn: 0 },
      cashClosing: { isClosed: false, lastClosingDate: '2026-06-08', todayClosingId: 10 },
      operations: { productsSold: 20, packagesSold: 4, activeClients: 30, reservationsCount: 18 },
    },
    isLoading: false,
    error: null,
  },
  day: {
    data: {
      recentSales: [
        {
          id: 1,
          folio: 'POS-000001',
          customerName: 'Cliente Demo',
          paymentMethod: 'cash',
          totalMxn: 350,
          createdAt: '2026-06-10T22:30:00Z',
        },
      ],
      recentExpenses: [
        {
          id: 2,
          description: 'Compra de agua',
          category: 'insumos',
          amountMxn: 50,
          paymentMethod: 'cash',
          createdAt: '2026-06-09T09:00:00-06:00',
        },
      ],
    },
    isLoading: false,
    error: null,
  },
  historical: {
    data: {
      from: '2026-06-01',
      to: '2026-06-09',
      groupBy: 'day',
      items: [
        {
          label: '01/06',
          salesCount: 4,
          salesTotalMxn: 1000,
          expensesTotalMxn: 200,
          netTotalMxn: 800,
          averageTicketMxn: 250,
          cashMxn: 500,
          cardMxn: 400,
          transferMxn: 100,
          otherMxn: 0,
        },
      ],
    },
    isLoading: false,
    error: null,
  },
  categories: {
    data: {
      expenseCategories: [{ category: 'insumos', totalMxn: 500, count: 2 }],
      productCategories: [{ category: 'Bebidas', totalMxn: 1200, itemsSold: 10 }],
    },
    isLoading: false,
    error: null,
  },
  recentSales: {
    data: [
        {
          id: 1,
          folio: 'POS-000001',
          customerName: 'Cliente Demo',
          paymentMethod: 'cash',
          totalMxn: 350,
          createdAt: '2026-06-10T22:30:00Z',
        },
      ],
    isLoading: false,
    error: null,
  },
  expenses: {
    data: {
      items: [
        {
          id: 5,
          expenseDate: '2026-06-09',
          category: 'insumos',
          description: 'Compra de agua',
          amountMxn: 50,
          paymentMethod: 'cash',
          status: 'active',
          createdAt: '2026-06-09T09:00:00-06:00',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    },
    isLoading: false,
    error: null,
  },
  todayClosing: {
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
  cashClosings: {
    data: {
      page: 1,
      pageSize: 20,
      total: 1,
      items: [
        {
          id: 10,
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
          notes: '',
          createdAt: '2026-06-09T12:00:00-06:00',
        },
      ],
    },
    isLoading: false,
    error: null,
  },
  detail: {
    data: {
      id: 10,
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
      sales: [
        {
          saleId: 1,
          folio: 'POS-000001',
          customerName: 'Cliente Demo',
          customerEmail: 'cliente@demo.local',
          paymentMethod: 'cash',
          subtotalMxn: 1000,
          taxMxn: 160,
          totalMxn: 1160,
          createdAt: '2026-06-09T10:00:00-06:00',
        },
      ],
    },
    isLoading: false,
    error: null,
  },
}

vi.mock('@/components/ui/DateNavigator', () => ({
  default: () => <div data-testid="date-navigator" />,
}))

const exportFinanceCsv = vi.fn()
vi.mock('@/services/financeApiService', () => ({
  exportFinanceCsv: (...args) => exportFinanceCsv(...args),
}))

const createExpenseMutation = { mutateAsync: vi.fn().mockResolvedValue({}) }
const deleteExpenseMutation = { mutateAsync: vi.fn().mockResolvedValue({}) }
const executeCashClosingMutation = { mutateAsync: vi.fn().mockResolvedValue({}) }

vi.mock('@/hooks/useApiQueries', () => ({
  useFinanceKpisQuery: () => apiState.kpis,
  useFinanceDaySummaryQuery: () => apiState.day,
  useFinanceHistoricalQuery: () => apiState.historical,
  useFinanceCategoriesQuery: () => apiState.categories,
  useFinanceRecentSalesQuery: () => apiState.recentSales,
  useTodayCashClosingQuery: () => apiState.todayClosing,
  useCashClosingsQuery: () => apiState.cashClosings,
  useExpensesQuery: () => apiState.expenses,
  useCashClosingDetailQuery: (id) => ({
    data: id ? apiState.detail.data : null,
    isLoading: false,
    error: null,
  }),
  useCreateExpenseMutation: () => createExpenseMutation,
  useDeleteExpenseMutation: () => deleteExpenseMutation,
  useExecuteCashClosingMutation: () => executeCashClosingMutation,
}))

vi.mock('@/utils/reportePDF', () => ({
  abrirReportePDF: vi.fn(),
}))

vi.mock('@/stores/transaccionesStore', () => ({
  useTransaccionesStore: Object.assign(() => ({ transacciones: [] }), {
    getState: () => ({ transacciones: [] }),
  }),
}))
vi.mock('@/stores/cortesStore', () => ({
  useCortesStore: Object.assign(() => ({ cortes: [], ejecutarCorte: vi.fn() }), {
    getState: () => ({ cortes: [], ejecutarCorte: vi.fn() }),
  }),
}))
vi.mock('@/stores/gastosStore', () => ({
  TIPOS_GASTO: {
    OPERATIVO: 'operativo',
    SUELDO: 'sueldo',
    SERVICIO: 'servicio',
    INSUMO: 'insumo',
    INVENTARIO: 'inventario',
  },
  useGastosStore: Object.assign(
    () => ({ gastos: [], registrarGasto: vi.fn(), getGastosByRango: () => [], eliminarGasto: vi.fn() }),
    {
      getState: () => ({ gastos: [], registrarGasto: vi.fn(), getGastosByRango: () => [], eliminarGasto: vi.fn() }),
    }
  ),
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(() => ({ usuario: { id: 1, rol: 'admin' } }), {
    getState: () => ({ usuario: { id: 1, rol: 'admin' } }),
  }),
}))

vi.stubEnv('VITE_USE_API_AUTH', 'true')

const { FinanzasSection } = await import('./AdminFinanzas')

describe('AdminFinanzas API mode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    exportFinanceCsv.mockReset()
    createExpenseMutation.mutateAsync.mockClear()
    deleteExpenseMutation.mutateAsync.mockClear()
    executeCashClosingMutation.mutateAsync.mockClear()
  })

  test('muestra datos reales, export y corte real en API mode', async () => {
    const mathSpy = vi.spyOn(Math, 'random')
    exportFinanceCsv.mockResolvedValueOnce({ filename: 'finanzas-summary-2026-06-09_2026-06-09.csv' })

    render(<FinanzasSection inPanel />)

    expect(screen.queryByText('Vista legacy deshabilitada en modo API')).not.toBeInTheDocument()
    expect(screen.getByTestId('date-navigator')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getAllByText('Gastos').length).toBeGreaterThan(0)
    expect(screen.getByText('Utilidad neta')).toBeInTheDocument()
    expect(screen.getByText('Ticket promedio')).toBeInTheDocument()
    expect(screen.getAllByText('Cliente Demo').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/16:30/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Compra de agua').length).toBeGreaterThan(0)
    expect(screen.getByText(/Serie operativa day/i)).toBeInTheDocument()
    expect(screen.getByText('Historial de cortes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CSV' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Excel/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /PDF/ }).length).toBeGreaterThan(0)
    expect(mathSpy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'CSV' }))

    await waitFor(() => {
      expect(exportFinanceCsv).toHaveBeenCalledWith({
        from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        type: 'summary',
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Detalle de corte/i })).toBeInTheDocument()
    })

    const detailDialog = screen.getByRole('dialog', { name: /Detalle de corte/i })
    expect(within(detailDialog).getByText('POS-000001')).toBeInTheDocument()
    expect(within(detailDialog).getByText('Cliente Demo')).toBeInTheDocument()
    expect(within(detailDialog).getByText('Efectivo')).toBeInTheDocument()

    mathSpy.mockRestore()
  })

  test('ejecutar corte llama mutation en API mode', async () => {
    render(<FinanzasSection inPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Realizar corte' }))

    const modal = screen.getByRole('dialog', { name: /Corte de caja/i })
    fireEvent.click(within(modal).getByRole('button', { name: /Confirmar corte/i }))

    await waitFor(() => {
      expect(executeCashClosingMutation.mutateAsync).toHaveBeenCalledWith({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        notes: '',
      })
    })
  })

  test('fallback legacy sigue visible cuando API mode off', async () => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_USE_API_AUTH', 'false')

    const { FinanzasSection: FinanzasSectionLegacy } = await import('./AdminFinanzas')

    render(<FinanzasSectionLegacy inPanel />)

    expect(screen.queryByText('Vista legacy deshabilitada en modo API')).not.toBeInTheDocument()
    expect(screen.getByText(/Ingresos hist.+ricos/i)).toBeInTheDocument()
  })
})
