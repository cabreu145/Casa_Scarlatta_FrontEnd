import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getWaitlistByClaseApi,
  getWaitlistByOccurrenceApi,
  salirWaitlistApi,
  unirseWaitlistApi,
} from '@/services/waitlistApiService'

const useApiWaitlist = import.meta.env.VITE_USE_API_WAITLIST === 'true'
const inflightWaitlistByOccurrence = new Map()

export const useListaEsperaStore = create(
  persist(
    (set, get) => ({
      lista: [],

      syncClaseApi: async (claseId) => {
        if (!claseId) return []
        if (useApiWaitlist) return []
        const { entries } = await getWaitlistByClaseApi(claseId)
        set((s) => {
          const claseIdNum = Number(claseId)
          const sinClase = s.lista.filter((e) => Number(e.claseId) !== claseIdNum)
          return { lista: [...sinClase, ...entries] }
        })
        return entries
      },

      syncOccurrenceApi: async (occurrenceId) => {
        if (!useApiWaitlist || !occurrenceId) return []
        const key = Number(occurrenceId)
        if (inflightWaitlistByOccurrence.has(key)) {
          return inflightWaitlistByOccurrence.get(key)
        }
        const request = getWaitlistByOccurrenceApi(occurrenceId)
          .then(({ entries }) => {
            set((s) => {
              const occurrenceIdNum = Number(occurrenceId)
              const sinOccurrence = s.lista.filter((e) => Number(e.occurrenceId) !== occurrenceIdNum)
              return { lista: [...sinOccurrence, ...entries] }
            })
            return entries
          })
          .finally(() => {
            inflightWaitlistByOccurrence.delete(key)
          })
        inflightWaitlistByOccurrence.set(key, request)
        return request
      },

      clearWaitlistInflight: () => {
        inflightWaitlistByOccurrence.clear()
      },

      clearWaitlistCacheByOccurrence: (occurrenceIds = []) => {
        const ids = new Set((Array.isArray(occurrenceIds) ? occurrenceIds : []).map(Number))
        set((s) => ({
          lista: s.lista.filter((e) => !ids.has(Number(e.occurrenceId))),
        }))
      },

      unirse: async ({ claseId, occurrenceId, userId, nombre }) => {
        if (useApiWaitlist) {
          if (!occurrenceId) return { ok: false, error: 'OCCURRENCE_REQUIRED' }
          const entrada = await unirseWaitlistApi({ claseId, occurrenceId, userId })
          set((s) => ({ lista: [...s.lista.filter((e) => e.id !== entrada.id), entrada] }))
          return { ok: true, entrada }
        }

        const yaEsta = get().lista.some(
          (e) => e.claseId === claseId && e.userId === userId && e.estado === 'esperando'
        )
        if (yaEsta) return { ok: false, error: 'Ya estás en la lista de espera' }

        const entrada = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          claseId,
          userId,
          nombre,
          timestamp: new Date().toISOString(),
          fecha: new Date().toISOString().split('T')[0],
          estado: 'esperando',
        }
        set((s) => ({ lista: [...s.lista, entrada] }))
        return { ok: true, entrada }
      },

      salir: async ({ claseId, occurrenceId, userId, entryId }) => {
        if (useApiWaitlist) {
          let targetEntryId = entryId
          if (!targetEntryId) {
            if (!occurrenceId) {
              return { ok: false, error: 'OCCURRENCE_REQUIRED' }
            }
            const waitlistEntries = await get().syncOccurrenceApi(occurrenceId)
            const activa = waitlistEntries.find(
              (e) => Number(e.userId) === Number(userId) && e.estado === 'esperando'
            )
            targetEntryId = activa?.id
          }
          if (!targetEntryId) {
            return { ok: false, error: 'Entrada de lista de espera no encontrada' }
          }
          await salirWaitlistApi(targetEntryId)
          set((s) => ({ lista: s.lista.filter((e) => e.id !== targetEntryId) }))
          return { ok: true }
        }

        set((s) => ({
          lista: s.lista.filter((e) => !(e.claseId === claseId && e.userId === userId)),
        }))
        return { ok: true }
      },

      getPorClase: (claseId) =>
        get().lista
          .filter((e) => e.claseId === claseId && e.estado === 'esperando')
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),

      getPorOccurrence: (occurrenceId) =>
        get().lista
          .filter((e) => Number(e.occurrenceId) === Number(occurrenceId) && e.estado === 'esperando')
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),

      estaEnLista: (waitlistKey, userId) => {
        const keyNum = Number(waitlistKey)
        return get().lista.some(
          (e) =>
            ((e.occurrenceId != null && Number(e.occurrenceId) === keyNum) ||
              (e.occurrenceId == null && Number(e.claseId) === keyNum)) &&
            Number(e.userId) === Number(userId) &&
            e.estado === 'esperando'
        )
      },

      getPosicion: (waitlistKey, userId) => {
        const keyNum = Number(waitlistKey)
        const lista = get()
          .lista.filter(
            (e) =>
              ((e.occurrenceId != null && Number(e.occurrenceId) === keyNum) ||
                (e.occurrenceId == null && Number(e.claseId) === keyNum)) &&
              e.estado === 'esperando'
          )
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        const idx = lista.findIndex((e) => Number(e.userId) === Number(userId))
        return idx === -1 ? null : idx + 1
      },

      notificarPrimero: (claseId) => {
        const lista = get().getPorClase(claseId)
        if (!lista.length) return null
        const primero = lista[0]
        set((s) => ({
          lista: s.lista.map((e) => (e.id === primero.id ? { ...e, estado: 'notificado' } : e)),
        }))
        return primero
      },

      limpiarExpirados: () => {
        const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        set((s) => ({
          lista: s.lista.map((e) =>
            e.estado === 'notificado' && e.timestamp < hace24h ? { ...e, estado: 'expirado' } : e
          ),
        }))
      },

      limpiarClase: (claseId) => {
        set((s) => ({
          lista: s.lista.filter((e) => e.claseId !== claseId),
        }))
      },
    }),
    { name: 'casa-scarlatta-lista-espera' }
  )
)

