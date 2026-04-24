import { useState, useRef } from 'react'
import { LayoutDashboard, BookOpen, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClientePerfil.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/perfil', icon: User, label: 'Mi Perfil' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos y Paquetes' },
]

export default function ClientePerfil() {
  const { usuario, actualizarPerfil } = useAuth()
  const fileRef = useRef(null)
  const [previewFoto, setPreviewFoto] = useState(null)
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: usuario?.telefono || '',
    genero: usuario?.genero || '',
    fechaNacimiento: usuario?.fechaNacimiento || '',
  })
  const [errors, setErrors] = useState({})
  const [guardando, setGuardando] = useState(false)

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewFoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (form.telefono && !/^\d{10}$/.test(form.telefono.replace(/\D/g, '')))
      errs.telefono = 'El teléfono debe tener 10 dígitos'
    return errs
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setGuardando(true)
    await new Promise((r) => setTimeout(r, 500))
    actualizarPerfil({
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      genero: form.genero,
      fechaNacimiento: form.fechaNacimiento,
    })
    toast.success('Cambios guardados ✓')
    setGuardando(false)
  }

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Mi Perfil</h1>
          <p className={styles.subtitle}>Gestiona tu información personal</p>
        </div>

        <div className={localStyles.perfilLayout}>
          {/* Avatar section */}
          <div className={localStyles.avatarSection}>
            {previewFoto ? (
              <img src={previewFoto} alt="Foto de perfil" className={localStyles.avatarImg} />
            ) : (
              <div className={localStyles.avatarBig}>
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
              onClick={() => fileRef.current?.click()}
              style={{ marginTop: 'var(--space-sm)' }}
            >
              Cambiar foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFoto}
            />
            <div className={localStyles.avatarName}>{usuario?.nombre}</div>
            <div className={localStyles.avatarRole}>{usuario?.rol}</div>
            {usuario?.paquete && (
              <div className={localStyles.avatarPaquete}>Paquete {usuario.paquete}</div>
            )}
          </div>

          {/* Form */}
          <div className={styles.panel} style={{ flex: 1 }}>
            <div className={styles.panelTitle}>Información personal</div>
            <form onSubmit={handleGuardar}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Nombre completo</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={set('nombre')}
                    style={errors.nombre ? { borderColor: '#EF4444' } : {}}
                  />
                  {errors.nombre && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.nombre}</span>}
                </div>
                <div className={styles.field}>
                  <label>Correo electrónico</label>
                  <input type="email" value={form.email} onChange={set('email')} />
                </div>
                <div className={styles.field}>
                  <label>Teléfono (10 dígitos)</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={set('telefono')}
                    placeholder="5512345678"
                    maxLength={10}
                    style={errors.telefono ? { borderColor: '#EF4444' } : {}}
                  />
                  {errors.telefono && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.telefono}</span>}
                </div>
                <div className={styles.field}>
                  <label>Género</label>
                  <select value={form.genero} onChange={set('genero')}>
                    <option value="">Seleccionar...</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Prefiero no decir">Prefiero no decir</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={set('fechaNacimiento')}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className={styles.field}>
                  <label>Miembro desde</label>
                  <input type="text" value={usuario?.fechaRegistro || '—'} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className={styles.actions} style={{ marginTop: 'var(--space-xl)' }}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
