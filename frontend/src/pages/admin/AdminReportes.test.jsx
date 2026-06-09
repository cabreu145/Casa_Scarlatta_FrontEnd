import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const apiState = {
  finance: {
    data: {
      summary: {
        salesCount: 12,
        salesTotalMxn: 10000,
        expensesTotalMxn: 1200,
        netTotalMxn: 8800,
        averageTicketMxn: 250,
        cashClosingsCount: 2,
        paymentMethods: { cashMxn: 4000, cardMxn: 5000, transferMxn: 1000, otherMxn: 0 },
      },
    },
    isLoading: false,
    error: null,
  },
  users: {
    data: {
      activeClients: 30,
      inactiveClients: 4,
      newClients: 6,
      clientsWithActiveMembership: 22,
      clientsWithoutMembership: 12,
      clientsWithCredits: 18,
      clientsWithoutCredits: 16,
    },
    isLoading: false,
    error: null,
  },
  packages: {
    data: {
      packagesSold: 5,
      packagesRevenueMxn: 9000,
      shareablePackagesSold: 2,
      beneficiariesAssigned: 3,
      topPackage: { name: 'Mensual 12', displayName: 'Mensual 12', soldCount: 4, revenueMxn: 7200 },
    },
    isLoading: false,
    error: null,
  },
  pos: {
    data: {
      salesCount: 8,
      averageTicketMxn: 340,
      productsSold: 20,
      productRevenueMxn: 1500,
      packageRevenueMxn: 5200,
      paymentMethods: { cashMxn: 2000, cardMxn: 3000, transferMxn: 1700, otherMxn: 0 },
      productCategories: [{ category: 'Bebidas', totalMxn: 1200, itemsSold: 10 }],
    },
    isLoading: false,
    error: null,
  },
  coaches: {
    data: {
      items: [
        { coachId: 1, name: 'Coach Demo', classesCount: 6, reservationsCount: 40, attendanceCount: 35, noShowCount: 5, averageOccupancyPct: 72, primaryDiscipline: 'slow' },
      ],
    },
    isLoading: false,
    error: null,
  },
  coachPayments: {
    data: {
      coachesCount: 1,
      classesCount: 2,
      attendanceCount: 30,
      totalPayMxn: 600,
      missingRateClasses: 1,
      items: [
        {
          coachId: 1,
          name: 'Coach Demo',
          classesCount: 2,
          attendanceCount: 30,
          noShowCount: 2,
          totalPayMxn: 600,
          missingRateClasses: 1,
          details: [
            {
              date: '2026-06-09',
              time: '09:00',
              className: 'SLOW 09:00',
              discipline: 'slow',
              attendees: 18,
              rateMxn: 300,
              payMxn: 300,
              status: 'calculated',
            },
          ],
        },
      ],
    },
    isLoading: false,
    error: null,
  },
  payTable: {
    data: {
      items: [
        { id: 1, discipline: 'slow', minAttendees: 1, maxAttendees: 6, payMxn: 200, isActive: true },
      ],
    },
    isLoading: false,
    error: null,
  },
  topClasses: {
    data: {
      items: [
        { classId: 10, name: 'SLOW 09:00', discipline: 'slow', reservationsCount: 18, capacityTotal: 20, occupancyPct: 90 },
      ],
    },
    isLoading: false,
    error: null,
  },
  occupancy: {
    data: {
      items: [
        { discipline: 'slow', occurrencesCount: 12, reservationsCount: 48, capacityTotal: 60, occupancyPct: 80 },
      ],
    },
    isLoading: false,
    error: null,
  },
}

vi.mock('@/components/ui/DateNavigator', () => ({
  default: () => <div data-testid="date-navigator" />,
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useFinanceReportQuery: () => apiState.finance,
  useUsersReportQuery: () => apiState.users,
  usePackagesReportQuery: () => apiState.packages,
  usePosReportQuery: () => apiState.pos,
  useCoachesReportQuery: () => apiState.coaches,
  useCoachPaymentsReportQuery: () => apiState.coachPayments,
  usePayTableQuery: () => apiState.payTable,
  useCreatePayTableMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useUpdatePayTableMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useDeletePayTableMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useTopClassesReportQuery: () => apiState.topClasses,
  useOccupancyByDisciplineReportQuery: () => apiState.occupancy,
}))

vi.mock('@/utils/reportExport', () => ({
  buildReportFilename: vi.fn((prefix, from, to, ext) => `${prefix}-${from}_${to}.${ext}`),
  downloadCsvFromRows: vi.fn(),
}))

vi.mock('@/utils/reportePDF', () => ({
  abrirReportePDF: vi.fn(),
}))

const renderApiSection = async () => {
  vi.resetModules()
  vi.stubEnv('VITE_USE_API_AUTH', 'true')
  const mod = await import('./AdminReportes')
  return mod
}

describe('AdminReportes API mode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_AUTH', 'true')
    apiState.finance.error = null
  })

  test('muestra reportes reales en API mode', async () => {
    const { ReportesSection } = await renderApiSection()

    render(<ReportesSection inPanel />)

    expect(screen.queryByText('Reportes legacy deshabilitados en modo API')).not.toBeInTheDocument()
    expect(screen.getAllByText('Reporte financiero').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reporte de usuarios').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reporte de paquetes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reporte POS').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reporte de coaches').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pago de coaches').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Top clases').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Ocupaci.+disciplina/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Ingresos totales')).toBeInTheDocument()
    expect(screen.getAllByText('$10,000.00')).toHaveLength(2)
    expect(screen.getAllByText('Coach Demo').length).toBeGreaterThan(0)
    expect(screen.getByText('Mensual 12')).toBeInTheDocument()
    expect(screen.getByText('Hay clases sin tarifa configurada en el tabulador.')).toBeInTheDocument()
    expect(screen.getByText('Tabulador de pagos por clase')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'CSV' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'PDF' }).length).toBeGreaterThan(0)
  })

  test('muestra error controlado si falla finance report', async () => {
    apiState.finance.error = new Error('boom')
    const { ReportesSection } = await renderApiSection()

    render(<ReportesSection inPanel />)

    expect(screen.getByText('No se pudieron cargar los reportes.')).toBeInTheDocument()
  })

  test('fallback legacy sigue cuando API mode off', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_USE_API_AUTH', 'false')
    const mod = await import('./AdminReportes')

    render(<mod.ReportesSection inPanel />)

    expect(screen.getByText('Tabulador de pagos por clase')).toBeInTheDocument()
    expect(screen.queryByText('Reportes legacy deshabilitados en modo API')).not.toBeInTheDocument()
  })

  test('exportaciones usan datos reales', async () => {
    const { downloadCsvFromRows } = await import('@/utils/reportExport')
    const { abrirReportePDF } = await import('@/utils/reportePDF')
    const { ReportesSection } = await renderApiSection()

    render(<ReportesSection inPanel />)

    fireEvent.click(screen.getAllByRole('button', { name: 'CSV' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'PDF' })[0])

    expect(downloadCsvFromRows).toHaveBeenCalled()
    expect(abrirReportePDF).toHaveBeenCalled()
  })
})
