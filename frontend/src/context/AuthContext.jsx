/**
 * AuthContext.jsx
 * ─────────────────────────────────────────────────────
 * Contexto global de autenticación. Expone useAuth() a toda la app.
 * Encapsula useAuthStore para que ningún componente lo llame directo.
 * Cuando haya backend: reemplazar mockUsers por llamadas a
 * ENDPOINTS.login y ENDPOINTS.registro vía httpPost().
 *
 * Usado en: App.jsx (AuthProvider), todos los componentes con useAuth()
 * Depende de: authStore, mockUsers
 * ─────────────────────────────────────────────────────
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore }   from '@/stores/authStore'
import { useUsuariosStore } from '@/stores/usuariosStore'
import { mockUsers } from '@/data/mockUsers'
import { hoyLocal } from '@/utils/fecha'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { usuario, isAuthenticated, setUsuario, setLoading, logout: storeLogout, actualizarPerfil, actualizarClasesPaquete } = useAuthStore()
  const [loading, setLocalLoading] = useState(true)

  useEffect(() => {
    setLocalLoading(false)
  }, [])

  const login = async (email, password) => {
    setLocalLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const storeUsuarios = useUsuariosStore.getState().usuarios
    const user =
      mockUsers.find((u) => u.email === email && u.password === password) ||
      storeUsuarios.find((u) => u.email === email && u.password === password)
    if (!user) {
      setLocalLoading(false)
      throw new Error('Credenciales incorrectas')
    }
    if (user.activo === false) {
      setLocalLoading(false)
      throw new Error('Esta cuenta está desactivada')
    }
    const { password: _, ...safeUser } = user
    setUsuario(safeUser)
    setLocalLoading(false)
    return safeUser
  }

  const register = async (datos) => {
    setLocalLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const storeUsuariosCheck = useUsuariosStore.getState().usuarios
    const existe = storeUsuariosCheck.find((u) => u.email === datos.email)
    if (existe) {
      setLocalLoading(false)
      throw new Error('Este correo ya está registrado')
    }
    const nuevoUsuario = {
      id: Date.now(),
      ...datos,
      rol: 'cliente',
      clasesPaquete: 0,
      clasesPaqueteTotal: 0,
      paquete: null,
      activo: true,
      fechaRegistro: hoyLocal(),
    }
    mockUsers.push(nuevoUsuario)
    useUsuariosStore.getState().agregarUsuario(nuevoUsuario)
    const { password: _, ...safeUser } = nuevoUsuario
    setUsuario(safeUser)
    setLocalLoading(false)
    return safeUser
  }

  const resetPassword = async (email, newPassword) => {
    setLocalLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const { usuarios, actualizarUsuario } = useUsuariosStore.getState()
    const mu = mockUsers.find((u) => u.email === email)
    const su = usuarios.find((u) => u.email === email)
    if (!mu && !su) {
      setLocalLoading(false)
      throw new Error('No existe una cuenta con ese correo')
    }
    if (mu) mu.password = newPassword
    if (su) actualizarUsuario(su.id, { password: newPassword })
    setLocalLoading(false)
  }

  const logout = () => {
    storeLogout()
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
        resetPassword,
        actualizarPerfil,
        actualizarClasesPaquete,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}