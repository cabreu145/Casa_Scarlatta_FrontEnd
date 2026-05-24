/**
 * listaEsperaStore.js
 * ─────────────────────────────────────────────────────
 * Store de lista de espera para clases llenas.
 * Cuando una clase se llena, los usuarios pueden unirse
 * a la lista de espera. Si alguien cancela, el primero
 * en la lista recibe una notificación para reservar.
 *
 * Estructura de entrada:
 * {
 *   id:        number,     // Date.now() + random
 *   claseId:   number,
 *   userId:    number,
 *   nombre:    string,     // nombre del usuario
 *   timestamp: string,     // ISO datetime
 *   fecha:     string,     // YYYY-MM-DD
 *   estado:    'esperando' | 'notificado' | 'expirado'
 * }
 *
 * [BACKEND] → Reemplazar este store por:
 *   GET  /api/lista-espera?claseId=X
 *   POST /api/lista-espera
 *   DEL  /api/lista-espera/:id
 *   El backend envía notificación push/email al siguiente
 *   en la lista cuando se libera un lugar.
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useListaEsperaStore = create(
  persist(
    (set, get) => ({
      lista: [],

      // [BACKEND] → POST /api/lista-espera
      unirse: ({ claseId, userId, nombre }) => {
        const yaEsta = get().lista.some(
          e => e.claseId === claseId && e.userId === userId && e.estado === 'esperando'
        )
        if (yaEsta) return { ok: false, error: 'Ya estás en la lista de espera' }

        const entrada = {
          id:        Date.now() + Math.floor(Math.random() * 1000),
          claseId,
          userId,
          nombre,
          timestamp: new Date().toISOString(),
          fecha:     new Date().toISOString().split('T')[0],
          estado:    'esperando',
        }
        set(s => ({ lista: [...s.lista, entrada] }))
        return { ok: true, entrada }
      },

      // [BACKEND] → DEL /api/lista-espera/:id
      salir: ({ claseId, userId }) => {
        set(s => ({
          lista: s.lista.filter(
            e => !(e.claseId === claseId && e.userId === userId)
          ),
        }))
        return { ok: true }
      },

      // [BACKEND] → GET /api/lista-espera?claseId=X
      getPorClase: (claseId) =>
        get().lista
          .filter(e => e.claseId === claseId && e.estado === 'esperando')
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),

      estaEnLista: (claseId, userId) =>
        get().lista.some(
          e => e.claseId === claseId && e.userId === userId && e.estado === 'esperando'
        ),

      getPosicion: (claseId, userId) => {
        const lista = get().getPorClase(claseId)
        const idx   = lista.findIndex(e => e.userId === userId)
        return idx === -1 ? null : idx + 1
      },

      // [BACKEND] → Este proceso lo hace el backend automáticamente
      // con un webhook o evento. En frontend, simular marcando como
      // 'notificado' al primero de la lista.
      notificarPrimero: (claseId) => {
        const lista = get().getPorClase(claseId)
        if (!lista.length) return null
        const primero = lista[0]
        set(s => ({
          lista: s.lista.map(e =>
            e.id === primero.id ? { ...e, estado: 'notificado' } : e
          ),
        }))
        return primero
      },

      limpiarExpirados: () => {
        const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        set(s => ({
          lista: s.lista.map(e =>
            e.estado === 'notificado' && e.timestamp < hace24h
              ? { ...e, estado: 'expirado' }
              : e
          ),
        }))
      },

      limpiarClase: (claseId) => {
        set(s => ({
          lista: s.lista.filter(e => e.claseId !== claseId),
        }))
      },
    }),
    { name: 'casa-scarlatta-lista-espera' }
  )
)
