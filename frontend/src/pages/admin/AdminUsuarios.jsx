import { useState } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useUsuariosStore } from '@/stores/usuariosStore'
import { exportCSV } from '@/utils/exportCSV'
import styles from '@/styles/dashboard.module.css'

const CSV_COLUMNS = [
  { label: 'Nombre', key: 'nombre' },
  { label: 'Email', key: 'email' },
  { label: 'Teléfono', key: 'telefono' },
  { label: 'Fecha nacimiento', key: 'fechaNacimiento' },
  { label: 'Paquete', render: (u) => u.paquete || '—' },
  { label: 'Estado', render: (u) => (u.activo ? 'Activo' : 'Inactivo') },
]

function ConfirmModal({ mensaje, onConfirm, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Confirmar acción</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>{mensaje}</p>
        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsuarios() {
  const { usuarios, actualizarUsuario } = useUsuariosStore()
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [confirmar, setConfirmar] = useState(null)

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
    coach: styles.badgeStride,
    admin: styles.badgeCompletada,
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
        </div>

        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Fecha nac.</th>
                <th>Rol</th>
                <th>Paquete</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                    <td style={{ fontSize: 13 }}>{u.telefono || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.fechaNacimiento || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${rolClass[u.rol] || ''}`}>{u.rol}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.paquete || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {u.paqueteInfo?.tipo || (u.rol === 'cliente' ? 'Individual' : '—')}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.activo ? styles.badgeConfirmada : styles.badgeCancelada}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`${styles.btn} ${u.activo ? styles.btnDanger : styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => handleToggle(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

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
