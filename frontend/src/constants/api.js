/**
 * api.js
 * ─────────────────────────────────────────────────────
 * Configuración central de conexión con el backend.
 *
 * ✅ CÓMO CONECTAR EL BACKEND CUANDO ESTÉ LISTO:
 *    1. Cambia BASE_URL por la URL real del servidor
 *    2. Ajusta los ENDPOINTS si el backend usa rutas distintas
 *    3. No necesitas tocar ningún otro archivo
 *
 * Estado actual: sin backend (mock)
 * ─────────────────────────────────────────────────────
 */

// 🔧 CAMBIAR ESTA LÍNEA cuando el backend esté listo
export const BASE_URL = 'http://localhost:3000'

export const ENDPOINTS = {
  //── Autenticación ──────────────────────────────────
  login:    `${BASE_URL}/api/auth/login`,
  registro: `${BASE_URL}/api/auth/registro`,
  logout:   `${BASE_URL}/api/auth/logout`,

  //── Clases ─────────────────────────────────────────
  clases:              `${BASE_URL}/api/clases`,
  claseById:           (id) => `${BASE_URL}/api/clases/${id}`,
  claseDisponibilidad: (id) => `${BASE_URL}/api/clases/${id}/disponibilidad`,

  //── Reservas ───────────────────────────────────────
  reservas:        `${BASE_URL}/api/reservas`,
  reservaById:     (id) => `${BASE_URL}/api/reservas/${id}`,
  cancelarReserva: (id) => `${BASE_URL}/api/reservas/${id}/cancelar`,
  marcarNoAsistio: (id) => `${BASE_URL}/api/reservas/${id}/no-asistio`,

  //── Usuarios ───────────────────────────────────────
  usuarios:    `${BASE_URL}/api/usuarios`,
  usuarioById: (id) => `${BASE_URL}/api/usuarios/${id}`,
  miPerfil:    `${BASE_URL}/api/usuarios/me`,

  //── Paquetes ───────────────────────────────────────
  paquetes:       `${BASE_URL}/api/paquetes`,
  comprarPaquete: `${BASE_URL}/api/paquetes/comprar`,

  //── Productos ──────────────────────────────────────
  productos:       `${BASE_URL}/api/productos`,
  productoById:    (id) => `${BASE_URL}/api/productos/${id}`,
  descontarStock:  (id) => `${BASE_URL}/api/productos/${id}/descontar-stock`,

  //── Transacciones ───────────────────────────────────
  transacciones:      `${BASE_URL}/api/transacciones`,
  transaccionesMes:   (año, mes) => `${BASE_URL}/api/transacciones?año=${año}&mes=${mes}`,

  //── Cortes de caja ──────────────────────────────────
  cortes:        `${BASE_URL}/api/cortes`,
  ejecutarCorte: `${BASE_URL}/api/cortes/ejecutar`,

  //── Notificaciones ──────────────────────────────────
  notificaciones:       `${BASE_URL}/api/notificaciones`,
  marcarLeida:          (id) => `${BASE_URL}/api/notificaciones/${id}/leida`,

  //── Coaches ────────────────────────────────────────
  coaches:   `${BASE_URL}/api/coaches`,
  coachById: (id) => `${BASE_URL}/api/coaches/${id}`,

  //── Admin ──────────────────────────────────────────
  reportes: `${BASE_URL}/api/admin/reportes`,
  finanzas: `${BASE_URL}/api/admin/finanzas`,
}
