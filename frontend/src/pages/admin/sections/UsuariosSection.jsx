import { useState } from 'react'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'

function Tag({ color, children }) {
  const cls = {
    green: styles.tagGreen,
    red: styles.tagRed,
    yellow: styles.tagYellow,
  }[color] || styles.tagGreen
  return <span className={`${styles.miniTag} ${cls}`}>{children}</span>
}

export default function UsuariosSection({
  usuarios,
  paquetes,
  usersFilter,
  setUsersFilter,
  usersSearch,
  setUsersSearch,
  userSelectMode,
  setUserSelectMode,
  userSelectedIds,
  setUserSelectedIds,
  eliminarUsuario,
  openModal,
  onViewClient,
  useApiMode = false,
  isLoading = false,
  error = '',
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
}) {
  const [usersExpandido, setUsersExpandido] = useState(false)
  const localPageSize = 10
  const clientes = usuarios.filter((u) => u.rol !== 'coach' && u.rol !== 'admin')
  const conPaquete = clientes.filter((u) => u.paquete).length
  const sinPaquete = clientes.length - conPaquete

  const usuariosFiltrados = useApiMode
    ? clientes
    : clientes.filter((u) => {
        if (usersSearch.trim()) {
          const q = usersSearch.toLowerCase()
          const coincide = u.nombre?.toLowerCase().includes(q)
            || u.email?.toLowerCase().includes(q)
            || u.paquete?.toLowerCase().includes(q)
            || u.telefono?.toLowerCase().includes(q)
          if (!coincide) return false
        }
        if (usersFilter === 'Activos') return u.activo && u.paquete
        if (usersFilter === 'Sin paquete') return !u.paquete
        if (usersFilter === 'Por vencer') return u.clasesPaquete > 0 && u.clasesPaquete <= 2
        return true
      })
  const usuariosVisibles = useApiMode
    ? usuariosFiltrados
    : usersExpandido
      ? usuariosFiltrados
      : usuariosFiltrados.slice(0, localPageSize)
  const hayMasUsuarios = !useApiMode && usuariosFiltrados.length > localPageSize
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function deleteSelected() {
    if (!window.confirm(`Eliminar ${userSelectedIds.size} usuario(s)?`)) return
    try {
      await eliminarUsuario([...userSelectedIds])
      toast.success(`${userSelectedIds.size} usuario(s) desactivado(s)`)
      setUserSelectedIds(new Set())
      setUserSelectMode(false)
    } catch (deleteError) {
      toast.error(deleteError?.message ?? 'No se pudieron desactivar los usuarios')
    }
  }

  return (
    <>
      <div className={styles.kpiGrid} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total usuarios', val: String(useApiMode ? total : clientes.length), change: 'Miembros registrados', up: true },
          { label: 'Con paquete visible', val: String(conPaquete), change: 'En pagina actual', up: true },
          { label: 'Sin paquete visible', val: String(sinPaquete), change: 'En pagina actual', up: false },
          { label: 'Reservas visibles', val: String(clientes.reduce((sum, item) => sum + (item.reservationsCount ?? 0), 0)), change: 'Acumulado de pagina', up: true },
        ].map(({ label, val, change, up }) => (
          <div key={label} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{label}</div>
            <div className={styles.kpiValue}>{val}</div>
            <div className={`${styles.kpiChange} ${up ? styles.up : styles.down}`}>{change}</div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.usersFilters}>
            <input
              className={styles.searchInput}
              placeholder="Buscar usuario..."
              type="text"
              value={usersSearch}
              onChange={(event) => setUsersSearch(event.target.value)}
            />
            {['Todos', 'Activos', 'Sin paquete', 'Por vencer'].map((filter) => (
              <button
                key={filter}
                className={`${styles.filterChip}${usersFilter === filter ? ` ${styles.active}` : ''}`}
                onClick={() => setUsersFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {userSelectMode && userSelectedIds.size > 0 && (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={deleteSelected}>
                Eliminar ({userSelectedIds.size})
              </button>
            )}
            <button
              className={`${styles.btn} ${userSelectMode ? styles.btnSecondary : styles.btnGhost}`}
              onClick={() => {
                setUserSelectMode((value) => !value)
                setUserSelectedIds(new Set())
              }}
            >
              {userSelectMode ? 'Cancelar' : 'Seleccionar'}
            </button>
            {!userSelectMode && (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('usuario')}>
                + Nuevo usuario
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ padding: 16, color: '#f87171' }}>{error}</div>}
        {isLoading && <div style={{ padding: 16, color: 'var(--muted)' }}>Cargando clientes...</div>}

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                {userSelectMode && <th style={{ width: 36 }} />}
                <th>Usuario</th>
                <th>Paquete</th>
                <th>Creditos</th>
                <th>Vencimiento</th>
                <th>Ultima visita</th>
                <th>Reservas</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!isLoading && usuariosVisibles.length === 0 && (
                <tr><td colSpan={userSelectMode ? 9 : 8}>No hay clientes para estos filtros.</td></tr>
              )}
              {usuariosVisibles.map((client) => {
                const selected = userSelectedIds.has(client.id)
                const statusColor = client.activo ? (client.paquete ? 'green' : 'yellow') : 'red'
                const statusLabel = client.activo ? (client.paquete ? 'Activo' : 'Sin paquete') : 'Inactivo'
                return (
                  <tr key={client.id} style={{ background: selected ? 'rgba(239,68,68,0.08)' : undefined }}>
                    {userSelectMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => setUserSelectedIds((previous) => {
                            const next = new Set(previous)
                            next.has(client.id) ? next.delete(client.id) : next.add(client.id)
                            return next
                          })}
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={styles.miniAvatar}>{client.nombre?.[0] ?? '?'}</div>
                        <div>
                          <div>{client.nombre}</div>
                          <small>{client.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{client.paquete || '-'}</td>
                    <td>{client.creditsBalance ?? client.clasesPaquete ?? 0}</td>
                    <td>{client.activeMembership?.expiresAt ?? client.paqueteInfo?.fechaVencimiento ?? '-'}</td>
                    <td>{client.lastVisit ?? '-'}</td>
                    <td>{client.reservationsCount ?? '-'}</td>
                    <td><Tag color={statusColor}>{statusLabel}</Tag></td>
                    <td>
                      {!userSelectMode && (
                        <button className={styles.coachBtn} style={{ width: 60 }} onClick={() => onViewClient(client)}>
                          Ver
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {useApiMode && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <button className={`${styles.btn} ${styles.btnGhost}`} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
            <span>Pagina {page} de {totalPages}</span>
            <button className={`${styles.btn} ${styles.btnGhost}`} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Siguiente</button>
          </div>
        )}

        {hayMasUsuarios && (
          <button onClick={() => setUsersExpandido((value) => !value)} style={{ width: '100%', marginTop: 12 }}>
            {usersExpandido ? 'Ver menos' : `Ver ${usuariosFiltrados.length - localPageSize} mas`}
          </button>
        )}
      </div>
    </>
  )
}
