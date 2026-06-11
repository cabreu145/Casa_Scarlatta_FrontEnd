import { useEffect, useMemo, useState } from 'react'
import styles from '../../AdminPanel.module.css'
import PermissionMatrix from './PermissionMatrix'

const BASE_ROLE_OPTIONS = ['admin', 'coach', 'cliente', 'cajero_pos']

function buildInitialForm(role = null) {
  return {
    code: role?.code ?? '',
    name: role?.name ?? '',
    description: role?.description ?? '',
    baseRole: role?.baseRole ?? 'cliente',
    isActive: role?.isActive ?? true,
    permissionKeys: role?.permissionKeys ?? [],
    isSystem: role?.isSystem ?? false,
  }
}

export default function RoleEditorModal({
  open = false,
  mode = 'create',
  role = null,
  permissions = [],
  isSaving = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(buildInitialForm(role))
  const isEdit = mode === 'edit'
  const canEditCode = !isEdit && !form.isSystem

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm(role))
  }, [open, role])

  const selectedCount = useMemo(() => form.permissionKeys.length, [form.permissionKeys])

  if (!open) return null

  return (
    <div className={`${styles.modalOverlay} ${styles.open}`} onClick={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <div className={styles.modal} style={{ maxWidth: 900, width: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>{isEdit ? 'Editar rol' : 'Nuevo rol'}</div>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre</label>
            <input
              className={styles.formInput}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Recepción"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Código</label>
            <input
              className={styles.formInput}
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              placeholder="recepcion"
              disabled={!canEditCode}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Base role</label>
            <select
              className={styles.formSelect}
              value={form.baseRole}
              onChange={(event) => setForm((current) => ({ ...current, baseRole: event.target.value }))}
            >
              {BASE_ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Estado</label>
            <select
              className={styles.formSelect}
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'active' }))}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea
              className={styles.formInput}
              rows={2}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Rol operativo para recepción y reservas"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                Permisos del rol
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                {selectedCount} permisos asignados
              </div>
            </div>
          </div>
          <PermissionMatrix
            permissions={permissions}
            selectedKeys={form.permissionKeys}
            onChange={(permissionKeys) => setForm((current) => ({ ...current, permissionKeys }))}
            disabled={isSaving}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onSave?.(form)}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear rol'}
          </button>
        </div>
      </div>
    </div>
  )
}
