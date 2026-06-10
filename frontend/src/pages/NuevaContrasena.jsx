import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import PasswordInput from '@/components/ui/PasswordInput'
import styles from './RecuperarContrasena.module.css'
import pwStyles from './NuevaContrasena.module.css'

export default function NuevaContrasena() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetPassword } = useAuth()
  const email = location.state?.email ?? ''

  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validar = () => {
    const errs = {}
    if (password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (password !== confirmar) errs.confirmar = 'Las contraseñas no coinciden'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await resetPassword(email, password, token.trim() || undefined)
      toast.success('¡Contraseña actualizada! Ya puedes iniciar sesión.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Nueva contraseña</h1>
          <p className={styles.subtitle}>
            Elige una contraseña segura{email ? ` para ${email}` : ''}.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="token">Token de recuperación</label>
            <input
              id="token"
              type="text"
              placeholder="Pega aquí el token del correo"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Nueva contraseña</label>
            <PasswordInput
              id="password"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
              className={pwStyles.underlineInput}
              wrapperStyle={{ width: '100%' }}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmar">Confirmar contraseña</label>
            <PasswordInput
              id="confirmar"
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setErrors((p) => ({ ...p, confirmar: '' })) }}
              className={pwStyles.underlineInput}
              wrapperStyle={{ width: '100%' }}
            />
            {errors.confirmar && <span className={styles.error}>{errors.confirmar}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Guardar contraseña'}
          </button>
        </form>

        <div className={styles.divider} />

        <p className={styles.backLink}>
          <Link to="/login">? Volver a iniciar sesión</Link>
        </p>
      </div>
    </main>
  )
}

