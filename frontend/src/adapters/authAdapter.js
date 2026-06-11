function normalizeGender(value) {
  if (!value) return undefined
  const raw = String(value).trim().toLowerCase()
  const map = {
    mujer: 'femenino',
    femenino: 'femenino',
    hombre: 'masculino',
    masculino: 'masculino',
    otro: 'otro',
    prefiero_no_decir: 'prefiero_no_decir',
    'prefiero no decir': 'prefiero_no_decir',
  }
  return map[raw] ?? undefined
}

export function mapBackendUserToFrontendUser(user) {
  if (!user) return null
  const roleCode = user.roleCode ?? user.role_code ?? user.role ?? user.rol ?? 'cliente'
  const roleName = user.roleName ?? user.role_name ?? roleCode
  const permissions = Array.isArray(user.permissions)
    ? user.permissions
        .map((permission) => String(permission ?? '').trim())
        .filter(Boolean)
    : []
  return {
    id: user.id,
    nombre: user.nombre ?? user.name ?? user.full_name ?? '',
    email: user.email ?? '',
    rol: user.rol ?? user.role ?? roleCode,
    role: user.role ?? user.rol ?? roleCode,
    roleCode,
    roleName,
    permissions,
    telefono: user.telefono ?? user.phone ?? '',
    phone: user.phone ?? user.telefono ?? '',
    genero: normalizeGender(user.genero ?? user.gender) ?? '',
    gender: normalizeGender(user.gender ?? user.genero) ?? '',
    fechaNacimiento: user.fechaNacimiento ?? user.fecha_nacimiento ?? user.birthDate ?? user.birth_date ?? null,
    birthDate: user.birthDate ?? user.birth_date ?? user.fechaNacimiento ?? user.fecha_nacimiento ?? null,
    activo: user.activo ?? user.is_active ?? true,
    clasesPaquete: user.clasesPaquete ?? user.clases_paquete ?? user.credits_available ?? 0,
    clasesPaqueteTotal: user.clasesPaqueteTotal ?? user.clases_paquete_total ?? user.credits_total ?? 0,
    paquete: user.paquete ?? null,
  }
}

export function mapAuthPayloadToSession(payload) {
  const token = payload?.access_token ?? payload?.token ?? null
  const user = mapBackendUserToFrontendUser(payload?.user ?? payload?.usuario ?? payload?.user_data)
  return { token, user }
}

export function mapRegisterRequestToApiPayload(datos = {}) {
  const payload = {
    email: datos.email ?? '',
    name: datos.nombre ?? datos.name ?? '',
    password: datos.password ?? '',
  }

  const phone = datos.telefono ?? datos.phone
  const birthDate = datos.fechaNacimiento ?? datos.birthDate ?? datos.birth_date
  const gender = normalizeGender(datos.genero ?? datos.gender)

  if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
    payload.phone = String(phone).trim()
  }
  if (birthDate !== undefined && birthDate !== null && String(birthDate).trim() !== '') {
    payload.birth_date = String(birthDate).trim()
  }
  if (gender) {
    payload.gender = gender
  }

  return payload
}
