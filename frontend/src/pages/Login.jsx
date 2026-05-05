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

function LegalModal({ titulo, children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-base)', borderRadius: 'var(--radius-xl)',
        padding: '32px', maxWidth: 460, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--text-primary)', margin: 0 }}>
          {titulo}
        </h2>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {children}
        </div>
        <button
          onClick={onClose}
          style={{
            alignSelf: 'flex-end', fontFamily: 'var(--font-body)', fontSize: 14,
            fontWeight: 500, color: '#F5EDE8', background: 'var(--brand-wine)',
            padding: '10px 24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  )
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
            : <RegisterForm onSuccess={() => setMode('login')} LegalModal={LegalModal} />}
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
      navigate(rolDashboard[user.rol] ?? '/', { replace: true })
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

function RegisterForm({ onSuccess, LegalModal: Modal }) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '',
    telefono: '', fechaNacimiento: '',
  })
  const [checks, setChecks] = useState({ privacidad: false, responsiva: false })
  const [legalModal, setLegalModal] = useState(null) // 'privacidad' | 'responsiva'
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const calcularEdad = (fecha) => {
    if (!fecha) return 0
    const hoy = new Date()
    const nac = new Date(fecha)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'El email no es válido'
    if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (form.fechaNacimiento && calcularEdad(form.fechaNacimiento) < 16)
      errs.fechaNacimiento = 'Debes tener al menos 16 años'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!checks.privacidad || !checks.responsiva) {
      toast.error('Acepta los documentos legales para continuar')
      return
    }
    setLoading(true)
    try {
      const user = await register({
        nombre: `${form.nombre} ${form.apellido}`.trim(),
        email: form.email,
        password: form.password,
        telefono: form.telefono,
        fechaNacimiento: form.fechaNacimiento,
      })
      toast.success('¡Bienvenida a Casa Scarlatta!')
      navigate('/', { replace: true })
    } catch (err) {
      if (err.message?.includes('registrado')) {
        setErrors({ email: 'Este email ya está registrado' })
      } else {
        toast.error(err.message || 'Error al crear cuenta')
      }
    } finally {
      setLoading(false)
    }
  }

  const puedeContinuar = checks.privacidad && checks.responsiva

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre" type="text" placeholder="Tu nombre"
              autoComplete="given-name" value={form.nombre} onChange={set('nombre')}
              style={errors.nombre ? { borderColor: '#EF4444' } : {}}
            />
            {errors.nombre && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.nombre}</span>}
          </div>
          <div className={styles.field}>
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" type="text" placeholder="Tu apellido" autoComplete="family-name" value={form.apellido} onChange={set('apellido')} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="reg-email">Correo electrónico *</label>
          <input
            id="reg-email" type="email" placeholder="tu@correo.com"
            autoComplete="email" value={form.email} onChange={set('email')}
            style={errors.email ? { borderColor: '#EF4444' } : {}}
          />
          {errors.email && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.email}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input
              id="fechaNacimiento" type="date" value={form.fechaNacimiento}
              onChange={set('fechaNacimiento')}
              max={new Date().toISOString().split('T')[0]}
              style={errors.fechaNacimiento ? { borderColor: '#EF4444' } : {}}
            />
            {errors.fechaNacimiento && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.fechaNacimiento}</span>}
          </div>
          <div className={styles.field}>
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" type="tel" placeholder="5512345678" autoComplete="tel" value={form.telefono} onChange={set('telefono')} maxLength={10} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="reg-password">Contraseña *</label>
          <input
            id="reg-password" type="password" placeholder="Mínimo 6 caracteres"
            autoComplete="new-password" value={form.password} onChange={set('password')}
            style={errors.password ? { borderColor: '#EF4444' } : {}}
          />
          {errors.password && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.password}</span>}
        </div>

        {/* Legal checkboxes */}
        <div className={styles.legales}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox" checked={checks.privacidad}
              onChange={(e) => setChecks((p) => ({ ...p, privacidad: e.target.checked }))}
            />
            <span>
              He leído y acepto el{' '}
              <button type="button" className={styles.linkBtn} onClick={() => setLegalModal('privacidad')}>
                Aviso de Privacidad
              </button>
            </span>
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox" checked={checks.responsiva}
              onChange={(e) => setChecks((p) => ({ ...p, responsiva: e.target.checked }))}
            />
            <span>
              Acepto la{' '}
              <button type="button" className={styles.linkBtn} onClick={() => setLegalModal('responsiva')}>
                responsiva de actividad física
              </button>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !puedeContinuar}
          style={!puedeContinuar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      {legalModal === 'privacidad' && (
        <Modal titulo="Aviso de Privacidad" onClose={() => setLegalModal(null)}>
          <p>
            Casa Scarlatta Wellness Studio recopila tus datos personales (nombre, email, teléfono,
            fecha de nacimiento) únicamente para gestionar tu cuenta y reservas. Tus datos no serán
            compartidos con terceros. Puedes solicitar la eliminación de tu cuenta en cualquier
            momento escribiendo a <strong>hola@casascarlatta.com</strong>.
          </p>
        </Modal>
      )}

      {legalModal === 'responsiva' && (
        <Modal titulo="Responsiva de Actividad Física" onClose={() => setLegalModal(null)}>
          <p>
            Declaro que cuento con las condiciones físicas adecuadas para participar en las
            actividades de Casa Scarlatta. Libero al estudio de cualquier responsabilidad por
            lesiones derivadas de mi participación en clases. Recomiendo consultar a un médico
            antes de iniciar cualquier programa de ejercicio.
          </p>
        </Modal>
      )}
    </>
  )
}
