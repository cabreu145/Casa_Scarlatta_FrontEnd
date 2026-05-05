import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import BrandBlob from '@/components/ui/BrandBlob'
import styles from './Registro.module.css'

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarTelefono(tel) {
  return /^\d{10}$/.test(tel.replace(/\D/g, ''))
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function LegalModal({ titulo, children, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>{titulo}</h2>
        <div className={styles.modalBody}>{children}</div>
        <button className={styles.modalClose} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  )
}

export default function Registro() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // 'privacidad' | 'responsiva'
  const [checks, setChecks] = useState({ privacidad: false, responsiva: false })
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmarPassword: '',
    fechaNacimiento: '',
    genero: '',
    telefono: '',
  })

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!validarEmail(form.email)) errs.email = 'El email no es válido'
    if (form.password.length < 6) errs.password = 'La contraseña debe tener al menos 6 caracteres'
    if (form.password !== form.confirmarPassword) errs.confirmarPassword = 'Las contraseñas no coinciden'
    if (!form.fechaNacimiento) errs.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    else if (calcularEdad(form.fechaNacimiento) < 16) errs.fechaNacimiento = 'Debes tener al menos 16 años para registrarte'
    if (!form.genero) errs.genero = 'Selecciona una opción'
    if (!form.telefono) errs.telefono = 'El teléfono es obligatorio'
    else if (!validarTelefono(form.telefono)) errs.telefono = 'El teléfono debe tener exactamente 10 dígitos'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    if (!checks.privacidad || !checks.responsiva) return

    setLoading(true)
    try {
      await register({
        nombre: `${form.nombre} ${form.apellido}`.trim(),
        email: form.email,
        password: form.password,
        telefono: form.telefono.replace(/\D/g, ''),
        genero: form.genero,
        fechaNacimiento: form.fechaNacimiento,
      })
      toast.success('¡Bienvenida a Casa Scarlatta! Tu cuenta fue creada.')
      navigate('/', { replace: true })
    } catch (err) {
      if (err.message?.includes('registrado')) {
        setErrors({ email: 'Este email ya está registrado' })
      } else {
        toast.error(err.message || 'Error al crear la cuenta')
      }
    } finally {
      setLoading(false)
    }
  }

  const puedeContinuar = checks.privacidad && checks.responsiva

  return (
    <main className={styles.page}>
      <BrandBlob className={styles.blob} width={500} height={500} />

      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>ÚNETE</span>
          <h1 className={styles.title}>Crea tu cuenta</h1>
          <p className={styles.subtitle}>Empieza tu camino en Casa Scarlatta</p>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Row 1: nombre + apellido */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  autoComplete="given-name"
                  value={form.nombre}
                  onChange={set('nombre')}
                  className={errors.nombre ? styles.inputError : ''}
                />
                {errors.nombre && <span className={styles.error}>{errors.nombre}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="apellido">Apellido</label>
                <input
                  id="apellido"
                  type="text"
                  placeholder="Tu apellido"
                  autoComplete="family-name"
                  value={form.apellido}
                  onChange={set('apellido')}
                />
              </div>
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="email">Correo electrónico *</label>
              <input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                className={errors.email ? styles.inputError : ''}
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>

            {/* Row 2: fecha + genero */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="fechaNacimiento">Fecha de nacimiento *</label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={set('fechaNacimiento')}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.fechaNacimiento ? styles.inputError : ''}
                />
                {errors.fechaNacimiento && <span className={styles.error}>{errors.fechaNacimiento}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="genero">Género *</label>
                <select
                  id="genero"
                  value={form.genero}
                  onChange={set('genero')}
                  className={errors.genero ? styles.inputError : ''}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
                {errors.genero && <span className={styles.error}>{errors.genero}</span>}
              </div>
            </div>

            {/* Telefono */}
            <div className={styles.field}>
              <label htmlFor="telefono">Teléfono celular * (10 dígitos)</label>
              <input
                id="telefono"
                type="tel"
                placeholder="5512345678"
                autoComplete="tel"
                value={form.telefono}
                onChange={set('telefono')}
                maxLength={10}
                className={errors.telefono ? styles.inputError : ''}
              />
              {errors.telefono && <span className={styles.error}>{errors.telefono}</span>}
            </div>

            {/* Password */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  className={errors.password ? styles.inputError : ''}
                />
                {errors.password && <span className={styles.error}>{errors.password}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="confirmarPassword">Confirmar contraseña *</label>
                <input
                  id="confirmarPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  value={form.confirmarPassword}
                  onChange={set('confirmarPassword')}
                  className={errors.confirmarPassword ? styles.inputError : ''}
                />
                {errors.confirmarPassword && <span className={styles.error}>{errors.confirmarPassword}</span>}
              </div>
            </div>

            {/* Legal checkboxes */}
            <div className={styles.legales}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={checks.privacidad}
                  onChange={(e) => setChecks((p) => ({ ...p, privacidad: e.target.checked }))}
                />
                <span>
                  He leído y acepto el{' '}
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setModal('privacidad')}
                  >
                    Aviso de Privacidad
                  </button>
                </span>
              </label>

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={checks.responsiva}
                  onChange={(e) => setChecks((p) => ({ ...p, responsiva: e.target.checked }))}
                />
                <span>
                  Acepto la{' '}
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setModal('responsiva')}
                  >
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

            <p className={styles.loginLink}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>

      {modal === 'privacidad' && (
        <LegalModal titulo="Aviso de Privacidad" onClose={() => setModal(null)}>
          <p>
            Casa Scarlatta Wellness Studio recopila tus datos personales (nombre, email, teléfono,
            fecha de nacimiento) únicamente para gestionar tu cuenta y reservas. Tus datos no serán
            compartidos con terceros. Puedes solicitar la eliminación de tu cuenta en cualquier
            momento escribiendo a{' '}
            <strong>hola@casascarlatta.com</strong>.
          </p>
        </LegalModal>
      )}

      {modal === 'responsiva' && (
        <LegalModal titulo="Responsiva de Actividad Física" onClose={() => setModal(null)}>
          <p>
            Declaro que cuento con las condiciones físicas adecuadas para participar en las
            actividades de Casa Scarlatta. Libero al estudio de cualquier responsabilidad por
            lesiones derivadas de mi participación en clases. Recomiendo consultar a un médico
            antes de iniciar cualquier programa de ejercicio.
          </p>
        </LegalModal>
      )}
    </main>
  )
}
