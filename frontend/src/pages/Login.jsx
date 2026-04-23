import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Login.module.css'

export default function Login() {
  const location = useLocation()
  const reservation = location.state ?? {}
  const [mode, setMode] = useState('login')

  return (
    <main className={styles.page}>
      <BrandBlob className={styles.blob} width={460} height={460} />
      <div className={styles.inner}>
        <SectionHeader
          label={reservation.selectedClass ? 'Casi listo' : 'Bienvenido'}
          title={mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          subtitle={
            reservation.selectedClass
              ? `Para confirmar tu lugar en ${reservation.selectedClass.name}, inicia sesión o crea una cuenta.`
              : 'Accede a tu cuenta para gestionar tus reservas.'
          }
          size="lg"
        />

        {/* Toggle */}
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${mode === 'login' ? styles.toggleActive : ''}`}
            onClick={() => setMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'register' ? styles.toggleActive : ''}`}
            onClick={() => setMode('register')}
          >
            Crear cuenta
          </button>
        </div>

        <div className={styles.card}>
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </main>
  )
}

function LoginForm() {
  return (
    <form className={styles.form} onSubmit={e => e.preventDefault()}>
      <div className={styles.field}>
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" type="email" placeholder="tu@correo.com" autoComplete="email" />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
      </div>
      <button type="submit" className={styles.submitBtn}>Entrar</button>
      <p className={styles.forgotLink}>
        <a href="#">¿Olvidaste tu contraseña?</a>
      </p>
    </form>
  )
}

function RegisterForm() {
  return (
    <form className={styles.form} onSubmit={e => e.preventDefault()}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" type="text" placeholder="Tu nombre" autoComplete="given-name" />
        </div>
        <div className={styles.field}>
          <label htmlFor="apellido">Apellido</label>
          <input id="apellido" type="text" placeholder="Tu apellido" autoComplete="family-name" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="reg-email">Correo electrónico</label>
        <input id="reg-email" type="email" placeholder="tu@correo.com" autoComplete="email" />
      </div>
      <div className={styles.field}>
        <label htmlFor="reg-password">Contraseña</label>
        <input id="reg-password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
      </div>
      <div className={styles.field}>
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" type="tel" placeholder="+52 55 0000 0000" autoComplete="tel" />
      </div>
      <button type="submit" className={styles.submitBtn}>Crear cuenta</button>
    </form>
  )
}
