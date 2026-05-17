/**
 * configuracionStore.js
 * ─────────────────────────────────────────────────────
 * Store de configuración global del estudio.
 * Persiste en localStorage hasta que el backend esté listo.
 *
 * [BACKEND] → Reemplazar por:
 *   GET  /api/configuracion
 *   PUT  /api/configuracion
 *   Solo el rol 'admin' puede modificar estos valores.
 *
 * Para conectar:
 *   1. En el useEffect inicial de AdminPanel,
 *      hacer GET /api/configuracion y llamar
 *      setConfiguracion(data) para sincronizar.
 *   2. En actualizar(), hacer PUT /api/configuracion
 *      con los nuevos valores.
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULTS = {
  // Horas mínimas de anticipación para cancelar una reserva.
  // El cliente NO puede cancelar si faltan menos de estas horas.
  // Default: 6 horas. Rango válido: 1 a 72 horas.
  // [BACKEND] → campo: configuracion.horasCancelacion (integer)
  horasCancelacion: 6,

  // Nombre del estudio (aparece en PDFs y reportes)
  // [BACKEND] → campo: configuracion.nombreEstudio (string)
  nombreEstudio: 'Casa Scarlatta',

  // Ciudad del estudio (aparece en PDFs)
  // [BACKEND] → campo: configuracion.ciudad (string)
  ciudad: 'Ciudad de México, México',

  // Máximo de usuarios en lista de espera por clase
  // [BACKEND] → campo: configuracion.maxListaEspera (integer)
  maxListaEspera: 10,

  // Tiempo en minutos para que un usuario en lista de espera
  // confirme su lugar antes de pasarlo al siguiente.
  // [BACKEND] → campo: configuracion.minutosConfirmarEspera (integer)
  minutosConfirmarEspera: 30,
}

export const useConfiguracionStore = create(
  persist(
    (set, get) => ({
      config: { ...DEFAULTS },

      // Obtener un valor de configuración con fallback al default
      get: (key) => get().config[key] ?? DEFAULTS[key],

      // Actualizar uno o varios valores
      // [BACKEND] → PUT /api/configuracion
      actualizar: (cambios) => {
        set(s => ({
          config: { ...s.config, ...cambios },
        }))
      },

      // Restaurar todos los valores a los defaults
      // [BACKEND] → PUT /api/configuracion (con DEFAULTS)
      restaurar: () => {
        set({ config: { ...DEFAULTS } })
      },

      // Restaurar un solo campo al default
      restaurarCampo: (key) => {
        set(s => ({
          config: { ...s.config, [key]: DEFAULTS[key] },
        }))
      },
    }),
    { name: 'casa-scarlatta-configuracion' }
  )
)

// Exportar defaults para uso externo
export { DEFAULTS as CONFIG_DEFAULTS }
