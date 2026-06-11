import { useMemo, useState } from 'react'
import styles from '../../AdminPanel.module.css'

function groupPermissionsByModule(permissions = []) {
  return permissions.reduce((acc, permission) => {
    const moduleKey = permission.module || 'general'
    if (!acc[moduleKey]) acc[moduleKey] = []
    acc[moduleKey].push(permission)
    return acc
  }, {})
}

export default function PermissionMatrix({
  permissions = [],
  selectedKeys = [],
  onChange,
  disabled = false,
}) {
  const [search, setSearch] = useState('')
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return permissions
    return permissions.filter((permission) => {
      const haystack = [
        permission.key,
        permission.label,
        permission.description,
        permission.module,
        permission.action,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [permissions, search])

  const grouped = useMemo(() => groupPermissionsByModule(filteredPermissions), [filteredPermissions])

  function togglePermission(permissionKey) {
    const next = new Set(selectedSet)
    if (next.has(permissionKey)) next.delete(permissionKey)
    else next.add(permissionKey)
    onChange?.([...next])
  }

  function toggleModule(modulePermissions = []) {
    const keys = modulePermissions.map((permission) => permission.key).filter(Boolean)
    const allSelected = keys.every((key) => selectedSet.has(key))
    const next = new Set(selectedSet)
    keys.forEach((key) => {
      if (allSelected) next.delete(key)
      else next.add(key)
    })
    onChange?.([...next])
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className={styles.formInput}
          placeholder="Buscar permiso..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled}
          style={{ maxWidth: 280 }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          {selectedKeys.length} seleccionados / {permissions.length}
        </span>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding: 16, borderRadius: 10, border: '1px dashed var(--neutral-border)', color: 'var(--text-muted)' }}>
          No hay permisos disponibles.
        </div>
      ) : (
        Object.entries(grouped).map(([moduleKey, modulePermissions]) => {
          const total = modulePermissions.length
          const selected = modulePermissions.filter((permission) => selectedSet.has(permission.key)).length
          return (
            <div key={moduleKey} style={{ border: '1px solid var(--neutral-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--neutral-border)',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {moduleKey}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {selected}/{total} permisos
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => toggleModule(modulePermissions)}
                  disabled={disabled}
                >
                  {selected === total ? 'Quitar módulo' : 'Seleccionar módulo'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: 0 }}>
                {modulePermissions.map((permission) => (
                  <label
                    key={permission.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px 1fr',
                      gap: 10,
                      alignItems: 'start',
                      padding: '12px 14px',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSet.has(permission.key)}
                      onChange={() => togglePermission(permission.key)}
                      disabled={disabled}
                    />
                    <span>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {permission.label || permission.key}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {permission.key}
                        {permission.description ? ` · ${permission.description}` : ''}
                      </div>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
