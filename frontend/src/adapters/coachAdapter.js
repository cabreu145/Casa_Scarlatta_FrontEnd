export function mapBackendCoachToFrontend(item = {}) {
  return {
    id: item.id ?? null,
    coachId: item.id ?? null,
    nombre: item.name ?? item.nombre ?? 'Coach',
    email: item.email ?? null,
    especialidad: item.specialty ?? item.especialidad ?? '',
    activo: item.is_active ?? item.activo ?? true,
  }
}

export function mapBackendCoachesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendCoachToFrontend)
}
