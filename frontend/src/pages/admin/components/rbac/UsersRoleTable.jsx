import { useEffect, useState } from 'react'
import styles from '../../AdminPanel.module.css'

export default function UsersRoleTable({
  users = [],
  roles = [],
  isLoading = false,
  error = '',
  page = 1,
  total = 0,
  pageSize = 20,
  search = '',
  role = 'all',
  status = 'all',
  setSearch,
  setRole,
  setStatus,
  onPageChange,
  onChangeRole,
  onViewPermissions,
  canAssignRole = false,
  canViewPermissions = false,
}) {
  const [draftRoles, setDraftRoles] = useState({})
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  useEffect(() => {
    setDraftRoles(Object.fromEntries(users.map((user) => [user.id, user.roleCode || user.role || ''])))
  }, [users])

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.usersFilters} style={{ gap: 10 }}>
          <input
            className={styles.searchInput}
            placeholder="Buscar usuario..."
            value={search}
            onChange={(event) => setSearch?.(event.target.value)}
          />
          <select className={styles.formSelect} value={role} onChange={(event) => setRole?.(event.target.value)}>
            <option value="all">Todos los roles</option>
            {roles.map((item) => (
              <option key={item.code || item.id} value={item.code}>{item.name}</option>
            ))}
          </select>
          <select className={styles.formSelect} value={status} onChange={(event) => setStatus?.(event.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {error && <div style={{ padding: 16, color: '#fca5a5' }}>{error}</div>}
      {isLoading && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Cargando usuarios RBAC...</div>}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>RoleCode</th>
              <th>Estado</th>
              <th>Overrides</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={7}>No hay usuarios para mostrar.</td></tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name || 'Sin nombre'}</td>
                <td>{user.email || '-'}</td>
                <td>{user.roleName || user.role || '-'}</td>
                <td><code>{user.roleCode || '-'}</code></td>
                <td>{user.status || '-'}</td>
                <td>{user.permissionOverridesCount ?? 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {canAssignRole && (
                      <>
                        <select
                          className={styles.formSelect}
                          value={draftRoles[user.id] ?? user.roleCode ?? ''}
                          onChange={(event) => setDraftRoles((current) => ({ ...current, [user.id]: event.target.value }))}
                          style={{ minWidth: 160 }}
                        >
                          {roles.map((roleOption) => (
                            <option key={roleOption.code || roleOption.id} value={roleOption.code}>{roleOption.name}</option>
                          ))}
                        </select>
                        <button
                          className={styles.coachBtn}
                          onClick={() => onChangeRole?.(user, draftRoles[user.id] ?? user.roleCode)}
                        >
                          Guardar rol
                        </button>
                      </>
                    )}
                    {canViewPermissions && (
                      <button className={styles.coachBtn} onClick={() => onViewPermissions?.(user)}>
                        Ver permisos
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <button className={`${styles.btn} ${styles.btnGhost}`} disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button className={`${styles.btn} ${styles.btnGhost}`} disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
