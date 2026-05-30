function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function mapBackendOccurrenceToFrontend(item = {}) {
  const cupoMax = safeNumber(item.capacity_max, 0)
  const cupoActual = safeNumber(item.capacity_current, 0)
  return {
    occurrenceId: item.id ?? item.occurrence_id ?? null,
    id: item.id ?? item.occurrence_id ?? null,
    claseId: item.class_id ?? item.clase_id ?? null,
    fecha: item.occurrence_date ?? item.class_date ?? null,
    inicio: item.start_at ?? item.class_start_at ?? null,
    fin: item.end_at ?? null,
    cupoMax,
    cupoActual,
    cupoDisponible: safeNumber(item.cupo_disponible, Math.max(0, cupoMax - cupoActual)),
    coachId: item.coach_id ?? item.coachId ?? null,
    estado: item.status ?? 'programada',
    claseNombre: item.class_name ?? item.claseNombre ?? null,
  }
}

export function mapBackendOccurrencesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendOccurrenceToFrontend)
}
