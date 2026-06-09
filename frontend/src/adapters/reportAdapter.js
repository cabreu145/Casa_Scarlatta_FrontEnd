function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.coaches)) return value.coaches
  if (Array.isArray(value?.packages)) return value.packages
  if (Array.isArray(value?.top_classes)) return value.top_classes
  if (Array.isArray(value?.topClasses)) return value.topClasses
  if (Array.isArray(value?.disciplines)) return value.disciplines
  return []
}

function normalizePaymentMethods(payload = {}) {
  const methods = payload.payment_methods ?? payload.paymentMethods ?? {}
  return {
    cashMxn: toNumber(methods.cash_mxn ?? methods.cashMxn ?? payload.cash_mxn ?? payload.cashMxn, 0),
    cardMxn: toNumber(methods.card_mxn ?? methods.cardMxn ?? payload.card_mxn ?? payload.cardMxn, 0),
    transferMxn: toNumber(methods.transfer_mxn ?? methods.transferMxn ?? payload.transfer_mxn ?? payload.transferMxn, 0),
    otherMxn: toNumber(methods.other_mxn ?? methods.otherMxn ?? payload.other_mxn ?? payload.otherMxn, 0),
  }
}

function mapFinanceSummary(payload = {}) {
  return {
    salesTotalMxn: toNumber(
      payload.sales_total_mxn ??
      payload.salesTotalMxn ??
      payload.sales?.total_mxn ??
      payload.sales?.totalMxn,
      0
    ),
    expensesTotalMxn: toNumber(
      payload.expenses_total_mxn ??
      payload.expensesTotalMxn ??
      payload.expenses?.total_mxn ??
      payload.expenses?.totalMxn,
      0
    ),
    netTotalMxn: toNumber(
      payload.net_total_mxn ??
      payload.netTotalMxn ??
      payload.net?.total_mxn ??
      payload.net?.totalMxn,
      0
    ),
    averageTicketMxn: toNumber(
      payload.average_ticket_mxn ??
      payload.averageTicketMxn ??
      payload.ticket_average_mxn ??
      payload.ticketAverageMxn ??
      payload.average_ticket ??
      payload.ticket_average,
      0
    ),
    salesCount: toNumber(payload.sales_count ?? payload.salesCount ?? payload.sales?.count, 0),
    cashClosingsCount: toNumber(
      payload.cash_closings_count ??
      payload.cashClosingsCount ??
      payload.cash_closing_count ??
      payload.cashClosingCount,
      0
    ),
    paymentMethods: normalizePaymentMethods(payload),
    raw: payload,
  }
}

export function mapBackendFinanceReportToFrontend(payload = {}) {
  return {
    from: payload.from ?? payload.fecha_inicio ?? payload.fechaInicio ?? null,
    to: payload.to ?? payload.fecha_fin ?? payload.fechaFin ?? null,
    summary: mapFinanceSummary(payload),
    raw: payload,
  }
}

export function mapBackendUsersReportToFrontend(payload = {}) {
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    activeClients: toNumber(payload.active_clients ?? payload.activeClients, 0),
    inactiveClients: toNumber(payload.inactive_clients ?? payload.inactiveClients, 0),
    newClients: toNumber(payload.new_clients ?? payload.newClients, 0),
    clientsWithActiveMembership: toNumber(
      payload.clients_with_active_membership ?? payload.clientsWithActiveMembership,
      0
    ),
    clientsWithoutMembership: toNumber(
      payload.clients_without_membership ?? payload.clientsWithoutMembership,
      0
    ),
    clientsWithCredits: toNumber(payload.clients_with_credits ?? payload.clientsWithCredits, 0),
    clientsWithoutCredits: toNumber(
      payload.clients_without_credits ?? payload.clientsWithoutCredits,
      0
    ),
    raw: payload,
  }
}

function mapPackageTop(item = {}) {
  if (!item || typeof item !== 'object') return null
  return {
    id: item.id ?? item.package_id ?? item.packageId ?? null,
    name: normalizeString(item.name ?? item.package_name ?? item.packageName, ''),
    displayName: normalizeString(item.display_name ?? item.displayName, ''),
    soldCount: toNumber(item.sold_count ?? item.soldCount ?? item.quantity_sold ?? item.quantitySold, 0),
    revenueMxn: toNumber(item.revenue_mxn ?? item.revenueMxn, 0),
    shareable: Boolean(item.is_shareable ?? item.isShareable ?? false),
    beneficiariesAssigned: toNumber(item.beneficiaries_assigned ?? item.beneficiariesAssigned, 0),
    raw: item,
  }
}

