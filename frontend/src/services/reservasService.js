import { useReservasStore } from '@/stores/reservasStore'
import { useClasesStore } from '@/stores/clasesStore'
import { useUsuariosStore } from '@/stores/usuariosStore'
import { useNotificacionesStore } from '@/stores/notificacionesStore'
import { useAuthStore } from '@/stores/authStore'
import { useListaEsperaStore } from '@/stores/listaEsperaStore'
import { ESTADOS_RESERVA, TIPOS_NOTIFICACION } from '@/data/mockData'
import { hoyLocal } from '@/utils/fecha'
import { logReservaCreada, logReservaCancelada } from '@/services/actividadService'
import {
  emailReservaConfirmada,
  emailReservaCancelada,
  emailLugarAsignado,
} from '@/services/emailService'
import {
  cancelarReservaApi,
  completarReservaApi,
  crearReservaApi,
  getMisReservasApi,
  marcarNoAsistioApi,
} from '@/services/reservasApiService'

const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
const useApiWaitlist = import.meta.env.VITE_USE_API_WAITLIST === 'true'
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function calcularFechaClase(dia) {
  const hoy = new Date()
  const diaIdx = DIAS.indexOf(dia)
  const hoyIdx = hoy.getDay()
  const diff = diaIdx - hoyIdx
  const fecha = new Date(hoy)
  fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))
  return fecha.toISOString().split('T')[0]
}

async function syncReservasFromApi() {
  const reservas = await getMisReservasApi()
  useReservasStore.getState().setReservas(reservas)
  return reservas
}

export async function reservarClase(userId, claseId, asiento = null, occurrenceId = null) {
  if (useApiReservations) {
    try {
      const reserva = await crearReservaApi({ claseId, userId, asiento, occurrenceId })
      await syncReservasFromApi()
      try {
        await useClasesStore.getState().loadClasesFromApi?.()
      } catch {
        // noop
      }
      if (import.meta.env.DEV) {
        console.info('[reservarClase][api] reserva creada', reserva)
      }
      return { ok: true }
    } catch (err) {
      if (import.meta.env.DEV && err?.details) {
        console.error('[reservarClase][api] error details', err.details)
      }
      return { ok: false, error: err.message || 'No se pudo crear la reserva' }
    }
  }

  const usuariosStore = useUsuariosStore.getState()
  const clasesStore = useClasesStore.getState()
  const reservasStore = useReservasStore.getState()
  const notifStore = useNotificacionesStore.getState()
  const authStore = useAuthStore.getState()

  const usuario = usuariosStore.getUsuarioById(userId)
  if (!usuario) return { ok: false, error: 'Usuario no encontrado' }

  const esIlimitado = usuario.clasesPaquete === 999
  if (!esIlimitado && (!usuario.clasesPaquete || usuario.clasesPaquete <= 0)) {
    return { ok: false, error: 'Sin créditos disponibles' }
  }

  const clase = clasesStore.getById(claseId)
  if (!clase) return { ok: false, error: 'Clase no encontrada' }
  if (clase.cupoActual >= clase.cupoMax) return { ok: false, error: 'La clase está llena' }

  const reservasUsuario = reservasStore.getReservasByUsuario(userId)
  const duplicado = reservasUsuario.find(
    (r) => r.claseId === claseId && r.estado === ESTADOS_RESERVA.CONFIRMADA
  )
  if (duplicado) return { ok: false, error: 'Ya tienes una reserva en esta clase' }

  reservasStore.agregarReserva({
    userId,
    claseId,
    claseNombre: clase.nombre,
    claseHora: clase.hora,
    claseDia: clase.dia,
    coachNombre: clase.coachNombre,
    tipo: clase.tipo,
    asiento,
    estado: ESTADOS_RESERVA.CONFIRMADA,
    fecha: clase.fecha ?? calcularFechaClase(clase.dia),
  })

  if (!esIlimitado) {
    usuariosStore.descontarCredito(userId)
    authStore.actualizarClasesPaquete(-1)
  }

  clasesStore.actualizarCupo(claseId, 1)

  notifStore.agregarNotificacion({
    userId: clase.coachId,
    tipo: TIPOS_NOTIFICACION.RESERVA,
    titulo: 'Nueva reserva',
    mensaje: `${usuario.nombre} reservó ${clase.nombre} del ${clase.dia}.`,
    fecha: hoyLocal(),
  })

  const nuevoCupo = clase.cupoActual + 1
  if (nuevoCupo / clase.cupoMax >= 0.8) {
    notifStore.agregarNotificacion({
      userId: 3,
      tipo: TIPOS_NOTIFICACION.SISTEMA,
      titulo: 'Clase casi llena',
      mensaje: `${clase.nombre} del ${clase.dia} está al ${Math.round((nuevoCupo / clase.cupoMax) * 100)}% de capacidad.`,
      fecha: hoyLocal(),
    })
  }

  logReservaCreada({
    usuarioNombre: usuario?.nombre ?? `Usuario #${userId}`,
    usuarioId: userId,
    claseNombre: clase.nombre,
    claseHora: clase.hora,
    claseDia: clase.dia,
  })

  if (usuario?.email) {
    emailReservaConfirmada({
      nombre: usuario.nombre ?? 'Cliente',
      email: usuario.email,
      claseNombre: clase.nombre,
      coachNombre: clase.coachNombre ?? '—',
      dia: clase.dia,
      hora: clase.hora,
      fecha: clase.fecha ?? null,
      asiento: asiento ?? null,
    }).catch(() => {})
  }

  return { ok: true }
}

