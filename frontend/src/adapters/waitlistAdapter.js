export function mapBackendWaitlistEntryToFrontend(entry = {}) {
  return {
    id: entry.id,
    claseId: entry.class_id ?? entry.clase_id ?? entry.claseId ?? null,
    occurrenceId: entry.occurrence_id ?? entry.occurrenceId ?? null,
    userId: entry.user_id ?? entry.userId ?? null,
    posicion: entry.position ?? entry.posicion ?? null,
    status: entry.status ?? entry.estado ?? 'esperando',
    estado: entry.status ?? entry.estado ?? 'esperando',
    fechaIngreso: entry.joined_at ?? entry.fechaIngreso ?? null,
    fechaNotificacion: entry.notified_at ?? entry.fechaNotificacion ?? null,
    expiraEn: entry.expires_at ?? entry.expiraEn ?? null,
    timestamp: entry.joined_at ?? new Date().toISOString(),
  }
}

export function mapBackendWaitlistListToFrontend(payload = {}) {
  const classId = payload.class_id ?? payload.claseId ?? null
  const occurrenceId = payload.occurrence_id ?? payload.occurrenceId ?? null
  const entries = Array.isArray(payload.entries) ? payload.entries : []
  return {
    classId,
    occurrenceId,
    entries: entries.map(mapBackendWaitlistEntryToFrontend),
  }
}

export function mapJoinWaitlistPayload({ occurrenceId, claseId, userId }) {
  const payload = {}
  if (occurrenceId !== undefined && occurrenceId !== null && occurrenceId !== '') {
    payload.occurrence_id = Number(occurrenceId)
  } else if (claseId !== undefined && claseId !== null && claseId !== '') {
    payload.clase_id = Number(claseId)
  }
  if (userId !== undefined && userId !== null && userId !== '') {
    payload.user_id = Number(userId)
  }
  return payload
}

