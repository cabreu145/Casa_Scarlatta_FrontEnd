/**
 * coachesService.js
 * ─────────────────────────────────────────────────────
 * Lógica de negocio para gestión de coaches.
 * Al crear un coach se genera automáticamente un usuario
 * con rol 'coach' para que pueda iniciar sesión.
 * Al eliminar un coach sus clases quedan "Sin asignar".
 *
 * Usado en: admin/AdminCoaches.jsx
 * Depende de: coachesStore, clasesStore, usuariosStore
 * ─────────────────────────────────────────────────────
 */
import { useCoachesStore }  from '@/stores/coachesStore'
import { useClasesStore }   from '@/stores/clasesStore'
import { useUsuariosStore } from '@/stores/usuariosStore'

/**
 * Crea un coach nuevo y su usuario de login asociado.
 * @param {object} datos - { nombre, email, especialidad, bio, password? }
 * @returns {{ ok: boolean, mensaje: string, coach?: object }}
 */
export async function crearCoachService(datos) {
  const coachesStore  = useCoachesStore.getState()
  const usuariosStore = useUsuariosStore.getState()

  const emailEnUso = usuariosStore.usuarios.find(
    (u) => u.email === datos.email
  )
  if (emailEnUso) {
    return { ok: false, mensaje: 'Este email ya está registrado.' }
  }

  const nuevoCoach = coachesStore.agregarCoach({
    nombre:       datos.nombre,
    email:        datos.email,
    especialidad: datos.especialidad || 'Stride',
    bio:          datos.bio || '',
    foto:         datos.foto || null,
    rating:       5.0,
    asist:        100,
    clases:       0,
  })

  usuariosStore.agregarUsuario({
    nombre:    datos.nombre,
    email:     datos.email,
    password:  datos.password || '123456',
    rol:       'coach',
    coachId:   nuevoCoach.id,
    activo:    true,
    paquete:   null,
    clasesPaquete: 0,
  })

  return {
    ok:     true,
    mensaje: `Coach ${datos.nombre} creado correctamente.`,
    coach:  nuevoCoach,
  }
}

/**
 * Edita los datos de un coach existente.
 * @param {string|number} coachId
 * @param {object} datos
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function editarCoachService(coachId, datos) {
  const coachesStore = useCoachesStore.getState()
  coachesStore.editarCoach(coachId, datos)
  return { ok: true, mensaje: 'Coach actualizado correctamente.' }
}

/**
 * Da de baja a un coach (desactiva, no elimina).
 * Sus clases quedan marcadas como "Sin asignar".
 * @param {string|number} coachId
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function eliminarCoachService(coachId) {
  const coachesStore = useCoachesStore.getState()
  const clasesStore  = useClasesStore.getState()

  const clasesAfectadas = clasesStore.clases.filter(
    (c) => String(c.coachId) === String(coachId)
  )

  coachesStore.eliminarCoach(coachId)

  clasesAfectadas.forEach((c) => {
    clasesStore.editarClase(c.id, {
      coachId:     null,
      coachNombre: 'Sin asignar',
    })
  })

  return {
    ok:      true,
    mensaje: `Coach dado de baja. ${clasesAfectadas.length} clase(s) quedaron sin coach asignado.`,
  }
}

/**
 * Elimina permanentemente un coach del sistema.
 * Sus clases quedan marcadas como "Sin asignar".
 * @param {string|number} coachId
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function borrarCoachService(coachId) {
  const coachesStore  = useCoachesStore.getState()
  const clasesStore   = useClasesStore.getState()
  const usuariosStore = useUsuariosStore.getState()

  const coach = coachesStore.getById(coachId)

  // Desasignar sus clases
  const clasesAfectadas = clasesStore.clases.filter(
    (c) => String(c.coachId) === String(coachId)
  )
  clasesAfectadas.forEach((c) => {
    clasesStore.editarClase(c.id, {
      coachId:     null,
      coachNombre: 'Sin asignar',
    })
  })

  // Eliminar usuario de login asociado
  if (coach?.email) {
    const userCoach = usuariosStore.usuarios.find(
      (u) => u.email === coach.email && u.rol === 'coach'
    )
    if (userCoach) usuariosStore.eliminarUsuario(userCoach.id)
  }

  // Eliminar del store
  coachesStore.borrarCoach(coachId)

  return {
    ok:      true,
    mensaje: `Coach eliminado permanentemente. ${clasesAfectadas.length} clase(s) quedaron sin coach asignado.`,
  }
}