export async function cancelarReserva(reservaId, userId) {
  if (useApiReservations) {
    try {
      const reservaActual = useReservasStore.getState().reservas.find((r) => r.id === reservaId)
      await cancelarReservaApi(reservaId)
      await syncReservasFromApi()
      try {
        await useClasesStore.getState().loadClasesFromApi?.()
      } catch {
        // noop
      }
      if (useApiWaitlist) {
        const occurrenceId = reservaActual?.occurrenceId ?? null
        if (!occurrenceId) {
          return { ok: true }
        }
        try {
          await useListaEsperaStore.getState().syncOccurrenceApi?.(occurrenceId)
        } catch {
          // noop
        }
      }
      return { ok: true }
    } catch (err) {
      if (import.meta.env.DEV && err?.details) {
        console.error('[cancelarReserva][api] error details', err.details)
      }
      return { ok: false, error: err.message || 'No se pudo cancelar la reserva' }
    }
  }

  const reservasStore = useReservasStore.getState()
  const clasesStore = useClasesStore.getState()
  const usuariosStore = useUsuariosStore.getState()
  const authStore = useAuthStore.getState()

  const reserva = reservasStore.reservas.find((r) => r.id === reservaId && r.userId === userId)
  if (!reserva) return { ok: false, error: 'Reserva no encontrada' }
  if (reserva.estado !== ESTADOS_RESERVA.CONFIRMADA) {
    return { ok: false, error: 'Solo se pueden cancelar reservas confirmadas' }
  }

  const ok = reservasStore.cancelarReserva(reservaId, userId)
  if (!ok) return { ok: false, error: 'No se pudo cancelar la reserva' }

  const usuario = usuariosStore.getUsuarioById(userId)
  if (usuario && usuario.clasesPaquete !== 999) {
    usuariosStore.devolverCredito(userId)
    authStore.actualizarClasesPaquete(1)
  }

  const claseId = reserva.claseId
  clasesStore.actualizarCupo(claseId, -1)

  logReservaCancelada({
    usuarioNombre: usuario?.nombre ?? `Usuario #${userId}`,
    usuarioId: userId,
    claseNombre: reserva.claseNombre ?? 'Clase',
  })

  const claseCancel = clasesStore.clases.find((c) => c.id === claseId)
  if (usuario?.email && claseCancel) {
    emailReservaCancelada({
      nombre: usuario.nombre ?? 'Cliente',
      email: usuario.email,
      claseNombre: claseCancel.nombre,
      dia: claseCancel.dia,
      hora: claseCancel.hora,
    }).catch(() => {})
  }

  const listaStore = useListaEsperaStore.getState()
  const listaEspera = listaStore.getPorClase(claseId)

  if (!useApiWaitlist && listaEspera.length > 0) {
    const primero = listaEspera[0]
    const claseObj = clasesStore.clases.find((c) => c.id === claseId)
    const uEspera = usuariosStore.usuarios.find((u) => u.id === primero.userId)

    const { agregarReserva } = useReservasStore.getState()
    agregarReserva({
      userId: primero.userId,
      claseId,
      claseNombre: claseObj?.nombre ?? '—',
      claseHora: claseObj?.hora ?? '—',
      claseDia: claseObj?.dia ?? '—',
      coachNombre: claseObj?.coachNombre ?? '—',
      tipo: claseObj?.tipo ?? '—',
      asiento: null,
      estado: 'confirmada',
      fecha: claseObj?.fecha ?? new Date().toISOString().split('T')[0],
    })

    if (uEspera && uEspera.clasesPaquete !== 999) {
      usuariosStore.editarUsuario(primero.userId, {
        clasesPaquete: Math.max(0, (uEspera.clasesPaquete ?? 0) - 1),
      })
    }

    clasesStore.actualizarCupo(claseId, 1)
    listaStore.salir({ claseId, userId: primero.userId })

    import('@/services/actividadService').then(({ logReservaCreada: logRA }) => {
      logRA({
        usuarioNombre: primero.nombre,
        usuarioId: primero.userId,
        claseNombre: claseObj?.nombre ?? '—',
        claseHora: claseObj?.hora ?? '—',
        claseDia: claseObj?.dia ?? '—',
      })
    })

    if (uEspera?.email) {
      import('@/services/emailService').then(({ emailLugarAsignado: emailLA }) => {
        emailLA({
          nombre: primero.nombre,
          email: uEspera.email,
          claseNombre: claseObj?.nombre ?? '—',
          coachNombre: claseObj?.coachNombre ?? '—',
          dia: claseObj?.dia ?? '—',
          hora: claseObj?.hora ?? '—',
          fecha: claseObj?.fecha ?? null,
        }).catch(() => {})
      })
    }
  }

  return { ok: true }
}

