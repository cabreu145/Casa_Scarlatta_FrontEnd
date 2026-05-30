export function resolvePerfilCompleto({ useApiAuth, usuario, usuarios }) {
  const fromUsuariosStore = usuarios.find((u) => u.id === usuario?.id) ?? null
  if (useApiAuth) return usuario ?? fromUsuariosStore
  return fromUsuariosStore ?? usuario
}

export function buildPerfilFormFromUser(perfil = null) {
  const partes = (perfil?.nombre ?? '').split(' ')
  return {
    nombre: partes[0] ?? '',
    apellido: partes.slice(1).join(' '),
    email: perfil?.email ?? '',
    telefono: perfil?.telefono ?? '',
    genero: perfil?.genero ?? 'Prefiero no decir',
    fechaNacimiento: perfil?.fechaNacimiento ?? '',
  }
}
