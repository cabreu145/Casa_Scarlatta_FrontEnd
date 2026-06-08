const BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').trim()
const API_PREFIX = String(import.meta.env.VITE_API_PREFIX ?? '/api/v1').trim()

function withPrefix(path) {
  return `${BASE_URL}${API_PREFIX}${path}`
}

function withQuery(path, query = {}) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    params.set(key, String(value))
  })
  const qs = params.toString()
  return withPrefix(qs ? `${path}?${qs}` : path)
}

export { BASE_URL, API_PREFIX }

export const ENDPOINTS = {
  login: withPrefix('/auth/login'),
  registro: withPrefix('/auth/registro'),
  logout: withPrefix('/auth/logout'),
  me: withPrefix('/auth/me'),
  resetPasswordRequest: withPrefix('/auth/reset-password/request'),
  resetPasswordConfirm: withPrefix('/auth/reset-password/confirm'),

  clases: withPrefix('/clases'),
  clasesList: withPrefix('/clases'),
  clasesPaginated: ({ page, pageSize, search, discipline, status, coach_id }) =>
    withQuery('/clases', { page, page_size: pageSize, search, discipline, status, coach_id }),
  claseById: (id) => withPrefix(`/clases/${id}`),
  claseDisponibilidad: (id) => withPrefix(`/clases/${id}/disponibilidad`),
  claseOcurrencias: (id, { from, to } = {}) =>
    withPrefix(`/clases/${id}/ocurrencias?from=${from ?? ''}&to=${to ?? ''}`),

  reservas: withPrefix('/reservas'),
  reservasMe: withPrefix('/reservas/me'),
  reservasMePaginated: ({ page, pageSize, status, from, to }) =>
    withQuery('/reservas/me', { page, page_size: pageSize, status, from, to }),
  reservaById: (id) => withPrefix(`/reservas/${id}`),
  crearReserva: withPrefix('/reservas'),
  completarReserva: (id) => withPrefix(`/reservas/${id}/completar`),
  cancelarReserva: (id) => withPrefix(`/reservas/${id}/cancelar`),
  marcarNoAsistio: (id) => withPrefix(`/reservas/${id}/no-asistio`),
  occurrenceSpots: (occurrenceId) => withPrefix(`/reservas/ocurrencias/${occurrenceId}/spots`),
  spotHolds: withPrefix('/reservas/holds'),
  spotHoldById: (holdId) => withPrefix(`/reservas/holds/${holdId}`),

  waitlist: withPrefix('/lista-espera'),
  waitlistByClase: (claseId) => withPrefix(`/lista-espera?claseId=${claseId}`),
  waitlistByOccurrence: (occurrenceId) => withPrefix(`/lista-espera?occurrenceId=${occurrenceId}`),
  waitlistEntryById: (id) => withPrefix(`/lista-espera/${id}`),

  usuarios: withPrefix('/usuarios'),
  usuarioById: (id) => withPrefix(`/usuarios/${id}`),
  miPerfil: withPrefix('/usuarios/me'),
  miEstadoFinanciero: withPrefix('/clientes/me/estado-financiero'),
  miCreditMovements: ({ page, pageSize }) =>
    withQuery('/clientes/me/credit-movements', { page, page_size: pageSize }),
  clientPayments: ({ page, pageSize, status } = {}) =>
    withQuery('/clientes/me/pagos', { page, page_size: pageSize, status }),
  clientMemberships: withPrefix('/clientes/me/memberships'),
  clientMembershipBeneficiaries: (membershipId) =>
    withPrefix(`/clientes/me/memberships/${membershipId}/beneficiaries`),
  clientMembershipBeneficiaryById: (membershipId, beneficiaryId) =>
    withPrefix(`/clientes/me/memberships/${membershipId}/beneficiaries/${beneficiaryId}`),
  adminClients: withPrefix('/clientes'),
  adminClientsPaginated: ({ page, pageSize, search, status, membershipStatus }) =>
    withQuery('/clientes', {
      page,
      page_size: pageSize,
      search,
      status,
      membership_status: membershipStatus,
    }),
  adminClientById: (id) => withPrefix(`/clientes/${id}`),
  adminClientPackages: (id) => withPrefix(`/clientes/${id}/paquetes`),
  adminClientCredits: (id) => withPrefix(`/clientes/${id}/credits`),
  adminClientMembershipBeneficiaries: (clientId, membershipId) =>
    withPrefix(`/clientes/${clientId}/memberships/${membershipId}/beneficiaries`),
  adminClientMembershipBeneficiaryById: (clientId, membershipId, beneficiaryId) =>
    withPrefix(`/clientes/${clientId}/memberships/${membershipId}/beneficiaries/${beneficiaryId}`),

  membershipsPackages: withPrefix('/memberships/packages'),
  adminMembershipPackagesPaginated: ({ page, pageSize, search, status }) =>
    withQuery('/memberships/packages', { page, page_size: pageSize, search, status }),
  adminMembershipPackageById: (id) => withPrefix(`/memberships/packages/${id}`),
  adminMembershipPackageStatusById: (id) => withPrefix(`/memberships/packages/${id}/status`),
  adminMembershipPackageFeaturedById: (id) => withPrefix(`/memberships/packages/${id}/featured`),
  paquetes: withPrefix('/paquetes'),
  comprarPaquete: withPrefix('/paquetes/comprar'),

  productos: withPrefix('/productos'),
  productoById: (id) => withPrefix(`/productos/${id}`),
  descontarStock: (id) => withPrefix(`/productos/${id}/descontar-stock`),

  transacciones: withPrefix('/transacciones'),
  transaccionesMes: (anio, mes) => withPrefix(`/transacciones?anio=${anio}&mes=${mes}`),

  cortes: withPrefix('/cortes'),
  ejecutarCorte: withPrefix('/cortes/ejecutar'),

  notificaciones: withPrefix('/notificaciones'),
  marcarLeida: (id) => withPrefix(`/notificaciones/${id}/leida`),

  coaches: withPrefix('/coaches'),
  coachesPaginated: ({ page, pageSize, search, status }) =>
    withQuery('/coaches', { page, page_size: pageSize, search, status }),
  publicCoaches: withPrefix('/coaches/public'),
  uploadCoachAvatar: (id) => withPrefix(`/coaches/${id}/avatar`),
  coachById: (id) => withPrefix(`/coaches/${id}`),
  coachStatusById: (id) => withPrefix(`/coaches/${id}/status`),
  coachAgendaMe: ({ from, to }) => withPrefix(`/coaches/me/agenda?from=${from ?? ''}&to=${to ?? ''}`),

  createPaymentCheckoutPreference: withPrefix('/pagos/checkout-preference'),
  getPaymentStatus: ({ externalReference }) =>
    withPrefix(`/pagos/estado?external_reference=${externalReference ?? ''}`),

  reportes: withPrefix('/admin/reportes'),
  finanzas: withPrefix('/admin/finanzas'),
}