export async function marcarNoAsistio(reservaId) {
  if (useApiReservations) {
    try {
      await marcarNoAsistioApi(reservaId)
      await syncReservasFromApi()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message || 'No se pudo marcar no asistió' }
    }
  }

  const reservasStore = useReservasStore.getState()
  const reserva = reservasStore.reservas.find((r) => r.id === reservaId)
  if (!reserva) return { ok: false, error: 'Reserva no encontrada' }
  if (reserva.estado !== ESTADOS_RESERVA.CONFIRMADA) {
    return { ok: false, error: 'Solo aplica a reservas confirmadas' }
  }

  reservasStore.marcarNoAsistio(reservaId)
  return { ok: true }
}

export async function marcarCompletada(reservaId) {
  if (useApiReservations) {
    try {
      await completarReservaApi(reservaId)
      await syncReservasFromApi()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message || 'No se pudo completar la reserva' }
    }
  }
  useReservasStore.getState().marcarCompletada(reservaId)
  return { ok: true }
}

export function eliminarClaseConReservas(claseId) {
  const reservasStore = useReservasStore.getState()
  const clasesStore = useClasesStore.getState()

  reservasStore.cancelarReservasByClase(claseId)
  clasesStore.eliminarClase(claseId)
  useListaEsperaStore.getState().limpiarClase(claseId)
}
