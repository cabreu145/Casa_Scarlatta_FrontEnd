import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import styles from './SocialAuthButtons.module.css'

const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
const FACEBOOK_APP_ID = String(import.meta.env.VITE_FACEBOOK_APP_ID ?? '').trim()

function loadScriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)))
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    document.body.appendChild(script)
  })
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.68 9c0-.593.102-1.17.284-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.48 0 2.44 2.021.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.406 8.89v-6.29H5.309V9h2.285V7.017c0-2.256 1.343-3.502 3.4-3.502.985 0 2.014.176 2.014.176v2.215h-1.135c-1.118 0-1.467.694-1.467 1.406V9h2.496l-.399 2.6h-2.097v6.29A9.001 9.001 0 0 0 18 9z" />
    </svg>
  )
}

export default function SocialAuthButtons({ onSuccess }) {
  const { loginWithGoogle, loginWithFacebook } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)

  const handleGoogleCredential = useCallback(
    async (response) => {
      setGoogleLoading(false)
      if (!response?.credential) return
      try {
        const user = await loginWithGoogle(response.credential)
        onSuccess?.(user)
      } catch (err) {
        toast.error(err.message || 'No se pudo iniciar sesión con Google')
      }
    },
    [loginWithGoogle, onSuccess]
  )

  const handleGoogleClick = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('El inicio de sesión con Google aún no está configurado')
      return
    }
    setGoogleLoading(true)
    try {
      await loadScriptOnce('https://accounts.google.com/gsi/client', 'google-identity-sdk')
      if (!window.google?.accounts?.id) throw new Error('No se pudo cargar Google Sign-In')
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      })
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          setGoogleLoading(false)
        }
      })
    } catch (err) {
      setGoogleLoading(false)
      toast.error(err.message || 'No se pudo iniciar sesión con Google')
    }
  }

  const handleFacebookClick = async () => {
    if (!FACEBOOK_APP_ID) {
      toast.error('El inicio de sesión con Facebook aún no está configurado')
      return
    }
    setFbLoading(true)
    try {
      await loadScriptOnce('https://connect.facebook.net/es_LA/sdk.js', 'facebook-jssdk')
      if (!window.FB) throw new Error('No se pudo cargar Facebook SDK')
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' })
      const response = await new Promise((resolve) => {
        window.FB.login((res) => resolve(res), { scope: 'email,public_profile' })
      })
      if (response.status !== 'connected') return
      const accessToken = response.authResponse?.accessToken
      if (!accessToken) throw new Error('Facebook no devolvió un token válido')
      const user = await loginWithFacebook(accessToken)
      onSuccess?.(user)
    } catch (err) {
      toast.error(err.message || 'No se pudo iniciar sesión con Facebook')
    } finally {
      setFbLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.divider}>
        <span>o</span>
      </div>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.socialBtn}
          onClick={handleGoogleClick}
          disabled={googleLoading}
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Conectando…' : 'Continuar con Google'}</span>
        </button>
        <button
          type="button"
          className={styles.socialBtn}
          onClick={handleFacebookClick}
          disabled={fbLoading}
        >
          <FacebookIcon />
          <span>{fbLoading ? 'Conectando…' : 'Continuar con Facebook'}</span>
        </button>
      </div>
    </div>
  )
}
