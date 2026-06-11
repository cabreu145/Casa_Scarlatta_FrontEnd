import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PasswordInput from '@/components/ui/PasswordInput'
import {
  useConfirmPasswordResetMutation,
  useRequestPasswordResetMutation,
} from '@/hooks/useApiQueries'
import styles from './RecuperarContrasena.module.css'

function mapResetError(error) {
  const code = String(error?.code ?? error?.message ?? '').trim()
  const mapped = {
    RESET_TOKEN_INVALID: 'El enlace no es válido. Solicita uno nuevo.',
    RESET_TOKEN_EXPIRED: 'El enlace expiró. Solicita uno nuevo.',
    RESET_TOKEN_ALREADY_USED: 'Este enlace ya fue utilizado. Solicita uno nuevo si necesitas cambiar tu contraseña otra vez.',
    PASSWORD_TOO_WEAK: 'La contraseña no cumple con los requisitos mínimos.',
    USER_INACTIVE: 'Tu cuenta no está activa. Contacta a Casa Scarlatta.',
  }
  return mapped[code] ?? 'No pudimos restablecer tu contraseña. Intenta solicitar un nuevo enlace.'
}

function mapRequestError(error) {
  return error?.message || 'No fue posible enviar instrucciones de recuperación.'
}

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => String(searchParams.get('token') ?? '').trim(), [searchParams])
  const hasToken = Boolean(token)
  const requestMutation = useRequestPasswordResetMutation()
  const confirmMutation = useConfirmPasswordResetMutation()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setFormError('')
    setRequestSent(false)
    setResetSuccess(false)
    setNewPassword('')
    setConfirmPassword('')
  }, [token])

  useEffect(() => {
    if (!resetSuccess) return undefined
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 3000)
    return () => window.clearTimeout(timer)
  }, [navigate, resetSuccess])

  const handleRequestSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = String(email ?? '').trim()
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Ingresa un correo válido.')
      return
    }
    setFormError('')
    try {
      await requestMutation.mutateAsync(normalizedEmail)
      setRequestSent(true)
    } catch (error) {
      setFormError(mapRequestError(error))
    }
  }

  const handleConfirmSubmit = async (event) => {
    event.preventDefault()
    const password = String(newPassword ?? '')
    const confirmation = String(confirmPassword ?? '')
    if (!token) {
      setFormError('Falta enlace de recuperación válido.')
      return
    }
    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmation) {
      setFormError('Las contraseñas no coinciden.')
      return
    }
    setFormError('')
    try {
      await confirmMutation.mutateAsync({ token, newPassword: password })
      setResetSuccess(true)
    } catch (error) {
      setFormError(mapResetError(error))
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        {!hasToken && !requestSent && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Recuperar contraseña</h1>
              <p className={styles.subtitle}>
                Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleRequestSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setFormError('')
                  }}
                />
              </div>

              {formError && <p className={styles.error}>{formError}</p>}

              <button type="submit" className={styles.submitBtn} disabled={requestMutation.isPending}>
                {requestMutation.isPending ? <span className={styles.spinner} /> : 'Enviar instrucciones'}
              </button>
            </form>

            <div className={styles.divider} />

            <p className={styles.backLink}>
              ¿Ya la recordaste? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}

        {!hasToken && requestSent && (
          <>
            <div className={styles.header}>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.title}>Revisa tu correo</h1>
              <p className={styles.subtitle}>
                Si el correo existe, recibirás instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <p className={styles.spamNote}>Revisa también tu carpeta de spam.</p>

            <button type="button" className={styles.submitBtn} onClick={() => navigate('/login')}>
              Ir a Iniciar Sesión
            </button>

            <div className={styles.divider} />

            <p className={styles.backLink}>
              <Link to="/login">Volver a Iniciar Sesión</Link>
            </p>
          </>
        )}

        {hasToken && !resetSuccess && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Nueva contraseña</h1>
              <p className={styles.subtitle}>
                Define una nueva contraseña segura para tu cuenta.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleConfirmSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor="new-password">Nueva contraseña</label>
                <PasswordInput
                  id="new-password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setFormError('')
                  }}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setFormError('')
                  }}
                />
              </div>

              {formError && <p className={styles.error}>{formError}</p>}

              <button type="submit" className={styles.submitBtn} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? <span className={styles.spinner} /> : 'Restablecer contraseña'}
              </button>
            </form>

            <div className={styles.divider} />

            <p className={styles.backLink}>
              <Link to="/login">Volver a Iniciar Sesión</Link>
            </p>
          </>
        )}

        {hasToken && resetSuccess && (
          <>
            <div className={styles.header}>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.title}>Contraseña actualizada</h1>
              <p className={styles.subtitle}>
                Tu contraseña fue actualizada correctamente. Ya puedes Iniciar Sesión.
              </p>
            </div>

            <button type="button" className={styles.submitBtn} onClick={() => navigate('/login', { replace: true })}>
              Ir a Iniciar Sesión
            </button>

            <div className={styles.divider} />

            <p className={styles.backLink}>
              Serás redirigido a login en unos segundos.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
