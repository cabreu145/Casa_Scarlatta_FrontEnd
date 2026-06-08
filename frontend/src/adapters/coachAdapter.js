export function mapBackendCoachToFrontend(item = {}) {
  const coachId = item.coach_id ?? item.id ?? null
  const status = String(item.status ?? (item.is_active === false ? 'inactive' : 'active')).trim().toLowerCase() || 'active'
  const specialties = Array.isArray(item.specialties)
    ? item.specialties.filter(Boolean).map((s) => String(s).trim().toLowerCase())
    : item.specialty
      ? [String(item.specialty).trim().toLowerCase()]
      : []
  const primaryDiscipline = String(item.primary_discipline ?? item.primaryDiscipline ?? specialties[0] ?? '').trim().toLowerCase() || null
  const especialidad = item.especialidad
    ?? (specialties.length > 1 ? 'Ambas' : specialties[0] === 'slow' ? 'Slow' : specialties[0] === 'stryde' ? 'Stryde X' : '')
  return {
    id: coachId,
    coachId,
    userId: item.user_id ?? item.userId ?? null,
    nombre: item.name ?? item.nombre ?? 'Coach',
    name: item.name ?? item.nombre ?? 'Coach',
    email: item.email ?? null,
    phone: item.phone ?? item.telefono ?? null,
    telefono: item.phone ?? item.telefono ?? null,
    status,
    activo: status === 'active',
    isActive: status === 'active',
    specialties,
    specialty: item.specialty ?? item.especialidad ?? specialties[0] ?? '',
    especialidad,
    primaryDiscipline,
    avatarUrl: item.avatar_url ?? item.avatarUrl ?? null,
    foto: item.avatar_url ?? item.avatarUrl ?? null,
    bio: item.bio ?? item.descripcion ?? '',
    instagram: item.instagram ?? null,
    publicProfileEnabled: item.public_profile_enabled ?? item.publicProfileEnabled ?? null,
  }
}

export function mapBackendCoachesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendCoachToFrontend)
}
