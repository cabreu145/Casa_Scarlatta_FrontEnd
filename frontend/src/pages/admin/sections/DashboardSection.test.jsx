import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const apiState = {
  kpis: {
    data: {
      from: '2026-06-09',
      to: '2026-06-09',
      sales: { count: 12, subtotalMxn: 10000, taxMxn: 1600, totalMxn: 11600 },
      expenses: { count: 3, totalMxn: 1200 },
      net: { totalMxn: 10400 },
      paymentMethods: { cashMxn: 4000, cardMxn: 5000, transferMxn: 2600, otherMxn: 0 },
      cashClosing: { isClosed: false, lastClosingDate: '2026-06-08', todayClosingId: null },
      operations: { productsSold: 20, packagesSold: 4, activeClients: 30, reservationsCount: 18 },
    },
    isLoading: false,
    error: null,
  },
  day: {
    data: {
      recentExpenses: [
        { id: 2, description: 'Compra de agua', category: 'insumos', amountMxn: 50, paymentMethod: 'cash', createdAt: '2026-06-09T09:00:00-06:00' },
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
  lowStock: {
    data: [
      { id: 10, productName: 'Toalla', category: 'Accesorios', stock: 2 },
    ],
    isLoading: false,
    error: null,
  },
  recentSales: {
    data: [
      { id: 1, folio: 'POS-000001', customerName: 'Cliente Demo', paymentMethod: 'cash', totalMxn: 350, createdAt: '2026-06-09T10:00:00-06:00' },
    ],
    isLoading: false,
    error: null,
  },
}

vi.mock('@/components/ui/DateNavigator', () => ({
  default: () => <div data-testid="date-navigator" />,
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useFinanceKpisQuery: () => apiState.kpis,
  useFinanceDaySummaryQuery: () => apiState.day,
  useFinanceCategoriesQuery: () => apiState.categories,
  useFinanceLowStockQuery: () => apiState.lowStock,
  useFinanceRecentSalesQuery: () => apiState.recentSales,
}))

const exportFinanceCsv = vi.fn()
vi.mock('@/services/financeApiService', () => ({
  exportFinanceCsv: (...args) => exportFinanceCsv(...args),
}))

vi.mock('@/stores/transaccionesStore', () => ({
  useTransaccionesStore: () => ({ transacciones: [] }),
}))
vi.mock('@/stores/usuariosStore', () => ({
  useUsuariosStore: () => ({ usuarios: [] }),
}))
vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: () => ({ clases: [] }),
}))
vi.mock('@/stores/paquetesStore', () => ({
  usePaquetesStore: () => ({ paquetes: [] }),
}))

vi.stubEnv('VITE_USE_API_AUTH', 'true')

const { default: DashboardSection } = await import('./DashboardSection')

describe('DashboardSection', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    exportFinanceCsv.mockReset()
  })

  test('muestra KPIs reales, ventas recientes y stock bajo', () => {
    render(
      <DashboardSection
        rangoDash="mes"
        setRangoDash={vi.fn()}
        showSection={vi.fn()}
        showSectionWithFilter={vi.fn()}
      />
    )

    expect(screen.getByText('Ventas')).toBeInTheDocument()
    expect(screen.getByText('Gastos')).toBeInTheDocument()
    expect(screen.getByText('Neto')).toBeInTheDocument()
    expect(screen.getByText('Corte')).toBeInTheDocument()
    expect(screen.getByText('Productos vendidos')).toBeInTheDocument()
    expect(screen.getByText('Paquetes vendidos')).toBeInTheDocument()
    expect(screen.getByText('Clientes activos')).toBeInTheDocument()
    expect(screen.getByText('Reservas')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Cliente Demo')).toBeInTheDocument()
    expect(screen.getByText('Toalla')).toBeInTheDocument()
    expect(screen.getByText('Compra de agua')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Exportar resumen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar ventas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar gastos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar cortes' })).toBeInTheDocument()
  })

  test('exporta CSV por tipo con rango activo', async () => {
    exportFinanceCsv.mockResolvedValueOnce({ filename: 'finanzas-summary-2026-06-09_2026-06-09.csv' })

    render(
      <DashboardSection
        rangoDash="mes"
        setRangoDash={vi.fn()}
        showSection={vi.fn()}
        showSectionWithFilter={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Exportar resumen' }))

    await waitFor(() => {
      expect(exportFinanceCsv).toHaveBeenCalledWith({
        from: '2026-06-01',
        to: '2026-06-09',
        type: 'summary',
      })
    })
  })
})
