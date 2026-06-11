import styles from '../../AdminPanel.module.css'

export default function RolesList({
  roles = [],
  isLoading = false,
  error = '',
  page = 1,
  total = 0,
  pageSize = 20,
  search = '',
  status = 'all',
  setSearch,
  setStatus,
  onPageChange,
  onCreate,
  onEdit,
  onToggleActive,
  canCreate = false,
  canEdit = false,
  canAssignPermissions = false,
  canDelete = false,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.usersFilters} style={{ gap: 10 }}>
          <input
            className={styles.searchInput}
            placeholder="Buscar rol..."
            value={search}
            onChange={(event) => setSearch?.(event.target.value)}
          />
          <select className={styles.formSelect} value={status} onChange={(event) => setStatus?.(event.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        {canCreate && (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onCreate}>
            + Nuevo rol
          </button>
        )}
      </div>

      {error && <div style={{ padding: 16, color: '#fca5a5' }}>{error}</div>}
      {isLoading && <div style={{ padding: 16, color: 'var(--text-muted)' }}>Cargando roles...</div>}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Base role</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Permisos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!isLoading && roles.length === 0 && (
              <tr><td colSpan={7}>No hay roles registrados.</td></tr>
            )}
            {roles.map((role) => (
              <tr key={role.id ?? role.code}>
                <td>{role.name || 'Sin nombre'}</td>
                <td><code>{role.code}</code></td>
                <td>{role.baseRole || '-'}</td>
                <td>{role.isSystem ? 'Sistema' : 'Personalizado'}</td>
                <td>{role.isActive ? 'Activo' : 'Inactivo'}</td>
                <td>{role.permissionsCount ?? role.permissionKeys?.length ?? 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {(canEdit || canAssignPermissions) && (
                      <button className={styles.coachBtn} onClick={() => onEdit?.(role)}>
                        Editar
                      </button>
                    )}
                    {(canDelete || canEdit) && (
                      <button className={styles.coachBtn} onClick={() => onToggleActive?.(role)}>
                        {role.isActive ? 'Desactivar' : 'Activar'}
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
