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
import { useListaEsperaStore }    from '@/stores/listaEsperaStore'
import { ESTADOS_RESERVA, TIPOS_NOTIFICACION } from '@/data/mockData'
import { hoyLocal } from '@/utils/fecha'
import { logReservaCreada, logReservaCancelada } from '@/services/actividadService'
import {
  emailReservaConfirmada,
  emailReservaCancelada,
  emailLugarAsignado,
} from '@/services/emailService'

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
    fecha:       clase.fecha ?? calcularFechaClase(clase.dia),
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
    fecha:   hoyLocal(),
  })

  // 9. Notificar al admin si la clase llega al 80% de capacidad
  const nuevoCupo = clase.cupoActual + 1
  if (nuevoCupo / clase.cupoMax >= 0.8) {
    notifStore.agregarNotificacion({
      userId:  3,
      tipo:    TIPOS_NOTIFICACION.SISTEMA,
      titulo:  'Clase casi llena',
      mensaje: `${clase.nombre} del ${clase.dia} está al ${Math.round((nuevoCupo / clase.cupoMax) * 100)}% de capacidad.`,
      fecha:   hoyLocal(),
    })
  }

  logReservaCreada({
    usuarioNombre: usuario?.nombre ?? `Usuario #${userId}`,
    usuarioId:     userId,
    claseNombre:   clase.nombre,
    claseHora:     clase.hora,
    claseDia:      clase.dia,
  })

  // 10. Email de confirmación de reserva
  // [BACKEND] → POST /api/email/send { plantilla: 'reserva_confirmada' }
  if (usuario?.email) {
    emailReservaConfirmada({
      nombre:      usuario.nombre ?? 'Cliente',
      email:       usuario.email,
      claseNombre: clase.nombre,
      coachNombre: clase.coachNombre ?? '—',
      dia:         clase.dia,
      hora:        clase.hora,
      fecha:       clase.fecha ?? null,
      asiento:     asiento ?? null, // [BACKEND] pasar asiento cuando SeatSelector lo guarde
    }).catch(() => {})
  }

  return { ok: true }
}

/**
 * Cancela una reserva confirmada.
 * Devuelve el crédito al usuario y reduce el cupoActual.
 * Si hay personas en lista de espera, asigna automáticamente
 * el lugar al primero y le envía un email.
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
  const claseId = reserva.claseId
  clasesStore.actualizarCupo(claseId, -1)

  logReservaCancelada({
    usuarioNombre: usuario?.nombre ?? `Usuario #${userId}`,
    usuarioId:     userId,
    claseNombre:   reserva.claseNombre ?? 'Clase',
  })

  // Email de confirmación de cancelación
  // [BACKEND] → POST /api/email/send { plantilla: 'reserva_cancelada' }
  const claseCancel = clasesStore.clases.find(c => c.id === claseId)
  if (usuario?.email && claseCancel) {
    emailReservaCancelada({
      nombre:      usuario.nombre ?? 'Cliente',
      email:       usuario.email,
      claseNombre: claseCancel.nombre,
      dia:         claseCancel.dia,
      hora:        claseCancel.hora,
    }).catch(() => {})
  }

  // ── Asignación automática de lista de espera ──────────
  // Cuando alguien cancela, el primero en lista de espera
  // recibe el lugar AUTOMÁTICAMENTE sin necesidad de confirmar.
  // [BACKEND] → Este proceso lo maneja el backend con un trigger
  // en la tabla de reservas. El backend también envía el email.
  // En frontend: simular la asignación directa.
  const listaStore  = useListaEsperaStore.getState()
  const listaEspera = listaStore.getPorClase(claseId)

  if (listaEspera.length > 0) {
    const primero   = listaEspera[0]
    const claseObj  = clasesStore.clases.find(c => c.id === claseId)
    const uEspera   = usuariosStore.usuarios.find(u => u.id === primero.userId)

    // 1. Crear la reserva automáticamente para el primero en lista
    const { agregarReserva } = useReservasStore.getState()
    agregarReserva({
      userId:      primero.userId,
      claseId,
      claseNombre: claseObj?.nombre ?? '—',
      claseHora:   claseObj?.hora ?? '—',
      claseDia:    claseObj?.dia ?? '—',
      coachNombre: claseObj?.coachNombre ?? '—',
      tipo:        claseObj?.tipo ?? '—',
      asiento:     null,
      estado:      'confirmada',
      fecha:       claseObj?.fecha ?? new Date().toISOString().split('T')[0],
    })

    // 2. Descontar un crédito al usuario asignado (si no es ilimitado)
    if (uEspera && uEspera.clasesPaquete !== 999) {
      usuariosStore.editarUsuario(primero.userId, {
        clasesPaquete: Math.max(0, (uEspera.clasesPaquete ?? 0) - 1),
      })
    }

    // 3. El cupo: cancelarReserva lo bajó en -1, la nueva reserva lo sube +1 → neto 0.
    //    Restaurar cupoActual al valor antes de la cancelación.
    clasesStore.actualizarCupo(claseId, 1)

    // 4. Eliminar al usuario de la lista de espera
    listaStore.salir({ claseId, userId: primero.userId })

    // 5. Registrar en actividad
    import('@/services/actividadService').then(({ logReservaCreada: logRA }) => {
      logRA({
        usuarioNombre: primero.nombre,
        usuarioId:     primero.userId,
        claseNombre:   claseObj?.nombre ?? '—',
        claseHora:     claseObj?.hora ?? '—',
        claseDia:      claseObj?.dia ?? '—',
      })
    })

    // 6. Email al usuario asignado automáticamente
    // [BACKEND] → POST /api/email/send { plantilla: 'lista_espera_lugar' }
    if (uEspera?.email) {
      import('@/services/emailService').then(({ emailLugarAsignado: emailLA }) => {
        emailLA({
          nombre:      primero.nombre,
          email:       uEspera.email,
          claseNombre: claseObj?.nombre ?? '—',
          coachNombre: claseObj?.coachNombre ?? '—',
          dia:         claseObj?.dia ?? '—',
          hora:        claseObj?.hora ?? '—',
          fecha:       claseObj?.fecha ?? null,
        }).catch(() => {})
      })
    }

    console.info(
      `[listaEspera] ✅ Lugar asignado automáticamente a` +
      ` ${primero.nombre} en clase ${claseObj?.nombre}`
    )
  }

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

/**
 * Elimina una clase y cancela todas sus reservas confirmadas.
 * Usar en lugar de llamar clasesStore.eliminarClase directamente.
 */
export function eliminarClaseConReservas(claseId) {
  const reservasStore = useReservasStore.getState()
  const clasesStore   = useClasesStore.getState()

  reservasStore.cancelarReservasByClase(claseId)
  clasesStore.eliminarClase(claseId)
  useListaEsperaStore.getState().limpiarClase(claseId)
  // [BACKEND] → DEL /api/lista-espera?claseId=X
}
