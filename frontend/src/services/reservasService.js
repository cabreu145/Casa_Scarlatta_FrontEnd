/**
 * reservasService.js
 * ─────────────────────────────────────────────────────
 * Orquesta la lógica de reservas entre múltiples stores.
 * Es la única fuente de lógica de negocio para reservar,
 * cancelar y marcar no asistió. Los componentes solo llaman
 * estas funciones y leen el resultado.
 *
 * Usado en: SeatSelector, ClientPanel, AdminClases
 * Depende de: reservasStore, clasesStore, usuariosStore,
 *             notificacionesStore, authStore, mockData
 * ─────────────────────────────────────────────────────
 */
import { useReservasStore }       from '@/stores/reservasStore'
import { useClasesStore }         from '@/stores/clasesStore'
import { useUsuariosStore }       from '@/stores/usuariosStore'
import { useNotificacionesStore } from '@/stores/notificacionesStore'
import { useAuthStore }           from '@/stores/authStore'
import { ESTADOS_RESERVA, TIPOS_NOTIFICACION } from '@/data/mockData'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function calcularFechaClase(dia) {
  const hoy    = new Date()
  const diaIdx = DIAS.indexOf(dia)
  const hoyIdx = hoy.getDay()
  const diff   = diaIdx - hoyIdx
  const fecha  = new Date(hoy)
  fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))
  return fecha.toISOString().split('T')[0]
}

/**
 * Reserva un lugar en una clase para un usuario.
 * Valida créditos, cupo y duplicados antes de actuar.
 * @param {number}      userId
 * @param {number}      claseId
 * @param {string|null} asiento - etiqueta del asiento elegido
 * @returns {{ ok: boolean, error?: string }}
 */
export function reservarClase(userId, claseId, asiento = null) {
  const usuariosStore = useUsuariosStore.getState()
  const clasesStore   = useClasesStore.getState()
  const reservasStore = useReservasStore.getState()
  const notifStore    = useNotificacionesStore.getState()
  const authStore     = useAuthStore.getState()

  // 1. Validar usuario
  const usuario = usuariosStore.getUsuarioById(userId)
  if (!usuario) return { ok: false, error: 'Usuario no encontrado' }

  // 2. Validar créditos
  const esIlimitado = usuario.clasesPaquete === 999
  if (!esIlimitado && (!usuario.clasesPaquete || usuario.clasesPaquete <= 0)) {
    return { ok: false, error: 'Sin créditos disponibles' }
  }

  // 3. Validar clase y cupo
  const clase = clasesStore.getById(claseId)
  if (!clase) return { ok: false, error: 'Clase no encontrada' }
  if (clase.cupoActual >= clase.cupoMax) return { ok: false, error: 'La clase está llena' }

  // 4. Validar no duplicado
  const reservasUsuario = reservasStore.getReservasByUsuario(userId)
  const duplicado = reservasUsuario.find(
    (r) => r.claseId === claseId && r.estado === ESTADOS_RESERVA.CONFIRMADA
  )
  if (duplicado) return { ok: false, error: 'Ya tienes una reserva en esta clase' }

  // 5. Crear reserva en reservasStore
  reservasStore.agregarReserva({
    userId,
    claseId,
    claseNombre: clase.nombre,
    claseHora:   clase.hora,
    claseDia:    clase.dia,
    coachNombre: clase.coachNombre,
    tipo:        clase.tipo,
    asiento,
    estado:      ESTADOS_RESERVA.CONFIRMADA,
    fecha:       calcularFechaClase(clase.dia),
  })

  // 6. Descontar crédito
  if (!esIlimitado) {
    usuariosStore.descontarCredito(userId)
    authStore.actualizarClasesPaquete(-1)
  }

  // 7. Aumentar cupoActual en clasesStore
  clasesStore.actualizarCupo(claseId, 1)

  // 8. Notificar al coach
  notifStore.agregarNotificacion({
    userId:  clase.coachId,
    tipo:    TIPOS_NOTIFICACION.RESERVA,
    titulo:  'Nueva reserva',
    mensaje: `${usuario.nombre} reservó ${clase.nombre} del ${clase.dia}.`,
    fecha:   new Date().toISOString().split('T')[0],
  })

  // 9. Notificar al admin si la clase llega al 80% de capacidad
  const nuevoCupo = clase.cupoActual + 1
  if (nuevoCupo / clase.cupoMax >= 0.8) {
    notifStore.agregarNotificacion({
      userId:  3,
      tipo:    TIPOS_NOTIFICACION.SISTEMA,
      titulo:  'Clase casi llena',
      mensaje: `${clase.nombre} del ${clase.dia} está al ${Math.round((nuevoCupo / clase.cupoMax) * 100)}% de capacidad.`,
      fecha:   new Date().toISOString().split('T')[0],
    })
  }

  return { ok: true }
}

/**
 * Cancela una reserva confirmada.
 * Devuelve el crédito al usuario y reduce el cupoActual.
 * @returns {{ ok: boolean, error?: string }}
 */
export function cancelarReserva(reservaId, userId) {
  const reservasStore = useReservasStore.getState()
  const clasesStore   = useClasesStore.getState()
  const usuariosStore = useUsuariosStore.getState()
  const authStore     = useAuthStore.getState()

  const reserva = reservasStore.reservas.find(
    (r) => r.id === reservaId && r.userId === userId
  )
  if (!reserva) return { ok: false, error: 'Reserva no encontrada' }
  if (reserva.estado !== ESTADOS_RESERVA.CONFIRMADA) {
    return { ok: false, error: 'Solo se pueden cancelar reservas confirmadas' }
  }

  const ok = reservasStore.cancelarReserva(reservaId, userId)
  if (!ok) return { ok: false, error: 'No se pudo cancelar la reserva' }

  // Devolver crédito si no es ilimitado
  const usuario = usuariosStore.getUsuarioById(userId)
  if (usuario && usuario.clasesPaquete !== 999) {
    usuariosStore.devolverCredito(userId)
    authStore.actualizarClasesPaquete(1)
  }

  // Reducir cupoActual
  clasesStore.actualizarCupo(reserva.claseId, -1)

  return { ok: true }
}

/**
 * Marca a un alumno como no asistió.
 * Solo aplica a reservas confirmadas. No devuelve crédito.
 * @returns {{ ok: boolean, error?: string }}
 */
export function marcarNoAsistio(reservaId) {
  const reservasStore = useReservasStore.getState()

  const reserva = reservasStore.reservas.find((r) => r.id === reservaId)
  if (!reserva) return { ok: false, error: 'Reserva no encontrada' }
  if (reserva.estado !== ESTADOS_RESERVA.CONFIRMADA) {
    return { ok: false, error: 'Solo aplica a reservas confirmadas' }
  }

  reservasStore.marcarNoAsistio(reservaId)
  return { ok: true }
}
