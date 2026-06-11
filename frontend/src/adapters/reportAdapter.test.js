import { describe, expect, test } from 'vitest'
import {
  mapBackendCoachPaymentsReportToFrontend,
  mapBackendCoachesReportToFrontend,
  mapBackendFinanceReportToFrontend,
  mapBackendOccupancyByDisciplineReportToFrontend,
  mapBackendPackagesReportToFrontend,
  mapBackendPosReportToFrontend,
  mapBackendTopClassesReportToFrontend,
  mapBackendUsersReportToFrontend,
} from './reportAdapter'

describe('reportAdapter', () => {
  test('mapea reporte financiero', () => {
    const mapped = mapBackendFinanceReportToFrontend({
      from: '2026-06-01',
      to: '2026-06-09',
      sales_total_mxn: 10000,
      pos_sales_total_mxn: 6000,
      mercado_pago_total_mxn: 4000,
      expenses_total_mxn: 1200,
      net_total_mxn: 8800,
      average_ticket_mxn: 250,
      cash_closings_count: 2,
      payment_methods: { cash_mxn: 4000, card_mxn: 5000, transfer_mxn: 1000, mercado_pago_mxn: 1500, other_mxn: 0 },
    })

    expect(mapped).toMatchObject({
      from: '2026-06-01',
      to: '2026-06-09',
      summary: {
        salesTotalMxn: 10000,
        posSalesTotalMxn: 6000,
        mercadoPagoTotalMxn: 4000,
        expensesTotalMxn: 1200,
        netTotalMxn: 8800,
        averageTicketMxn: 250,
        cashClosingsCount: 2,
        paymentMethods: { cashMxn: 4000, cardMxn: 5000, transferMxn: 1000, mercadoPagoMxn: 1500, otherMxn: 0 },
      },
    })
  })

  test('mapea reporte de usuarios y paquetes', () => {
    const users = mapBackendUsersReportToFrontend({
      active_clients: 30,
      inactive_clients: 4,
      new_clients: 6,
      clients_with_active_membership: 22,
      clients_without_membership: 12,
      clients_with_credits: 18,
      clients_without_credits: 16,
    })
    const packages = mapBackendPackagesReportToFrontend({
      packages_sold: 5,
      packages_revenue_mxn: 9000,
      shareable_packages_sold: 2,
      beneficiaries_assigned: 3,
      top_package: null,
    })

    expect(users).toMatchObject({
      activeClients: 30,
      inactiveClients: 4,
      newClients: 6,
      clientsWithActiveMembership: 22,
      clientsWithoutMembership: 12,
      clientsWithCredits: 18,
      clientsWithoutCredits: 16,
    })
    expect(packages).toMatchObject({
      packagesSold: 5,
      packagesRevenueMxn: 9000,
      shareablePackagesSold: 2,
      beneficiariesAssigned: 3,
      topPackage: null,
    })
  })

  test('mapea pos, coaches, top clases y ocupación', () => {
    const pos = mapBackendPosReportToFrontend({
      sales_count: 8,
      average_ticket_mxn: 340,
      products_sold: 20,
      product_revenue_mxn: 1500,
      package_revenue_mxn: 5200,
      payment_methods: { cash_mxn: 2000, card_mxn: 3000, transfer_mxn: 1700, other_mxn: 0 },
      product_categories: [{ category: 'Bebidas', total_mxn: 1200, items_sold: 10 }],
    })
    const coaches = mapBackendCoachesReportToFrontend({
      items: [{ coach_id: 1, name: 'Coach Demo', classes_count: 6, reservations_count: 40, attendance_count: 35, no_show_count: 5, average_occupancy_pct: 72, primary_discipline: 'slow' }],
    })
    const topClasses = mapBackendTopClassesReportToFrontend({
      items: [{ class_id: 10, name: 'SLOW 09:00', discipline: 'slow', reservations_count: 18, capacity_total: 20, occupancy_pct: 90, occurrences_count: 5 }],
    })
    const occupancy = mapBackendOccupancyByDisciplineReportToFrontend({
      items: [{ primary_discipline: 'slow', occurrences_count: 12, reservations_count: 48, capacity_total: 60, occupancy_pct: 80 }],
    })

    expect(pos).toMatchObject({
      salesCount: 8,
      averageTicketMxn: 340,
      productsSold: 20,
      productRevenueMxn: 1500,
      packageRevenueMxn: 5200,
      productCategories: [{ category: 'Bebidas', totalMxn: 1200, itemsSold: 10 }],
    })
    expect(coaches.items[0]).toMatchObject({
      coachId: 1,
      name: 'Coach Demo',
      classesCount: 6,
      reservationsCount: 40,
      attendanceCount: 35,
      noShowCount: 5,
      averageOccupancyPct: 72,
      primaryDiscipline: 'slow',
    })
    expect(topClasses.items[0]).toMatchObject({
      classId: 10,
      name: 'SLOW 09:00',
      reservationsCount: 18,
      capacityTotal: 20,
      occupancyPct: 90,
    })
    expect(occupancy.items[0]).toMatchObject({
      discipline: 'slow',
      occurrencesCount: 12,
      reservationsCount: 48,
      capacityTotal: 60,
      occupancyPct: 80,
    })
  })
  test('mapea reporte de pago de coaches', () => {
    const report = mapBackendCoachPaymentsReportToFrontend({
      from: '2026-06-01',
      to: '2026-06-09',
      summary: { coaches_count: 1, classes_count: 2, attendance_count: 30, total_pay_mxn: 600, missing_rate_classes: 1 },
      items: [
        {
          coach_id: 1,
          name: 'Coach Demo',
          classes_count: 2,
          attendance_count: 30,
          no_show_count: 2,
          total_pay_mxn: 600,
          missing_rate_classes: 1,
          details: [
            {
              date: '2026-06-09',
              time: '09:00',
              class_name: 'SLOW 09:00',
              discipline: 'slow',
              attendees: 18,
              rate_mxn: 300,
              pay_mxn: 300,
              status: 'calculated',
            },
            {
              date: '2026-06-09',
              time: '10:00',
              class_name: 'SLOW 10:00',
              discipline: 'slow',
              attendees: 12,
              rate_mxn: 0,
              pay_mxn: 0,
              status: 'missing_rate',
            },
          ],
        },
      ],
    })

    expect(report).toMatchObject({
      from: '2026-06-01',
      to: '2026-06-09',
      coachesCount: 1,
      classesCount: 2,
      attendanceCount: 30,
      totalPayMxn: 600,
      missingRateClasses: 1,
    })
    expect(report.items[0]).toMatchObject({
      name: 'Coach Demo',
      totalPayMxn: 600,
      missingRateClasses: 1,
    })
    expect(report.items[0].details[1]).toMatchObject({
      className: 'SLOW 10:00',
      status: 'missing_rate',
    })
  })
})
