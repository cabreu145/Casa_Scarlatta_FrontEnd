import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUsuariosStore } from '@/stores/usuariosStore'
import { mockUsers } from '@/data/mockUsers'
import { hoyLocal } from '@/utils/fecha'
import { logUsuarioNuevo, logLoginCliente } from '@/services/actividadService'
import { emailBienvenida, emailResetPassword } from '@/services/emailService'
import {
  confirmPasswordResetApi,
  requestPasswordResetApi,
} from '@/services/authPasswordResetApiService'
import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost } from '@/lib/http'
import { useFinancialStateStore } from '@/stores/financialStateStore'
import {
  mapAuthPayloadToSession,
  mapBackendUserToFrontendUser,
  mapRegisterRequestToApiPayload,
} from '@/adapters/authAdapter'

const AuthContext = createContext(null)
const useApiAuth = import.meta.env.VITE_USE_API_AUTH === 'true'

function saveToken(token) {
  if (token) localStorage.setItem('token', token)
}

function clearToken() {
  localStorage.removeItem('token')
}

export function AuthProvider({ children }) {
  const {
    usuario,
    isAuthenticated,
    setUsuario,
    setSession,
    setLoading,
    logout: storeLogout,
    actualizarPerfil,
    actualizarClasesPaquete,
  } = useAuthStore()
  const [loading, setLocalLoading] = useState(true)
  const loadFinancialState = useFinancialStateStore((s) => s.loadFinancialState)
  const clearFinancialState = useFinancialStateStore((s) => s.clearFinancialState)

  useEffect(() => {
    const bootstrap = async () => {
      if (!useApiAuth) {
        if (import.meta.env.DEV) console.debug('[auth] bootstrap mode', 'mock')
        setLocalLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      if (import.meta.env.DEV) {
        console.debug('[auth] bootstrap mode', 'api', {
          tokenExists: !!token,
          tokenLength: token?.length ?? 0,
        })
      }
      if (!token) {
        setLocalLoading(false)
        return
      }

      try {
        const mePayload = await httpGet(ENDPOINTS.me)
        if (import.meta.env.DEV) {
          console.debug('[auth] bootstrap /auth/me ok', {
            hasUser: !!(mePayload?.user ?? mePayload),
          })
        }
        const meUser = mapBackendUserToFrontendUser(mePayload?.user ?? mePayload)
        if (meUser) {
          setSession({ usuario: meUser, token })
          if (meUser.rol === 'cliente') {
            await loadFinancialState().catch(() => {})
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[auth] bootstrap /auth/me failed', {
            message: err?.message ?? 'unknown',
            status: err?.status ?? null,
            code: err?.code ?? null,
          })
        }
        clearToken()
        storeLogout()
      } finally {
        setLocalLoading(false)
      }
    }

    bootstrap()
  }, [loadFinancialState, setSession, storeLogout])

  const login = async (email, password) => {
    setLocalLoading(true)

    if (useApiAuth) {
      try {
        if (import.meta.env.DEV) {
          console.debug('[auth] login mode', 'api', {
            endpoint: ENDPOINTS.login,
            useApiAuth,
          })
        }
        const payload = await httpPost(ENDPOINTS.login, { email, password })
        const { token, user } = mapAuthPayloadToSession(payload)
        if (!user) throw new Error('No fue posible obtener usuario autenticado')
        saveToken(token)
        setSession({ usuario: user, token })
        if (user.rol === 'cliente') {
          await loadFinancialState().catch(() => {})
        }
        if (user.rol === 'cliente') {
          logLoginCliente({ nombre: user.nombre ?? user.name, email: user.email })
        }
        return user
      } finally {
        setLocalLoading(false)
      }
    }

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
    if (safeUser.rol === 'cliente') {
      logLoginCliente({ nombre: safeUser.nombre ?? safeUser.name, email: safeUser.email })
    }
    return safeUser
  }

  const register = async (datos) => {
    setLocalLoading(true)

    if (useApiAuth) {
      try {
        const requestPayload = mapRegisterRequestToApiPayload(datos)
        const payload = await httpPost(ENDPOINTS.registro, requestPayload)
        const session = mapAuthPayloadToSession(payload)
        const user = session.user ?? mapBackendUserToFrontendUser(payload?.user ?? payload)
        if (!user) throw new Error('No fue posible crear la cuenta')
        if (session.token) saveToken(session.token)
        setSession({ usuario: user, token: session.token ?? localStorage.getItem('token') })
        if (user.rol === 'cliente') {
          await loadFinancialState().catch(() => {})
        }
        return user
      } catch (err) {
        if (import.meta.env.DEV && err?.details) {
          console.error('[Auth register] backend validation details:', err.details)
        }
        throw err
      } finally {
        setLocalLoading(false)
      }
    }

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
    useUsuariosStore.getState().agregarUsuario(nuevoUsuario)
    const { password: _, ...safeUser } = nuevoUsuario
    setUsuario(safeUser)
    setLocalLoading(false)
    logUsuarioNuevo({
      nombre: datos.nombre ?? datos.name ?? 'Usuario nuevo',
      email: datos.email,
    })
    emailBienvenida({
      nombre: datos.nombre ?? datos.name ?? 'Cliente',
      email: datos.email,
    }).catch(() => {})
    return safeUser
  }

  const requestPasswordReset = async (email) => {
    if (!useApiAuth) return
    await requestPasswordResetApi(email)
  }

  const resetPassword = async (email, newPassword, token) => {
    setLocalLoading(true)

    if (useApiAuth) {
      try {
        const confirmToken = token ?? null
        if (!confirmToken) throw new Error('Token de recuperación requerido para confirmar contraseña')
        await confirmPasswordResetApi({ token: confirmToken, newPassword })
        return
      } finally {
        setLocalLoading(false)
      }
    }

    await new Promise((r) => setTimeout(r, 600))
    const { usuarios, actualizarUsuario } = useUsuariosStore.getState()
    const su = usuarios.find((u) => u.email === email)
    if (!su) {
      setLocalLoading(false)
      throw new Error('No existe una cuenta con ese correo')
    }
    actualizarUsuario(su.id, { password: newPassword })
    setLocalLoading(false)
    emailResetPassword({
      nombre: su.nombre ?? su.name ?? 'Cliente',
      email: su.email,
    }).catch(() => {})
  }

  const logout = async () => {
    if (useApiAuth) {
      try {
        await httpPost(ENDPOINTS.logout, {})
      } catch {
        // noop: siempre limpiar estado local
      }
      clearToken()
      clearFinancialState()
      storeLogout()
      return
    }
    clearFinancialState()
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
        requestPasswordReset,
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

