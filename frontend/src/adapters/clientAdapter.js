function normalizeStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'inactive' || raw === 'inactivo') return 'inactive'
  return 'active'
}

function mapMembership(value) {
  if (!value || typeof value !== 'object') return null
  return {
    membershipId: value.membership_id ?? value.membershipId ?? null,
    packageId: value.package_id ?? value.packageId ?? null,
    packageName: value.package_name ?? value.packageName ?? null,
    creditsTotal: value.credits_total ?? value.creditsTotal ?? null,
    creditsAvailable: value.credits_available ?? value.creditsAvailable ?? null,
    expiresAt: value.expires_at ?? value.expiresAt ?? null,
    raw: value,
  }
}

function mapCreditMovement(item = {}) {
  return {
    id: item.id ?? item.movement_id ?? null,
    amount: Number(item.amount ?? 0),
    reason: item.reason ?? item.type ?? null,
    notes: item.notes ?? null,
    createdAt: item.created_at ?? item.createdAt ?? null,
    raw: item,
  }
}

function mapReservation(item = {}) {
  return {
    ...item,
    id: item.id ?? item.reservation_id ?? null,
    claseNombre: item.class_name ?? item.clase_nombre ?? item.claseNombre ?? 'Clase',
    fecha: item.occurrence_date ?? item.class_date ?? item.fecha ?? null,
    startAt: item.start_at ?? item.class_start_at ?? item.startAt ?? null,
    estado: item.status ?? item.estado ?? null,
  }
}

export function mapBackendClientToFrontend(item = {}) {
  const name = item.name ?? item.nombre ?? ''
  const phone = item.phone ?? item.telefono ?? null
  const status = normalizeStatus(item.status ?? item.estado)
  const creditsBalance = Number(item.credits_balance ?? item.creditsBalance ?? item.creditos ?? 0)
  const activeMembership = mapMembership(item.active_membership ?? item.activeMembership ?? item.membresia)
  const packageName = activeMembership?.packageName ?? null

  return {
    id: item.id ?? null,
    name,
    nombre: name,
    email: item.email ?? '',
    phone,
    telefono: phone,
    role: item.role ?? item.rol ?? 'cliente',
    rol: item.role ?? item.rol ?? 'cliente',
    status,
    estado: status,
    activo: status === 'active',
    creditsBalance,
    creditos: creditsBalance,
    clasesPaquete: activeMembership?.creditsAvailable ?? creditsBalance,
    clasesPaqueteTotal: activeMembership?.creditsTotal ?? null,
    activeMembership,
    membresia: activeMembership,
    paqueteActivo: activeMembership,
    paquete: packageName,
    paqueteInfo: activeMembership
      ? {
          packageId: activeMembership.packageId,
          fechaVencimiento: activeMembership.expiresAt,
          creditsTotal: activeMembership.creditsTotal,
        }
      : null,
    lastVisit: item.last_visit ?? item.lastVisit ?? null,
    reservationsCount: Number(item.reservations_count ?? item.reservationsCount ?? 0),
    recentCreditMovements: (item.recent_credit_movements ?? item.recentCreditMovements ?? []).map(mapCreditMovement),
    recentReservations: (item.recent_reservations ?? item.recentReservations ?? []).map(mapReservation),
    raw: item,
  }
}

export function mapBackendClientsToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendClientToFrontend)
}
