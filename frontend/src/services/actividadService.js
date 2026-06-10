/**
 * actividadService.js
 * ─────────────────────────────────────────────────────
 * Servicio central para registrar eventos de actividad.
 * Todos los eventos pasan por aquí antes de guardarse.
 *
 * Cuando el backend esté listo:
 * 1. Tu compañero crea: GET /api/actividad y POST /api/actividad
 * 2. Descomentar las líneas marcadas con ← BACKEND
 * 3. El store sigue funcionando como cache optimista
 * ─────────────────────────────────────────────────────
 */
import { useActividadStore, TIPOS_EVENTO } from '@/stores/actividadStore'

// ← BACKEND: descomentar cuando el endpoint esté listo
// import { httpPost } from '@/lib/http'

function registrar(tipo, descripcion, usuarioNombre = null, usuarioId = null, meta = {}) {
  const { registrarEvento } = useActividadStore.getState()

  const evento = registrarEvento({ tipo, descripcion, usuarioNombre, usuarioId, meta })

  // ← BACKEND: descomentar cuando el endpoint esté listo
  // httpPost('/api/actividad', evento).catch(() => {
  //   // No romper la app si el backend falla
  // })

  return evento
}

// ── Funciones públicas por tipo de evento ──────────────────────────────────

export function logReservaCreada({ usuarioNombre, usuarioId, claseNombre, claseHora, claseDia }) {
  return registrar(
    TIPOS_EVENTO.RESERVA_CREADA,
    `${usuarioNombre} reservó ${claseNombre} · ${claseDia} ${claseHora}`,
    usuarioNombre,
    usuarioId,
    { claseNombre, claseHora, claseDia }
  )
}

export function logReservaCancelada({ usuarioNombre, usuarioId, claseNombre }) {
  return registrar(
    TIPOS_EVENTO.RESERVA_CANCELADA,
    `${usuarioNombre} canceló su reserva de ${claseNombre}`,
    usuarioNombre,
    usuarioId,
    { claseNombre }
  )
}

export function logUsuarioNuevo({ nombre, email }) {
  return registrar(
    TIPOS_EVENTO.USUARIO_NUEVO,
    `Nuevo usuario registrado: ${nombre}`,
    nombre,
    null,
    { email }
  )
}

export function logPaqueteVendido({ usuarioNombre, usuarioId, paqueteNombre, precio, metodoPago }) {
  return registrar(
    TIPOS_EVENTO.PAQUETE_VENDIDO,
    `Paquete "${paqueteNombre}" vendido a ${usuarioNombre} · $${precio.toLocaleString()}`,
    usuarioNombre,
    usuarioId,
    { paqueteNombre, precio, metodoPago }
  )
}

export function logInsumoVendido({ items, total, metodoPago }) {
  const resumen = items.map((i) => i.name).join(', ')
  return registrar(
    TIPOS_EVENTO.INSUMO_VENDIDO,
    `Venta POS: ${resumen} · $${total.toLocaleString()}`,
    null,
    null,
    { items, total, metodoPago }
  )
}

export function logCorteCaja({ total, efectivo, tarjeta, transferencia, ejecutadoPor }) {
  return registrar(
    TIPOS_EVENTO.CORTE_CAJA,
    `Corte de caja ejecutado · Total $${total.toLocaleString()}`,
    ejecutadoPor ?? 'Administrador',
    null,
    { total, efectivo, tarjeta, transferencia }
  )
}

export function logClaseCreada({ nombre, coachNombre, dia, hora }) {
  return registrar(
    TIPOS_EVENTO.CLASE_CREADA,
    `Nueva clase: ${nombre} · ${dia} ${hora} · ${coachNombre}`,
    coachNombre,
    null,
    { nombre, dia, hora }
  )
}

export function logClaseEliminada({ nombre, coachNombre }) {
  return registrar(
    TIPOS_EVENTO.CLASE_ELIMINADA,
    `Clase eliminada: ${nombre} · ${coachNombre}`,
    coachNombre,
    null,
    { nombre }
  )
}

export function logCoachAgregado({ nombre }) {
  return registrar(
    TIPOS_EVENTO.COACH_AGREGADO,
    `Nuevo coach agregado: ${nombre}`,
    nombre,
    null,
    { nombre }
  )
}

export function logCoachEliminado({ nombre }) {
  return registrar(
    TIPOS_EVENTO.COACH_ELIMINADO,
    `Coach eliminado: ${nombre}`,
    nombre,
    null,
    { nombre }
  )
}

export function logLoginAdmin({ nombre }) {
  return registrar(
    TIPOS_EVENTO.LOGIN_ADMIN,
    `Sesión iniciada por ${nombre ?? 'Administrador'}`,
    nombre ?? 'Administrador',
    null,
    {}
  )
}

export function logLoginCliente({ nombre, email }) {
  // [BACKEND] → POST /api/actividad
  // Registra el inicio de sesión de un cliente desde el portal.
  // Diferente de logLoginAdmin — usa TIPOS_EVENTO.LOGIN_CLIENTE.
  return registrar(
    TIPOS_EVENTO.LOGIN_CLIENTE,
    `Inicio de sesión: ${nombre ?? email}`,
    nombre ?? email,
    null,
    { email }
  )
}

export function logListaEsperaUnirse({ usuarioNombre, usuarioId, claseNombre, posicion }) {
  // [BACKEND] → POST /api/actividad
  return registrar(
    TIPOS_EVENTO.LISTA_ESPERA_UNIRSE,
    `${usuarioNombre} se unió a la lista de espera de ${claseNombre} (posición ${posicion})`,
    usuarioNombre,
    usuarioId,
    { claseNombre, posicion }
  )
}

export function logListaEsperaSalir({ usuarioNombre, usuarioId, claseNombre }) {
  // [BACKEND] → POST /api/actividad
  return registrar(
    TIPOS_EVENTO.LISTA_ESPERA_SALIR,
    `${usuarioNombre} salió de la lista de espera de ${claseNombre}`,
    usuarioNombre,
    usuarioId,
    { claseNombre }
  )
}
