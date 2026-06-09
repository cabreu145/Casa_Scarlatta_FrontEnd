import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    reportesFinanzas: ({ from, to } = {}) => `/api/v1/reportes/finanzas?from=${from ?? ''}&to=${to ?? ''}`,
    reportesUsuarios: ({ from, to } = {}) => `/api/v1/reportes/usuarios?from=${from ?? ''}&to=${to ?? ''}`,
    reportesPaquetes: ({ from, to } = {}) => `/api/v1/reportes/paquetes?from=${from ?? ''}&to=${to ?? ''}`,
    reportesPos: ({ from, to } = {}) => `/api/v1/reportes/pos?from=${from ?? ''}&to=${to ?? ''}`,
    reportesCoaches: ({ from, to } = {}) => `/api/v1/reportes/coaches?from=${from ?? ''}&to=${to ?? ''}`,
    reportesTopClases: ({ from, to, limit } = {}) => `/api/v1/reportes/top-clases?from=${from ?? ''}&to=${to ?? ''}&limit=${limit ?? ''}`,
    reportesOcupacionPorDisciplina: ({ from, to } = {}) => `/api/v1/reportes/ocupacion-por-disciplina?from=${from ?? ''}&to=${to ?? ''}`,
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('reportsApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
  })

  test('consume endpoints de reportes', async () => {
    httpGet
      .mockResolvedValueOnce({
        sales_total_mxn: 10000,
        expenses_total_mxn: 1200,
        net_total_mxn: 8800,
        average_ticket_mxn: 250,
        cash_closings_count: 2,
        payment_methods: { cash_mxn: 4000, card_mxn: 5000, transfer_mxn: 1000, other_mxn: 0 },
      })
      .mockResolvedValueOnce({
        active_clients: 30,
        inactive_clients: 4,
        new_clients: 6,
        clients_with_active_membership: 22,
        clients_without_membership: 12,
        clients_with_credits: 18,
        clients_without_credits: 16,
      })
      .mockResolvedValueOnce({
        packages_sold: 5,
        packages_revenue_mxn: 9000,
        shareable_packages_sold: 2,
        beneficiaries_assigned: 3,
        top_package: null,
      })
      .mockResolvedValueOnce({
        sales_count: 8,
        average_ticket_mxn: 340,
        products_sold: 20,
        product_revenue_mxn: 1500,
        package_revenue_mxn: 5200,
        payment_methods: { cash_mxn: 2000, card_mxn: 3000, transfer_mxn: 1700, other_mxn: 0 },
        product_categories: [{ category: 'Bebidas', total_mxn: 1200, items_sold: 10 }],
      })
      .mockResolvedValueOnce({
        items: [{ coach_id: 1, name: 'Coach Demo', classes_count: 6, reservations_count: 40, attendance_count: 35, no_show_count: 5, average_occupancy_pct: 72, primary_discipline: 'slow' }],
      })
      .mockResolvedValueOnce({
        items: [{ class_id: 10, name: 'SLOW 09:00', discipline: 'slow', reservations_count: 18, capacity_total: 20, occupancy_pct: 90, occurrences_count: 5 }],
      })
      .mockResolvedValueOnce({
        items: [{ primary_discipline: 'slow', occurrences_count: 12, reservations_count: 48, capacity_total: 60, occupancy_pct: 80 }],
      })

    const service = await import('./reportsApiService')

    const finance = await service.getFinanceReport({ from: '2026-06-01', to: '2026-06-09' })
    const users = await service.getUsersReport({ from: '2026-06-01', to: '2026-06-09' })
    const packages = await service.getPackagesReport({ from: '2026-06-01', to: '2026-06-09' })
    const pos = await service.getPosReport({ from: '2026-06-01', to: '2026-06-09' })
    const coaches = await service.getCoachesReport({ from: '2026-06-01', to: '2026-06-09' })
    const topClasses = await service.getTopClassesReport({ from: '2026-06-01', to: '2026-06-09', limit: 5 })
    const occupancy = await service.getOccupancyByDisciplineReport({ from: '2026-06-01', to: '2026-06-09' })

    expect(httpGet).toHaveBeenNthCalledWith(1, '/api/v1/reportes/finanzas?from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(2, '/api/v1/reportes/usuarios?from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(3, '/api/v1/reportes/paquetes?from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(4, '/api/v1/reportes/pos?from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(5, '/api/v1/reportes/coaches?from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(6, '/api/v1/reportes/top-clases?from=2026-06-01&to=2026-06-09&limit=5')
    expect(httpGet).toHaveBeenNthCalledWith(7, '/api/v1/reportes/ocupacion-por-disciplina?from=2026-06-01&to=2026-06-09')

    expect(finance.summary).toMatchObject({ salesTotalMxn: 10000, netTotalMxn: 8800 })
    expect(users).toMatchObject({ activeClients: 30, clientsWithActiveMembership: 22 })
    expect(packages).toMatchObject({ packagesSold: 5, topPackage: null })
    expect(pos.productCategories[0]).toMatchObject({ category: 'Bebidas', totalMxn: 1200 })
    expect(coaches.items[0]).toMatchObject({ name: 'Coach Demo' })
    expect(topClasses.items[0]).toMatchObject({ name: 'SLOW 09:00' })
    expect(occupancy.items[0]).toMatchObject({ discipline: 'slow' })
  })
})
