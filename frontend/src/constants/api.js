const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? '/api/v1'

function withPrefix(path) {
  return `${BASE_URL}${API_PREFIX}${path}`
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
  claseById: (id) => withPrefix(`/clases/${id}`),
  claseDisponibilidad: (id) => withPrefix(`/clases/${id}/disponibilidad`),
  claseOcurrencias: (id, { from, to } = {}) =>
    withPrefix(`/clases/${id}/ocurrencias?from=${from ?? ''}&to=${to ?? ''}`),

  reservas: withPrefix('/reservas'),
  reservasMe: withPrefix('/reservas/me'),
  reservaById: (id) => withPrefix(`/reservas/${id}`),
  crearReserva: withPrefix('/reservas'),
  completarReserva: (id) => withPrefix(`/reservas/${id}/completar`),
  cancelarReserva: (id) => withPrefix(`/reservas/${id}/cancelar`),
  marcarNoAsistio: (id) => withPrefix(`/reservas/${id}/no-asistio`),

  waitlist: withPrefix('/lista-espera'),
  waitlistByClase: (claseId) => withPrefix(`/lista-espera?claseId=${claseId}`),
  waitlistByOccurrence: (occurrenceId) => withPrefix(`/lista-espera?occurrenceId=${occurrenceId}`),
  waitlistEntryById: (id) => withPrefix(`/lista-espera/${id}`),

  usuarios: withPrefix('/usuarios'),
  usuarioById: (id) => withPrefix(`/usuarios/${id}`),
  miPerfil: withPrefix('/usuarios/me'),
  miEstadoFinanciero: withPrefix('/clientes/me/estado-financiero'),

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
  coachById: (id) => withPrefix(`/coaches/${id}`),
  coachAgendaMe: ({ from, to }) => withPrefix(`/coaches/me/agenda?from=${from ?? ''}&to=${to ?? ''}`),

  reportes: withPrefix('/admin/reportes'),
  finanzas: withPrefix('/admin/finanzas'),
}
