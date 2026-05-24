/**
 * actividadStore.js
 * ─────────────────────────────────────────────────────
 * Store de actividad del sistema.
 * Registra todos los eventos relevantes para el admin.
 * Persiste en localStorage hasta que el backend esté listo.
 *
 * Cuando el backend esté listo:
 * - El store sigue funcionando como cache local
 * - actividadService.js se encarga de sincronizar con la API
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TIPOS_EVENTO = {
  RESERVA_CREADA:    'reserva_creada',
  RESERVA_CANCELADA: 'reserva_cancelada',
  USUARIO_NUEVO:     'usuario_nuevo',
  PAQUETE_VENDIDO:   'paquete_vendido',
  INSUMO_VENDIDO:    'insumo_vendido',
  CORTE_CAJA:        'corte_caja',
  CLASE_CREADA:      'clase_creada',
  CLASE_ELIMINADA:   'clase_eliminada',
  COACH_AGREGADO:    'coach_agregado',
  COACH_ELIMINADO:   'coach_eliminado',
  LOGIN_ADMIN:          'login_admin',
  LOGIN_CLIENTE:        'login_cliente',
  LISTA_ESPERA_UNIRSE:  'lista_espera_unirse',
  LISTA_ESPERA_SALIR:   'lista_espera_salir',
}

export const TIPO_LABELS = {
  reserva_creada:    'Reserva',
  reserva_cancelada: 'Cancelación',
  usuario_nuevo:     'Usuario',
  paquete_vendido:   'Paquete',
  insumo_vendido:    'Venta POS',
  corte_caja:        'Corte de caja',
  clase_creada:      'Clase',
  clase_eliminada:   'Clase',
  coach_agregado:    'Coach',
  coach_eliminado:   'Coach',
  login_admin:          'Sesión',
  login_cliente:        'Sesión cliente',
  lista_espera_unirse:  'Lista de espera',
  lista_espera_salir:   'Lista de espera',
}

export const TIPO_ICONOS = {
  reserva_creada:    '📅',
  reserva_cancelada: '❌',
  usuario_nuevo:     '👤',
  paquete_vendido:   '📦',
  insumo_vendido:    '🛒',
  corte_caja:        '💰',
  clase_creada:      '🗓',
  clase_eliminada:   '🗑',
  coach_agregado:    '👩‍🏫',
  coach_eliminado:   '👋',
  login_admin:          '🔐',
  login_cliente:        '🔑',
  lista_espera_unirse:  '⏳',
  lista_espera_salir:   '↩️',
}

export const useActividadStore = create(
  persist(
    (set, get) => ({
      eventos: [],

      registrarEvento: ({ tipo, descripcion, usuarioNombre = null, usuarioId = null, meta = {} }) => {
        const evento = {
          id:             Date.now(),
          tipo,
          descripcion,
          usuarioNombre,
          usuarioId,
          meta,
          timestamp:      new Date().toISOString(),
          fecha:          new Date().toISOString().split('T')[0],
        }
        set((state) => ({
          eventos: [evento, ...state.eventos].slice(0, 500),
        }))
        return evento
      },

      limpiarEventos: () => set({ eventos: [] }),

      getEventosPorTipo: (tipo) =>
        get().eventos.filter((e) => e.tipo === tipo),

      getEventosPorFecha: (fecha) =>
        get().eventos.filter((e) => e.fecha === fecha),

      getEventosPorUsuario: (nombre) =>
        get().eventos.filter((e) =>
          e.usuarioNombre?.toLowerCase().includes(nombre.toLowerCase())
        ),
    }),
    {
      name: 'casa-scarlatta-actividad',
    }
  )
)
