/**
 * usuariosService.js
 * ─────────────────────────────────────────────────────
 * Lógica de negocio para gestión de usuarios/clientes.
 *
 * Usado en: admin/AdminUsuarios.jsx, ClientPanel (perfil)
 * Depende de: usuariosStore, transaccionesStore,
 *             notificacionesStore, authStore
 * ─────────────────────────────────────────────────────
 */
import { useUsuariosStore }       from '@/stores/usuariosStore'
import { useTransaccionesStore }  from '@/stores/transaccionesStore'
import { useNotificacionesStore } from '@/stores/notificacionesStore'
import { useAuthStore }           from '@/stores/authStore'
import { TIPOS_TRANSACCION, TIPOS_NOTIFICACION } from '@/data/mockData'

/**
 * Registra un cliente nuevo desde el panel admin.
 * El cliente puede loguearse inmediatamente.
 *
 * @param {object} datos - { nombre, email, password, telefono,
 *                           paquete, clasesPaquete }
 * @returns {{ ok: boolean, mensaje: string, usuario?: object }}
 */
export async function registrarClienteService(datos) {
  const usuariosStore = useUsuariosStore.getState()

  const existe = usuariosStore.usuarios.find((u) => u.email === datos.email)
  if (existe) {
    return { ok: false, mensaje: 'Este email ya está registrado.' }
  }

  const nuevoUsuario = usuariosStore.agregarUsuario({
    nombre:           datos.nombre,
    email:            datos.email,
    password:         datos.password || '123456',
    telefono:         datos.telefono || '',
    rol:              'cliente',
    activo:           true,
    paquete:          datos.paquete || null,
    clasesPaquete:    datos.clasesPaquete ?? 0,
    clasesPaqueteTotal: datos.clasesPaquete ?? 0,
    miembroDesde:     new Date().toISOString().split('T')[0],
    paqueteInfo: datos.paquete
      ? { fechaCompra: new Date().toISOString().split('T')[0], estado: 'Activo', tipo: 'Individual' }
      : null,
  })

  return {
    ok:      true,
    mensaje: `Cliente ${datos.nombre} registrado correctamente.`,
    usuario: nuevoUsuario,
  }
}

/**
 * Asigna o renueva el paquete de un cliente.
 * Actualiza créditos y registra la transacción en finanzas.
 *
 * @param {number|string} clienteId
 * @param {object} paquete  - { id, nombre, precio, clases }
 * @param {string} origen   - 'online' | 'estudio'
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function asignarPaqueteService(clienteId, paquete, origen = 'estudio') {
  const usuariosStore      = useUsuariosStore.getState()
  const transaccionesStore = useTransaccionesStore.getState()
  const notifStore         = useNotificacionesStore.getState()

  const cliente = usuariosStore.getById(clienteId)
  if (!cliente) {
    return { ok: false, mensaje: 'Cliente no encontrado.' }
  }

  const clases = paquete.clases === 0 ? 999 : paquete.clases
  usuariosStore.asignarPaquete(clienteId, paquete.nombre, clases)

  transaccionesStore.registrarTransaccion({
    userId:     clienteId,
    tipo:       TIPOS_TRANSACCION.PAQUETE,
    concepto:   `${paquete.nombre} — ${origen}`,
    monto:      paquete.precio,
    fecha:      new Date().toISOString().split('T')[0],
    metodoPago: origen === 'estudio' ? 'efectivo' : null,
    referencia: null,
  })

  if (origen === 'online') {
    notifStore.agregarNotificacion({
      userId:  3,
      tipo:    TIPOS_NOTIFICACION.PAQUETE,
      titulo:  'Nueva compra online',
      mensaje: `${cliente.nombre} compró el ${paquete.nombre}.`,
      fecha:   new Date().toISOString().split('T')[0],
    })
  }

  return {
    ok:      true,
    mensaje: `Paquete "${paquete.nombre}" asignado correctamente.`,
  }
}

/**
 * Actualiza los datos del perfil de un usuario.
 * Sincroniza tanto usuariosStore como la sesión en authStore.
 *
 * @param {number|string} clienteId
 * @param {object} datos - { nombre, telefono, genero, fechaNacimiento }
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function editarPerfilService(clienteId, datos) {
  const usuariosStore = useUsuariosStore.getState()
  const authStore     = useAuthStore.getState()

  usuariosStore.editarUsuario(clienteId, datos)
  authStore.actualizarPerfil(datos)

  return { ok: true, mensaje: 'Perfil actualizado correctamente.' }
}
