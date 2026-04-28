/**
 * reportesStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand con datos estadísticos para el panel de reportes.
 * No persiste (datos estáticos mock, no hay acciones de escritura).
 * Cuando haya backend, reemplazar con llamadas a ENDPOINTS.reportes.
 *
 * Usado en: AdminReportes
 * Depende de: zustand
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'

export const useReportesStore = create(() => ({
  clasesMasPopulares: [
    { nombre: 'Stride HIIT', tipo: 'Stride', reservas: 87, porcentaje: 100 },
    { nombre: 'Slow Pilates', tipo: 'Slow', reservas: 74, porcentaje: 85 },
    { nombre: 'Stride Power', tipo: 'Stride', reservas: 68, porcentaje: 78 },
    { nombre: 'Slow Meditación', tipo: 'Slow', reservas: 55, porcentaje: 63 },
    { nombre: 'Stride Weekend', tipo: 'Stride', reservas: 49, porcentaje: 56 },
  ],

  asistenciaPorCoach: [
    { coach: 'Carlos Méndez', promedio: 17.4, total: 52 },
    { coach: 'Sofía Reyes', promedio: 11.2, total: 56 },
    { coach: 'Ana Torres', promedio: 9.7, total: 29 },
  ],

  cancelacionesPorSemana: [
    { semana: 'Sem 1', cancelaciones: 4 },
    { semana: 'Sem 2', cancelaciones: 7 },
    { semana: 'Sem 3', cancelaciones: 3 },
    { semana: 'Sem 4', cancelaciones: 6 },
  ],

  clientesNuevosVsRecurrentes: {
    nuevos: 23,
    recurrentes: 133,
    total: 156,
  },
}))
