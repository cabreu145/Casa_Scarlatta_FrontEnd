import { useEffect, useMemo, useState } from 'react'
import styles from '../../AdminPanel.module.css'

function groupPermissionItems(items = []) {
  return items.reduce((acc, item) => {
    const permissionKey = typeof item === 'string' ? item : item.key
    const moduleKey = typeof item === 'string'
      ? String(item).split('.')[0] || 'general'
      : item.module || 'general'
    if (!acc[moduleKey]) acc[moduleKey] = []
    acc[moduleKey].push(permissionKey)
    return acc
  }, {})
}

export default function UserPermissionsDrawer({
  open = false,
  user = null,
  permissionsDetail = null,
  permissionsCatalog = [],
  isLoading = false,
  isSaving = false,
  canManage = false,
  onClose,
  onSave,
}) {
  const [overrides, setOverrides] = useState([])

  useEffect(() => {
    if (!open) return
    setOverrides((permissionsDetail?.overrides ?? []).map((override) => ({
      permissionKey: override.permissionKey ?? '',
      effect: override.effect ?? 'deny',
    })))
  }, [open, permissionsDetail])

  const rolePermissionsByModule = useMemo(
    () => groupPermissionItems(permissionsDetail?.rolePermissions ?? []),
    [permissionsDetail]
  )
  const effectivePermissionsByModule = useMemo(
    () => groupPermissionItems(permissionsDetail?.effectivePermissions ?? []),
    [permissionsDetail]
  )

  if (!open) return null

  return (
    <div className={`${styles.modalOverlay} ${styles.open}`} onClick={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <div className={styles.modal} style={{ maxWidth: 860, width: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Permisos efectivos</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {user?.name || 'Usuario'} · {permissionsDetail?.roleName || permissionsDetail?.roleCode || permissionsDetail?.role || user?.roleName || user?.roleCode}
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        {isLoading ? (
          <div style={{ padding: 16, color: 'var(--text-muted)' }}>Cargando permisos...</div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <section>
              <h4 style={{ marginBottom: 8 }}>Permisos del rol</h4>
              {Object.keys(rolePermissionsByModule).length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Sin permisos en rol base.</div>
              ) : (
                Object.entries(rolePermissionsByModule).map(([moduleKey, keys]) => (
                  <div key={moduleKey} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{moduleKey}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {keys.map((key) => <span key={key} className={styles.miniTag}>{key}</span>)}
                    </div>
                  </div>
                ))
              )}
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>Overrides</h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {overrides.map((override, index) => (
                  <div key={`${override.permissionKey}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 8, alignItems: 'center' }}>
                    <select
                      className={styles.formSelect}
                      value={override.permissionKey}
                      disabled={!canManage || isSaving}
                      onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, permissionKey: event.target.value } : item
                      )))}
                    >
                      <option value="">Selecciona permiso</option>
                      {permissionsCatalog.map((permission) => (
                        <option key={permission.key} value={permission.key}>{permission.key}</option>
                      ))}
                    </select>
                    <select
                      className={styles.formSelect}
                      value={override.effect}
                      disabled={!canManage || isSaving}
                      onChange={(event) => setOverrides((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, effect: event.target.value } : item
                      )))}
                    >
                      <option value="allow">allow</option>
                      <option value="deny">deny</option>
                    </select>
                    {canManage && (
                      <button
                        className={styles.coachBtn}
                        onClick={() => setOverrides((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        disabled={isSaving}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ))}
                {overrides.length === 0 && (
                  <div style={{ color: 'var(--text-muted)' }}>Sin overrides directos.</div>
                )}
                {canManage && (
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => setOverrides((current) => [...current, { permissionKey: '', effect: 'deny' }])}
                    disabled={isSaving}
                  >
                    + Agregar override
                  </button>
                )}
              </div>
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>Permisos efectivos finales</h4>
              {Object.keys(effectivePermissionsByModule).length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Sin permisos efectivos.</div>
              ) : (
                Object.entries(effectivePermissionsByModule).map(([moduleKey, keys]) => (
                  <div key={moduleKey} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{moduleKey}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {keys.map((key) => <span key={key} className={styles.miniTag}>{key}</span>)}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} disabled={isSaving}>
            Cerrar
          </button>
          {canManage && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onSave?.(overrides)}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar overrides'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
