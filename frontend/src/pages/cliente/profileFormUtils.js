export function resolvePerfilCompleto({ useApiAuth, usuario, usuarios }) {
  const fromUsuariosStore = usuarios.find((u) => u.id === usuario?.id) ?? null
  if (useApiAuth) return usuario ?? fromUsuariosStore
  return fromUsuariosStore ?? usuario
}

export function buildPerfilFormFromUser(perfil = null) {
  const partes = (perfil?.nombre ?? '').trim().split(/\s+/).filter(Boolean)
  // For 4+ word names split in half (e.g. "eduardo jesus sanchez santini" → "eduardo jesus" / "sanchez santini")
  const splitAt = partes.length >= 4 ? Math.floor(partes.length / 2) : 1
  return {
    nombre: partes.slice(0, splitAt).join(' '),
    apellido: partes.slice(splitAt).join(' '),
    email: perfil?.email ?? '',
    telefono: perfil?.telefono ?? '',
    genero: perfil?.genero ?? 'Prefiero no decir',
    fechaNacimiento: perfil?.fechaNacimiento ?? '',
  }
}
