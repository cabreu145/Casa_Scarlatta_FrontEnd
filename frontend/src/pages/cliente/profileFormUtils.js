export function resolvePerfilCompleto({ useApiAuth, usuario, usuarios }) {
  const fromUsuariosStore = usuarios.find((u) => u.id === usuario?.id) ?? null
  if (useApiAuth) return usuario ?? fromUsuariosStore
  return fromUsuariosStore ?? usuario
}

export function buildPerfilFormFromUser(perfil = null) {
  return {
    nombreCompleto: perfil?.nombre ?? '',
    email: perfil?.email ?? '',
    telefono: perfil?.telefono ?? '',
    genero: perfil?.genero ?? 'prefiero_no_decir',
    fechaNacimiento: perfil?.fechaNacimiento ?? '',
  }
}
