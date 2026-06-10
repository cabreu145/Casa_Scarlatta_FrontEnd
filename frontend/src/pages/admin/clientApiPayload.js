export function normalizeClientStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw || raw === 'active' || raw === 'activo') return 'active'
  if (raw === 'inactive' || raw === 'inactivo') return 'inactive'
  return null
}

export function buildClientApiPayload(form = {}, { isCreate = false } = {}) {
  const payload = {
    name: String(form.name ?? form.nombre ?? '').trim(),
    email: String(form.email ?? '').trim(),
    phone: String(form.phone ?? form.telefono ?? '').trim() || null,
    status: normalizeClientStatus(form.status ?? form.estado) ?? 'active',
  }

  if (isCreate) payload.password = String(form.password ?? '').trim()
  return payload
}

export function validateClientApiPayload(payload = {}, { isCreate = false } = {}) {
  if (!payload.name) return 'El nombre del cliente es obligatorio.'
  if (!payload.email) return 'El email del cliente es obligatorio.'
  if (!['active', 'inactive'].includes(payload.status)) return 'Estado de cliente invalido.'
  if (isCreate && !payload.password) return 'La contrasena inicial del cliente es obligatoria.'
  if (isCreate && payload.password.length < 8) return 'La contrasena inicial debe tener al menos 8 caracteres.'
  return null
}
