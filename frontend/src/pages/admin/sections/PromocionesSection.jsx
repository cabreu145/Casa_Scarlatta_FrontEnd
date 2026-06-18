import { useState } from 'react'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'
import {
  createPackagePromotionApi,
  deletePackagePromotionApi,
  getPackagePromotionRedemptionsApi,
  getPackagePromotionsApi,
  releaseExpiredPromotionRedemptionsApi,
  updatePackagePromotionApi,
  updatePackagePromotionStatusApi,
} from '@/services/packagePromotionsApiService'
import { useEffect } from 'react'

const EMPTY_FORM = {
  name: '',
  description: '',
  promotion_type: 'percentage_discount',
  package_id: '',
  bonus_package_id: '',
  discount_percent: '',
  minimum_final_price_mxn: '1',
  usage_limit: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
  applies_online: true,
  applies_admin: true,
  applies_pos: true,
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

function toLocalDatetimeInput(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ChannelTag({ label, active }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        background: active ? 'rgba(194,107,122,0.25)' : 'rgba(255,255,255,0.06)',
        color: active ? '#E8A4AD' : 'rgba(255,255,255,0.3)',
        marginRight: 4,
      }}
    >
      {label}
    </span>
  )
}

export default function PromocionesSection({ paquetes = [], useApiMode = false, isActive = false }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('all')

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [redemptionsModal, setRedemptionsModal] = useState(null)
  const [redemptions, setRedemptions] = useState([])
  const [redemptionsLoading, setRedemptionsLoading] = useState(false)

  const pageSize = 20

  useEffect(() => {
    if (!useApiMode || !isActive) return
    load()
  }, [useApiMode, isActive, page, search, filterActive])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      const isActiveFilter = filterActive === 'active' ? true : filterActive === 'inactive' ? false : undefined
      const res = await getPackagePromotionsApi({ page, pageSize, search: search || undefined, isActive: isActiveFilter })
      setItems(res.items ?? [])
      setTotal(res.total ?? 0)
    } catch (err) {
      setError(err?.message ?? 'Error cargando promociones')
    } finally {
      setIsLoading(false)
    }
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setModal('create')
  }

  function openEdit(promo) {
    setForm({
      name: promo.name ?? '',
      description: promo.description ?? '',
      promotion_type: promo.promotionType ?? 'percentage_discount',
      package_id: String(promo.packageId ?? ''),
      bonus_package_id: String(promo.bonusPackageId ?? ''),
      discount_percent: promo.discountPercent != null ? String(promo.discountPercent) : '',
      minimum_final_price_mxn: promo.minimumFinalPriceMxn != null ? String(promo.minimumFinalPriceMxn) : '1',
      usage_limit: promo.usageLimit != null ? String(promo.usageLimit) : '',
      starts_at: toLocalDatetimeInput(promo.startsAt),
      ends_at: toLocalDatetimeInput(promo.endsAt),
      is_active: promo.isActive ?? true,
      applies_online: promo.appliesOnline ?? false,
      applies_admin: promo.appliesAdmin ?? false,
      applies_pos: promo.appliesPos ?? false,
      _id: promo.id,
    })
    setFormError('')
    setModal('edit')
  }

  async function openRedemptions(promo) {
    setRedemptionsModal(promo)
    setRedemptions([])
    setRedemptionsLoading(true)
    try {
      const res = await getPackagePromotionRedemptionsApi(promo.id)
      setRedemptions(res.items ?? [])
    } catch (err) {
      toast.error('No se pudieron cargar las redenciones')
    } finally {
      setRedemptionsLoading(false)
    }
  }

  function validateForm(f) {
    if (!f.name.trim()) return 'El nombre es obligatorio.'
    if (!f.package_id) return 'Selecciona un paquete.'
    if (!f.promotion_type) return 'Selecciona el tipo de promoción.'
    if (f.promotion_type === 'percentage_discount') {
      const pct = Number(f.discount_percent)
      if (!Number.isFinite(pct) || pct < 1 || pct > 99) return 'El descuento debe ser entre 1 y 99.'
    }
    if (f.promotion_type === 'buy_one_get_one' && !f.bonus_package_id) {
      return 'Selecciona el paquete bonus.'
    }
    if (!f.applies_online && !f.applies_admin && !f.applies_pos) {
      return 'La promoción debe aplicar en al menos un canal.'
    }
    if (!f.starts_at || !f.ends_at) return 'Las fechas de inicio y fin son obligatorias.'
    return null
  }

  async function handleSave() {
    const err = validateForm(form)
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError('')
    try {
      if (modal === 'create') {
        await createPackagePromotionApi(form)
        toast.success('Promoción creada')
      } else {
        await updatePackagePromotionApi(form._id, form)
        toast.success('Promoción actualizada')
      }
      setModal(null)
      load()
    } catch (err) {
      setFormError(err?.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(promo) {
    try {
      await updatePackagePromotionStatusApi(promo.id, !promo.isActive)
      toast.success(promo.isActive ? 'Promoción desactivada' : 'Promoción activada')
      load()
    } catch (err) {
      toast.error(err?.message ?? 'Error al cambiar estado')
    }
  }

  async function handleDelete(promo) {
    const confirmed = window.confirm(`¿Eliminar la promoción "${promo.name}"?\n\nEsta acción no se puede deshacer.`)
    if (!confirmed) return
    try {
      await deletePackagePromotionApi(promo.id)
      toast.success('Promoción eliminada')
      await load()
    } catch (err) {
      console.error('[PromocionesSection] delete error:', err)
      const msg = err?.message ?? err?.payload?.detail ?? 'No se pudo eliminar la promoción'
      toast.error(msg, { duration: 5000 })
    }
  }

  async function handleReleaseExpired() {
    try {
      await releaseExpiredPromotionRedemptionsApi()
      toast.success('Redenciones expiradas liberadas')
    } catch (err) {
      toast.error(err?.message ?? 'Error al liberar redenciones')
    }
  }

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isPercent = form.promotion_type === 'percentage_discount'
  const isBogo = form.promotion_type === 'buy_one_get_one'

  const packageName = (id) => {
    const pkg = paquetes.find((p) => String(p.id) === String(id))
    return pkg?.displayName ?? pkg?.name ?? `Paquete #${id}`
  }

  if (!useApiMode) {
    return <div style={{ padding: 24, color: 'var(--text-muted, #A69A93)', fontSize: 14 }}>Activa el modo API para gestionar promociones.</div>
  }

  return (
    <div>
      <div className={styles.sectionTopRow}>
        <div className={styles.usersFilters} style={{ gap: 10 }}>
          <input
            className={styles.searchInput}
            placeholder="Buscar promoción..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <select
            className={styles.formSelect}
            value={filterActive}
            onChange={(e) => { setFilterActive(e.target.value); setPage(1) }}
            style={{ minWidth: 140 }}
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: 12 }} onClick={handleReleaseExpired}>
            Liberar expiradas
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
            + Nueva Promoción
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '8px 0', color: '#f87171' }}>{error}</div>}
      {isLoading && <div style={{ padding: '8px 0', color: 'var(--text-muted, #A69A93)', fontSize: 14 }}>Cargando promociones...</div>}

      {!isLoading && items.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted, #A69A93)', fontSize: 14 }}>
          No hay promociones. Crea la primera con el botón de arriba.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {items.map((promo) => (
          <div
            key={promo.id}
            style={{
              background: 'var(--neutral-card, #2C1A1E)',
              border: '1px solid var(--neutral-border, #3C2A2E)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary, #E8E2DB)' }}>{promo.name}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  background: promo.promotionType === 'buy_one_get_one' ? 'rgba(78,104,85,0.35)' : 'rgba(200,162,75,0.30)',
                  color: promo.promotionType === 'buy_one_get_one' ? '#8EC89A' : '#F0CC7A',
                }}>
                  {promo.promotionType === 'buy_one_get_one' ? '2×1' : `${promo.discountPercent ?? '?'}% OFF`}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  background: promo.isActive ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                  color: promo.isActive ? '#4ade80' : '#f87171',
                }}>
                  {promo.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted, #A69A93)', marginBottom: 6 }}>
                Paquete: <strong>{packageName(promo.packageId)}</strong>
                {promo.bonusPackageId && <> · Bonus: <strong>{packageName(promo.bonusPackageId)}</strong></>}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted, #A69A93)', marginBottom: 6 }}>
                {formatDate(promo.startsAt)} → {formatDate(promo.endsAt)}
                {promo.usageLimit != null && (
                  <> · <strong>{promo.usedCount ?? 0}/{promo.usageLimit}</strong> usos
                  {promo.reservedCount > 0 ? ` (${promo.reservedCount} reservados)` : ''}</>
                )}
              </div>

              <div>
                <ChannelTag label="Online" active={promo.appliesOnline} />
                <ChannelTag label="Admin" active={promo.appliesAdmin} />
                <ChannelTag label="POS" active={promo.appliesPos} />
              </div>

              {promo.description && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted, #A69A93)', fontStyle: 'italic' }}>
                  {promo.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => openEdit(promo)}
              >
                Editar
              </button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => handleToggleStatus(promo)}
              >
                {promo.isActive ? 'Desactivar' : 'Activar'}
              </button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => openRedemptions(promo)}
              >
                Redenciones
              </button>
              <button
                className={`${styles.btn}`}
                style={{ fontSize: 11, padding: '5px 10px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', borderRadius: 8 }}
                onClick={() => handleDelete(promo)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <span style={{ padding: '6px 12px', fontSize: 13 }}>
            {page} / {totalPages}
          </span>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal crear/editar ── */}
      {modal && (
        <div className={`${styles.modalOverlay} ${styles.open}`} onClick={() => !saving && setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: '100%' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modal === 'create' ? 'Nueva Promoción' : 'Editar Promoción'}
              </h3>
              <button className={styles.modalClose} onClick={() => !saving && setModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
              <FormRow label="Nombre *">
                <input
                  className={styles.formInput}
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="Ej. Promo junio 20%"
                />
              </FormRow>

              <FormRow label="Descripción">
                <input
                  className={styles.formInput}
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Opcional"
                />
              </FormRow>

              <FormRow label="Tipo *">
                <select
                  className={styles.formSelect}
                  value={form.promotion_type}
                  onChange={(e) => updateForm('promotion_type', e.target.value)}
                  disabled={modal === 'edit'}
                >
                  <option value="percentage_discount">Descuento porcentual</option>
                  <option value="buy_one_get_one">2×1 (Buy one get one)</option>
                </select>
              </FormRow>

              <FormRow label="Paquete *">
                <select
                  className={styles.formSelect}
                  value={form.package_id}
                  onChange={(e) => updateForm('package_id', e.target.value)}
                >
                  <option value="">Seleccionar paquete</option>
                  {paquetes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName ?? p.name ?? `#${p.id}`}
                    </option>
                  ))}
                </select>
              </FormRow>

              {isBogo && (
                <FormRow label="Paquete bonus *">
                  <select
                    className={styles.formSelect}
                    value={form.bonus_package_id}
                    onChange={(e) => updateForm('bonus_package_id', e.target.value)}
                  >
                    <option value="">Seleccionar paquete bonus</option>
                    {paquetes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName ?? p.name ?? `#${p.id}`}
                      </option>
                    ))}
                  </select>
                </FormRow>
              )}

              {isPercent && (
                <>
                  <FormRow label="Descuento % (1–99) *">
                    <input
                      className={styles.formInput}
                      type="number"
                      min={1}
                      max={99}
                      value={form.discount_percent}
                      onChange={(e) => updateForm('discount_percent', e.target.value)}
                      placeholder="Ej. 20"
                    />
                  </FormRow>
                  <FormRow label="Precio mínimo final (MXN)">
                    <input
                      className={styles.formInput}
                      type="number"
                      min={1}
                      value={form.minimum_final_price_mxn}
                      onChange={(e) => updateForm('minimum_final_price_mxn', e.target.value)}
                      placeholder="1"
                    />
                  </FormRow>
                </>
              )}

              <FormRow label="Límite de usos">
                <input
                  className={styles.formInput}
                  type="number"
                  min={1}
                  value={form.usage_limit}
                  onChange={(e) => updateForm('usage_limit', e.target.value)}
                  placeholder="Sin límite"
                />
              </FormRow>

              <FormRow label="Inicio *">
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => updateForm('starts_at', e.target.value)}
                />
              </FormRow>

              <FormRow label="Fin *">
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => updateForm('ends_at', e.target.value)}
                />
              </FormRow>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted, #A69A93)' }}>Canales</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { key: 'applies_online', label: 'Online' },
                    { key: 'applies_admin', label: 'Admin' },
                    { key: 'applies_pos', label: 'POS' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        onChange={(e) => updateForm(key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(form.is_active)}
                  onChange={(e) => updateForm('is_active', e.target.checked)}
                />
                Activa al crear
              </label>
            </div>

            {formError && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModal(null)} disabled={saving}>
                Cancelar
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : modal === 'create' ? 'Crear Promoción' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal redenciones ── */}
      {redemptionsModal && (
        <div className={`${styles.modalOverlay} ${styles.open}`} onClick={() => setRedemptionsModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, width: '100%' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Redenciones: {redemptionsModal.name}</h3>
              <button className={styles.modalClose} onClick={() => setRedemptionsModal(null)}>✕</button>
            </div>

            {redemptionsLoading && <div style={{ padding: 16, color: 'var(--text-muted, #A69A93)', fontSize: 14 }}>Cargando...</div>}
            {!redemptionsLoading && redemptions.length === 0 && (
              <div style={{ padding: 16, color: 'var(--text-muted, #A69A93)', fontSize: 14 }}>Sin redenciones.</div>
            )}

            {redemptions.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
                    {['ID', 'Canal', 'Estado', 'Tipo', 'Original', 'Descuento', 'Final', 'Aplicado'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted, #A69A93)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border, rgba(0,0,0,0.05))' }}>
                      <td style={{ padding: '6px 8px' }}>{r.id}</td>
                      <td style={{ padding: '6px 8px' }}>{r.channel ?? '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.status ?? '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.promotionTypeSnapshot ?? '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.originalPriceMxn != null ? `$${Number(r.originalPriceMxn).toLocaleString('es-MX')}` : '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.discountMxn != null ? `-$${Number(r.discountMxn).toLocaleString('es-MX')}` : '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.finalPriceMxn != null ? `$${Number(r.finalPriceMxn).toLocaleString('es-MX')}` : '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{formatDate(r.appliedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FormRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #A69A93)' }}>{label}</label>
      {children}
    </div>
  )
}
