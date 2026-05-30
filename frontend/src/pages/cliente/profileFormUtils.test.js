import { describe, expect, test } from 'vitest'
import { buildPerfilFormFromUser, resolvePerfilCompleto } from './profileFormUtils'

describe('profileFormUtils', () => {
  test('buildPerfilFormFromUser hidrata campos sin click/focus', () => {
    const form = buildPerfilFormFromUser({
      nombre: 'Ana Perez',
      email: 'ana@test.com',
      telefono: '5512345678',
      genero: 'femenino',
      fechaNacimiento: '1998-01-01',
    })
    expect(form.nombre).toBe('Ana')
    expect(form.apellido).toBe('Perez')
    expect(form.email).toBe('ana@test.com')
    expect(form.telefono).toBe('5512345678')
    expect(form.genero).toBe('femenino')
    expect(form.fechaNacimiento).toBe('1998-01-01')
  })

  test('en API mode prioriza usuario de sesión sobre usuariosStore', () => {
    const usuarioSesion = { id: 3, nombre: 'Cliente API', telefono: '999' }
    const usuariosStore = [{ id: 3, nombre: 'Cliente Mock', telefono: '111' }]
    const perfil = resolvePerfilCompleto({
      useApiAuth: true,
      usuario: usuarioSesion,
      usuarios: usuariosStore,
    })
    expect(perfil.nombre).toBe('Cliente API')
    expect(perfil.telefono).toBe('999')
  })
})
