import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Login.module.css'

const rolDashboard = {
  cliente: '/cliente/dashboard',
  coach: '/coach/dashboard',
  admin: '/admin/dashboard',
}

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
          {mode === 'login'
            ? <LoginForm from={location.state?.from} />
            : <RegisterForm onSuccess={() => setMode('login')} />}
        </div>
      </div>
    </main>
  )
}

function LoginForm({ from }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Completa todos los campos')
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Bienvenido, ${user.nombre.split(' ')[0]}`)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      <p className={styles.hint}>
        Prueba: cliente@casascarlatta.com / 123456
      </p>
    </form>
  )
}

function RegisterForm({ onSuccess }) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', telefono: '' })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.password) return toast.error('Completa los campos obligatorios')
    setLoading(true)
    try {
      const user = await register({
        nombre: `${form.nombre} ${form.apellido}`.trim(),
        email: form.email,
        password: form.password,
        telefono: form.telefono,
      })
      toast.success('Cuenta creada exitosamente')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre *</label>
          <input id="nombre" type="text" placeholder="Tu nombre" autoComplete="given-name" value={form.nombre} onChange={set('nombre')} />
        </div>
        <div className={styles.field}>
          <label htmlFor="apellido">Apellido</label>
          <input id="apellido" type="text" placeholder="Tu apellido" autoComplete="family-name" value={form.apellido} onChange={set('apellido')} />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="reg-email">Correo electrónico *</label>
        <input id="reg-email" type="email" placeholder="tu@correo.com" autoComplete="email" value={form.email} onChange={set('email')} />
      </div>
      <div className={styles.field}>
        <label htmlFor="reg-password">Contraseña *</label>
        <input id="reg-password" type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password" value={form.password} onChange={set('password')} />
      </div>
      <div className={styles.field}>
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" type="tel" placeholder="+52 55 0000 0000" autoComplete="tel" value={form.telefono} onChange={set('telefono')} />
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}
