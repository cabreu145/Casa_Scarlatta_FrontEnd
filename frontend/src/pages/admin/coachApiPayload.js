function normalizeStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw || raw === 'activo' || raw === 'active') return 'active'
  if (raw === 'inactivo' || raw === 'inactive') return 'inactive'
  return null
}

function normalizeSpecialties(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw || raw === 'ambas') return ['slow', 'stryde']
  if (raw.includes('slow')) return ['slow']
  if (raw.includes('stryde') || raw.includes('stride')) return ['stryde']
  return []
}

function normalizeBool(value) {
  if (typeof value === 'boolean') return value
  const raw = String(value ?? '').trim().toLowerCase()
  if (['true', '1', 'si', 'sí', 'on', 'yes'].includes(raw)) return true
  if (['false', '0', 'no', 'off'].includes(raw)) return false
  return false
}

export function buildCoachApiPayload(form = {}, { isCreate = false } = {}) {
  const name = String(form?.nombre ?? form?.name ?? '').trim()
  const email = String(form?.email ?? '').trim()
  const phone = String(form?.telefono ?? form?.phone ?? '').trim()
  const status = normalizeStatus(form?.estado ?? form?.status)
  const specialties = normalizeSpecialties(form?.disciplina ?? form?.specialties ?? form?.especialidad)
  const bio = String(form?.bio ?? '').trim()
  const instagram = String(form?.instagram ?? '').trim() || null
  const public_profile_enabled = normalizeBool(form?.public_profile_enabled ?? form?.publicProfileEnabled)
  const password = String(form?.password ?? '').trim()

  const payload = {
    name,
    email,
    phone,
    status,
    specialties,
    bio,
    instagram,
    public_profile_enabled,
  }

  if (isCreate) {
    payload.password = password
  }

  return payload
}

export function validateCoachApiPayload(payload = {}, { isCreate = false } = {}) {
  if (!String(payload.name ?? '').trim()) return 'El nombre del coach es obligatorio.'
  if (!String(payload.email ?? '').trim()) return 'El email del coach es obligatorio.'
  if (payload.status !== 'active' && payload.status !== 'inactive') return 'Estado de coach inválido.'
  if (!Array.isArray(payload.specialties) || payload.specialties.length === 0) return 'Selecciona al menos una especialidad.'
  if (isCreate) {
    if (!String(payload.password ?? '').trim()) return 'La contraseña inicial del coach es obligatoria.'
    if (String(payload.password ?? '').trim().length < 8) return 'La contraseña inicial debe tener al menos 8 caracteres.'
  }
  return null
}
