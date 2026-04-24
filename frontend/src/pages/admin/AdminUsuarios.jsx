import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { mockUsers } from '@/data/mockUsers'
import styles from '@/styles/dashboard.module.css'

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState(mockUsers)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')

  const filtrados = usuarios.filter((u) => {
    const matchBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    return matchBusqueda && matchRol
  })

  const toggleActivo = (id) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    )
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
          <p className={styles.subtitle}>{filtrados.length} usuarios</p>
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
        </div>

        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Paquete</th>
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
                    <span className={`${styles.badge} ${rolClass[u.rol] || ''}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.paquete || '—'}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${u.activo ? styles.badgeConfirmada : styles.badgeCancelada}`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`${styles.btn} ${u.activo ? styles.btnDanger : styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => toggleActivo(u.id)}
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
    </DashboardLayout>
  )
}
