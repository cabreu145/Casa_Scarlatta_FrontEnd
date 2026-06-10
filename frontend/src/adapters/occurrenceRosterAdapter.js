const EQUIPMENT_LABELS = {
  bench: 'Banco',
  treadmill: 'Caminadora',
  mat: 'Tapete',
}

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function mapStudent(item = {}) {
  const spotLabel = item.spot_label ?? item.spotLabel ?? null
  const equipmentType = item.equipment_type ?? item.equipmentType ?? null
  return {
    reservationId: item.reservation_id ?? item.reservationId ?? null,
    userId: item.user_id ?? item.userId ?? null,
    name: item.name ?? null,
    email: item.email ?? null,
    phone: item.phone ?? null,
    status: item.status ?? null,
    checkedInAt: item.checked_in_at ?? item.checkedInAt ?? null,
    spotId: item.spot_id ?? item.spotId ?? null,
    spotLabel,
    equipmentType,
    equipmentLabel: equipmentType ? (EQUIPMENT_LABELS[equipmentType] ?? equipmentType) : null,
    createdAt: item.created_at ?? item.createdAt ?? null,
  }
}

export function mapBackendOccurrenceRosterToFrontend(payload = {}) {
  const students = Array.isArray(payload.students) ? payload.students.map(mapStudent) : []
  return {
    occurrenceId: payload.occurrence_id ?? payload.occurrenceId ?? null,
    classId: payload.class_id ?? payload.classId ?? null,
    className: payload.class_name ?? payload.className ?? null,
    discipline: payload.discipline ?? null,
    date: payload.date ?? null,
    startTime: payload.start_time ?? payload.startTime ?? null,
    endTime: payload.end_time ?? payload.endTime ?? null,
    coachId: payload.coach_id ?? payload.coachId ?? null,
    coachName: payload.coach_name ?? payload.coachName ?? null,
    coachAvatarUrl: payload.coach_avatar_url ?? payload.coachAvatarUrl ?? payload.avatar_url ?? payload.avatarUrl ?? null,
    capacityMax: safeNumber(payload.capacity_max ?? payload.capacityMax, 0),
    capacityCurrent: safeNumber(payload.capacity_current ?? payload.capacityCurrent, 0),
    students,
  }
}

export function mapBackendOccurrenceRosterStudentsToFrontend(students = []) {
  return (Array.isArray(students) ? students : []).map(mapStudent)
}
