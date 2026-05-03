/**
 * paquetesService.js
 * ─────────────────────────────────────────────────────
 * Lógica de negocio para gestión de paquetes.
 * Al crear/editar un paquete el precio se actualiza
 * automáticamente en toda la app porque todos los
 * componentes leen de usePaquetesStore().
 *
 * Usado en: admin/AdminPaquetes.jsx
 * Depende de: paquetesStore
 * ─────────────────────────────────────────────────────
 */
import { usePaquetesStore } from '@/stores/paquetesStore'

/**
 * Crea un paquete nuevo.
 * Aparece automáticamente en: página pública, PdV, panel cliente.
 *
 * @param {object} datos - { nombre, precio, clases, vigencia,
 *                           categoria, beneficios, destacado }
 * @returns {{ ok: boolean, mensaje: string, paquete?: object }}
 */
export async function crearPaqueteService(datos) {
  const paquetesStore = usePaquetesStore.getState()

  if (!datos.nombre?.trim()) {
    return { ok: false, mensaje: 'El nombre del paquete es obligatorio.' }
  }

  const nuevo = paquetesStore.agregarPaquete({
    nombre:     datos.nombre,
    precio:     Number(datos.precio) || 0,
    clases:     Number(datos.clases) || 0,
    vigencia:   datos.vigencia || 'Mensual',
    categoria:  datos.categoria || 'mensual',
    beneficios: Array.isArray(datos.beneficios)
      ? datos.beneficios
      : datos.beneficios?.split('\n').filter(Boolean) ?? [],
    destacado:  datos.destacado ?? false,
  })

  return {
    ok:      true,
    mensaje: `Paquete "${datos.nombre}" creado correctamente.`,
    paquete: nuevo,
  }
}

/**
 * Edita un paquete existente.
 * El precio actualizado se refleja en todas las vistas.
 *
 * @param {number|string} paqueteId
 * @param {object} datos
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function editarPaqueteService(paqueteId, datos) {
  const paquetesStore = usePaquetesStore.getState()
  paquetesStore.editarPaquete(paqueteId, datos)
  return { ok: true, mensaje: 'Paquete actualizado correctamente.' }
}

/**
 * Elimina un paquete.
 *
 * @param {number|string} paqueteId
 * @returns {{ ok: boolean, mensaje: string }}
 */
export async function eliminarPaqueteService(paqueteId) {
  const paquetesStore = usePaquetesStore.getState()
  paquetesStore.eliminarPaquete(paqueteId)
  return { ok: true, mensaje: 'Paquete eliminado correctamente.' }
}
