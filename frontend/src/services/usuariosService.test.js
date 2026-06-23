import { beforeEach, describe, expect, test, vi } from 'vitest'

const httpPut = vi.fn()
const editarUsuario = vi.fn()
const actualizarPerfil = vi.fn()

vi.mock('@/lib/http', () => ({
  httpPut: (...args) => httpPut(...args),
}))

vi.mock('@/stores/usuariosStore', () => ({
  useUsuariosStore: {
    getState: () => ({ editarUsuario }),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ actualizarPerfil }),
  },
}))

describe('editarPerfilService', () => {
  beforeEach(() => {
    httpPut.mockReset()
    editarUsuario.mockReset()
    actualizarPerfil.mockReset()
  })

  test('usa PUT /users/{id} y manda name, phone, gender', async () => {
    httpPut.mockResolvedValueOnce({
      id: 7,
      name: 'Cliente Demo Actualizado',
      phone: '5512345678',
      gender: 'femenino',
    })

    const { editarPerfilService } = await import('./usuariosService')
    const result = await editarPerfilService(7, {
      nombreCompleto: 'Cliente Demo Actualizado',
      telefono: '5512345678',
      genero: 'Femenino',
    })

    expect(httpPut).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/7'),
      {
        name: 'Cliente Demo Actualizado',
        phone: '5512345678',
        gender: 'femenino',
      }
    )
    expect(editarUsuario).toHaveBeenCalledWith(7, {
      nombre: 'Cliente Demo Actualizado',
      telefono: '5512345678',
      genero: 'femenino',
    })
    expect(actualizarPerfil).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Cliente Demo Actualizado',
      telefono: '5512345678',
      genero: 'femenino',
    }))
    expect(result.ok).toBe(true)
  })
})
