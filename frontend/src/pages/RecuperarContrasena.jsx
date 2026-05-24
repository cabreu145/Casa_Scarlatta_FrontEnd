import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './RecuperarContrasena.module.css'

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un correo válido')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    toast.success(
      'Te hemos enviado un correo para restablecer tu contraseña. ' +
      'Revisa tu bandeja de entrada y spam 📧',
      { duration: 6000 }
    )
    setEnviado(true)
  }

  return (
    <main className={styles.page}>

      <div className={styles.inner}>
        {!enviado ? (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Recupera tu contraseña</h1>
              <p className={styles.subtitle}>
                Ingresa tu correo y te enviaremos instrucciones para restablecerla.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : 'Enviar instrucciones'}
              </button>
            </form>

            <div className={styles.divider} />

            <p className={styles.backLink}>
              ¿Ya la recordaste?{' '}
              <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.successIcon}>✉️</div>
              <h1 className={styles.title}>Revisa tu correo</h1>
              <p className={styles.subtitle}>
                Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace
                para restablecer tu contraseña en los próximos minutos.
              </p>
            </div>

            <p className={styles.spamNote}>
              Revisa también tu carpeta de spam o correo no deseado.
            </p>

            <button
              className={styles.submitBtn}
              onClick={() => navigate('/nueva-contrasena', { state: { email } })}
            >
              Establecer nueva contraseña →
            </button>

            <div className={styles.divider} />

            <p className={styles.backLink}>
              <Link to="/login">← Volver a iniciar sesión</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
