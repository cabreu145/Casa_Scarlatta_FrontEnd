import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useUsuariosStore }      from '@/stores/usuariosStore'
import { usePaquetesStore }       from '@/stores/paquetesStore'
import { useReservasStore }       from '@/stores/reservasStore'
import { useTransaccionesStore }  from '@/stores/transaccionesStore'
import {
  registrarClienteService,
  asignarPaqueteService,
} from '@/services/usuariosService'
import { exportCSV } from '@/utils/exportCSV'
import styles from '@/styles/dashboard.module.css'

const CSV_COLUMNS = [
  { label: 'Nombre',           key: 'nombre' },
  { label: 'Email',            key: 'email' },
  { label: 'Teléfono',         key: 'telefono' },
  { label: 'Fecha nacimiento', key: 'fechaNacimiento' },
  { label: 'Paquete',          render: (u) => u.paquete || '—' },
  { label: 'Estado',           render: (u) => (u.activo ? 'Activo' : 'Inactivo') },
]

// ── Modal confirmar ───────────────────────────────────────────────────────────

function ConfirmModal({ mensaje, onConfirm, onClose }) {
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Confirmar acción</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>{mensaje}</p>
        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Modal registrar cliente ───────────────────────────────────────────────────

function RegistrarModal({ paquetes, onClose }) {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', password: '', paqueteId: '',
  })
  const [guardando, setGuardando] = useState(false)
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) {
      toast.error('Nombre y email son obligatorios')
      return
    }
    setGuardando(true)
    const paquete = paquetes.find((p) => String(p.id) === form.paqueteId)
    const resultado = await registrarClienteService({
      nombre:        form.nombre,
      email:         form.email,
      telefono:      form.telefono,
      password:      form.password || '123456',
      paquete:       paquete?.nombre || null,
      clasesPaquete: paquete ? (paquete.clases === 0 ? 999 : paquete.clases) : 0,
    })
    if (resultado.ok) {
      toast.success(resultado.mensaje)
      onClose()
    } else {
      toast.error(resultado.mensaje)
    }
    setGuardando(false)
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className={styles.modalTitle} style={{ margin: 0 }}>Registrar cliente</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid} style={{ marginBottom: 'var(--space-lg)' }}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Nombre completo <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Sofía Reyes" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Email <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="sofia@email.com" />
            </div>
            <div className={styles.field}>
              <label>Teléfono</label>
              <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+52 55 0000 0000" />
            </div>
            <div className={styles.field}>
              <label>Contraseña inicial</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Dejar vacío → '123456'" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Paquete inicial</label>
              <select value={form.paqueteId} onChange={set('paqueteId')}>
                <option value="">Sin paquete por ahora</option>
                {paquetes.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nombre} — ${p.precio.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={guardando}>
              {guardando ? 'Registrando…' : 'Registrar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Modal detalle de usuario (Ver) ────────────────────────────────────────────

function DetalleUsuarioModal({ usuario, paquetes, reservas, onClose }) {
  const { actualizarUsuario }       = useUsuariosStore()
  const { getTransaccionesByUsuario } = useTransaccionesStore()

  const [vista, setVista]       = useState('info') // 'info' | 'transacciones' | 'reservas' | 'editar' | 'paquete'
  const [guardando, setGuardando] = useState(false)

  // Editar form
  const [form, setForm] = useState({
    nombre:          usuario.nombre,
    telefono:        usuario.telefono        || '',
    fechaNacimiento: usuario.fechaNacimiento || '',
    genero:          usuario.genero          || '',
  })
  const setField = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  // Asignar paquete
  const [paqueteId, setPaqueteId] = useState('')

  const transacciones   = getTransaccionesByUsuario(usuario.id)
  const reservasUsuario = reservas.filter((r) => r.userId === usuario.id)

  const estadoBadge = {
    confirmada: styles.badgeConfirmada,
    cancelada:  styles.badgeCancelada,
    completada: styles.badgeCompletada,
    no_asistio: styles.badgeCancelada,
  }
  const tipoBadge = {
    ingreso:    styles.badgeConfirmada,
    egreso:     styles.badgeCancelada,
    devolucion: styles.badgeSlow,
  }

  const handleGuardarEditar = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    actualizarUsuario(usuario.id, form)
    toast.success('Usuario actualizado')
    setVista('info')
  }

  const handleAsignarPaquete = async () => {
    const paquete = paquetes.find((p) => String(p.id) === paqueteId)
    if (!paquete) { toast.error('Selecciona un paquete'); return }
    setGuardando(true)
    const resultado = await asignarPaqueteService(usuario.id, paquete, 'estudio')
    if (resultado.ok) {
      toast.success(resultado.mensaje)
      setVista('info')
    } else {
      toast.error(resultado.mensaje)
    }
    setGuardando(false)
  }

  const tabs = [
    { id: 'info',          label: 'Datos' },
    { id: 'transacciones', label: `Transacciones (${transacciones.length})` },
    { id: 'reservas',      label: `Reservas (${reservasUsuario.length})` },
  ]

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ maxWidth: 660 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div>
            <h2 className={styles.modalTitle} style={{ margin: 0 }}>{usuario.nombre}</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {usuario.email}
            </p>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {(vista === 'info' || vista === 'transacciones' || vista === 'reservas') && (
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)' }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`${styles.btn} ${vista === t.id ? styles.btnPrimary : styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => setVista(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Vista: Datos */}
        {vista === 'info' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              {[
                ['Nombre',          usuario.nombre],
                ['Email',           usuario.email],
                ['Teléfono',        usuario.telefono        || '—'],
                ['Fecha nacimiento',usuario.fechaNacimiento || '—'],
                ['Género',          usuario.genero          || '—'],
                ['Rol',             usuario.rol],
                ['Paquete activo',  usuario.paquete         || 'Sin paquete'],
                ['Créditos',        usuario.clasesPaquete === 999 ? '∞' : (usuario.clasesPaquete ?? '—')],
                ['Miembro desde',   usuario.creadoEn ? new Date(usuario.creadoEn).toLocaleDateString('es-MX') : '—'],
                ['Estado',          usuario.activo ? 'Activo' : 'Inactivo'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cerrar</button>
              {usuario.rol === 'cliente' && (
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setVista('paquete')}>
                  Asignar paquete
                </button>
              )}
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setVista('editar')}>
                Editar perfil
              </button>
            </div>
          </div>
        )}

        {/* Vista: Transacciones */}
        {vista === 'transacciones' && (
          <div>
            {transacciones.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)', fontFamily: 'var(--font-body)' }}>
                Sin transacciones registradas
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Monto</th>
                      <th>Tipo</th>
                      <th>Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {t.fecha ? new Date(t.fecha).toLocaleDateString('es-MX') : '—'}
                        </td>
                        <td style={{ fontWeight: 500 }}>{t.concepto || '—'}</td>
                        <td style={{ fontSize: 13 }}>
                          ${typeof t.monto === 'number' ? t.monto.toLocaleString() : t.monto}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${tipoBadge[t.tipo] || ''}`}>
                            {t.tipo || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.metodoPago || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}

        {/* Vista: Reservas */}
        {vista === 'reservas' && (
          <div>
            {reservasUsuario.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)', fontFamily: 'var(--font-body)' }}>
                Sin reservas registradas
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Clase</th><th>Coach</th><th>Día</th><th>Hora</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {reservasUsuario.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.claseNombre}</td>
                        <td style={{ fontSize: 13 }}>{r.coachNombre}</td>
                        <td style={{ fontSize: 13 }}>{r.claseDia}</td>
                        <td style={{ fontSize: 13 }}>{r.claseHora}</td>
                        <td>
                          <span className={`${styles.badge} ${estadoBadge[r.estado] || ''}`}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}

        {/* Vista: Editar perfil */}
        {vista === 'editar' && (
          <form onSubmit={handleGuardarEditar}>
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)', padding: 0 }}
                onClick={() => setVista('info')}
              >
                ← Volver a datos
              </button>
            </div>
            <div className={styles.formGrid} style={{ marginBottom: 'var(--space-lg)' }}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Nombre completo <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" value={form.nombre} onChange={setField('nombre')} placeholder="Nombre completo" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Email</label>
                <input type="email" value={usuario.email} readOnly
                  style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-elevated)' }} />
              </div>
              <div className={styles.field}>
                <label>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={setField('telefono')} placeholder="+52 55 0000 0000" />
              </div>
              <div className={styles.field}>
                <label>Fecha de nacimiento</label>
                <input type="date" value={form.fechaNacimiento} onChange={setField('fechaNacimiento')} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Género</label>
                <select value={form.genero} onChange={setField('genero')}>
                  <option value="">Prefiero no decir</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="No binario">No binario</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setVista('info')}>Cancelar</button>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Guardar cambios</button>
            </div>
          </form>
        )}

        {/* Vista: Asignar paquete */}
        {vista === 'paquete' && (
          <div>
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)', padding: 0 }}
                onClick={() => setVista('info')}
              >
                ← Volver a datos
              </button>
            </div>
            <div className={styles.field} style={{ marginBottom: 'var(--space-lg)' }}>
              <label>Selecciona un paquete</label>
              <select value={paqueteId} onChange={(e) => setPaqueteId(e.target.value)}>
                <option value="">— Elegir —</option>
                {paquetes.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nombre} — {p.clases === 0 ? 'Ilimitadas' : `${p.clases} clases`} — ${p.precio.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setVista('info')}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleAsignarPaquete}
                disabled={!paqueteId || guardando}
              >
                {guardando ? 'Asignando…' : 'Confirmar asignación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminUsuarios() {
  const { usuarios, actualizarUsuario } = useUsuariosStore()
  const { paquetes }  = usePaquetesStore()
  const { reservas }  = useReservasStore()

  const [busqueda,       setBusqueda]       = useState('')
  const [filtroRol,      setFiltroRol]      = useState('todos')
  const [confirmar,      setConfirmar]      = useState(null)
  const [modalRegistrar, setModalRegistrar] = useState(false)
  const [modalDetalle,   setModalDetalle]   = useState(null)   // usuario | null

  const filtrados = (usuarios ?? []).filter((u) => {
    const matchBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    return matchBusqueda && matchRol
  })

  const handleToggle = (usuario) => {
    setConfirmar({
      mensaje: usuario.activo
        ? `¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión.`
        : `¿Reactivar a ${usuario.nombre}?`,
      onConfirm: () => {
        actualizarUsuario(usuario.id, { activo: !usuario.activo })
        toast.success(`${usuario.nombre} ${usuario.activo ? 'desactivado' : 'reactivado'}`)
        setConfirmar(null)
      },
    })
  }

  const handleExportar = () => {
    const fecha = new Date().toISOString().split('T')[0]
    const clientes = filtrados.filter((u) => u.rol === 'cliente')
    exportCSV(clientes, `usuarios_casascarlatta_${fecha}.csv`, CSV_COLUMNS)
    toast.success('CSV exportado correctamente')
  }

  const rolClass = {
    cliente: styles.badgeSlow,
    coach:   styles.badgeStride,
    admin:   styles.badgeCompletada,
  }

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Usuarios</h1>
          <p className={styles.subtitle}>{usuarios.length} usuarios registrados</p>
        </div>

        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {['todos', 'cliente', 'coach', 'admin'].map((r) => (
            <button
              key={r}
              className={`${styles.btn} ${filtroRol === r ? styles.btnPrimary : styles.btnSecondary} ${styles.btnSm}`}
              onClick={() => setFiltroRol(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={handleExportar}
          >
            Exportar CSV
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setModalRegistrar(true)}
          >
            + Registrar cliente
          </button>
        </div>

        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Paquete</th>
                <th>Créditos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`${styles.badge} ${rolClass[u.rol] || ''}`}>{u.rol}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.paquete || '—'}</td>
                  <td style={{ fontSize: 13 }}>
                    {u.clasesPaquete === 999 ? '∞' : (u.clasesPaquete ?? '—')}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.activo ? styles.badgeConfirmada : styles.badgeCancelada}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => setModalDetalle(u)}
                      >
                        Ver
                      </button>
                      <button
                        className={`${styles.btn} ${u.activo ? styles.btnDanger : styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => handleToggle(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalRegistrar && (
        <RegistrarModal
          paquetes={paquetes}
          onClose={() => setModalRegistrar(false)}
        />
      )}

      {modalDetalle && (
        <DetalleUsuarioModal
          usuario={modalDetalle}
          paquetes={paquetes}
          reservas={reservas}
          onClose={() => setModalDetalle(null)}
        />
      )}

      {confirmar && (
        <ConfirmModal
          mensaje={confirmar.mensaje}
          onConfirm={confirmar.onConfirm}
          onClose={() => setConfirmar(null)}
        />
      )}
    </DashboardLayout>
  )
}