export function mapBackendPackagesReportToFrontend(payload = {}) {
  const topPackage = payload.top_package ?? payload.topPackage ?? null
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    packagesSold: toNumber(payload.packages_sold ?? payload.packagesSold, 0),
    packagesRevenueMxn: toNumber(payload.packages_revenue_mxn ?? payload.packagesRevenueMxn, 0),
    shareablePackagesSold: toNumber(
      payload.shareable_packages_sold ?? payload.shareablePackagesSold,
      0
    ),
    beneficiariesAssigned: toNumber(payload.beneficiaries_assigned ?? payload.beneficiariesAssigned, 0),
    topPackage: topPackage ? mapPackageTop(topPackage) : null,
    raw: payload,
  }
}

function mapPosCategory(item = {}) {
  return {
    category: normalizeString(item.category ?? item.name ?? item.product_category, 'Sin categoría'),
    totalMxn: toNumber(item.total_mxn ?? item.totalMxn, 0),
    itemsSold: toNumber(item.items_sold ?? item.itemsSold, 0),
    raw: item,
  }
}

export function mapBackendPosReportToFrontend(payload = {}) {
  const productCategories = normalizeArray(payload.product_categories ?? payload.productCategories)
    .map(mapPosCategory)
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    salesCount: toNumber(payload.sales_count ?? payload.salesCount, 0),
    averageTicketMxn: toNumber(payload.average_ticket_mxn ?? payload.averageTicketMxn, 0),
    productsSold: toNumber(payload.products_sold ?? payload.productsSold, 0),
    productRevenueMxn: toNumber(payload.product_revenue_mxn ?? payload.productRevenueMxn, 0),
    packageRevenueMxn: toNumber(payload.package_revenue_mxn ?? payload.packageRevenueMxn, 0),
    paymentMethods: normalizePaymentMethods(payload),
    productCategories,
    raw: payload,
  }
}

function mapCoachItem(item = {}) {
  const id = item.coach_id ?? item.coachId ?? item.id ?? null
  return {
    coachId: id,
    name: normalizeString(item.name ?? item.coach_name ?? item.coachName, 'Coach'),
    classesCount: toNumber(item.classes_count ?? item.classesCount, 0),
    reservationsCount: toNumber(item.reservations_count ?? item.reservationsCount, 0),
    attendanceCount: toNumber(item.attendance_count ?? item.attendanceCount, 0),
    noShowCount: toNumber(item.no_show_count ?? item.noShowCount, 0),
    averageOccupancyPct: toNumber(item.average_occupancy_pct ?? item.averageOccupancyPct, 0),
    primaryDiscipline: normalizeString(item.primary_discipline ?? item.primaryDiscipline, ''),
    disciplines: Array.isArray(item.disciplines) ? item.disciplines : [],
    raw: item,
  }
}

export function mapBackendCoachesReportToFrontend(payload = {}) {
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    items: normalizeArray(payload).map(mapCoachItem),
    raw: payload,
  }
}

function mapTopClassItem(item = {}) {
  const id = item.class_id ?? item.classId ?? item.id ?? null
  return {
    classId: id,
    name: normalizeString(item.name ?? item.class_name ?? item.className, 'Clase'),
    discipline: normalizeString(item.discipline ?? item.primary_discipline ?? item.primaryDiscipline, ''),
    reservationsCount: toNumber(item.reservations_count ?? item.reservationsCount, 0),
    capacityTotal: toNumber(item.capacity_total ?? item.capacityTotal ?? item.capacity_max ?? item.capacityMax, 0),
    occupancyPct: toNumber(item.occupancy_pct ?? item.occupancyPct, 0),
    occurrencesCount: toNumber(item.occurrences_count ?? item.occurrencesCount, 0),
    raw: item,
  }
}

export function mapBackendTopClassesReportToFrontend(payload = {}) {
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    items: normalizeArray(payload).map(mapTopClassItem),
    raw: payload,
  }
}

function mapOccupancyItem(item = {}) {
  return {
    discipline: normalizeString(item.primary_discipline ?? item.primaryDiscipline ?? item.discipline, 'Sin disciplina'),
    occurrencesCount: toNumber(item.occurrences_count ?? item.occurrencesCount, 0),
    reservationsCount: toNumber(item.reservations_count ?? item.reservationsCount, 0),
    capacityTotal: toNumber(item.capacity_total ?? item.capacityTotal, 0),
    occupancyPct: toNumber(item.occupancy_pct ?? item.occupancyPct, 0),
    raw: item,
  }
}

export function mapBackendOccupancyByDisciplineReportToFrontend(payload = {}) {
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    items: normalizeArray(payload).map(mapOccupancyItem),
    raw: payload,
  }
}
