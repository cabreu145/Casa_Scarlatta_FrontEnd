import { Plus, Trash2 } from 'lucide-react'
import MediaPicker from './MediaPicker'
import styles from '@/pages/admin/AdminPanel.module.css'

const panel = {
  padding: 20,
  borderRadius: 14,
  border: '1px solid var(--muted-2)',
  background: 'rgba(255,255,255,0.02)',
  display: 'grid',
  gap: 18,
}

const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14,
}

const label = {
  fontSize: 12,
  color: 'var(--muted)',
  fontWeight: 600,
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value ?? {}))
}

function setAtPath(base, path, nextValue) {
  const root = clone(base)
  let cursor = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (!cursor[key] || typeof cursor[key] !== 'object') {
      cursor[key] = typeof path[i + 1] === 'number' ? [] : {}
    }
    cursor = cursor[key]
  }
  cursor[path[path.length - 1]] = nextValue
  return root
}

function LinkList({ title, items = [], onChange, canEdit = true }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>{title}</h4>
        {canEdit && (
          <button
            type="button"
            className={styles.btn}
            style={{ padding: '6px 12px' }}
            onClick={() => onChange([...(items ?? []), { label: '', to: '' }])}
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>
      {items.map((item, index) => (
        <div key={item?.label ?? index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
          <input
            className={styles.formInput}
            value={item?.label ?? ''}
            onChange={(event) => onChange(items.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row))}
            placeholder="Label"
            disabled={!canEdit}
          />
          <input
            className={styles.formInput}
            value={item?.to ?? ''}
            onChange={(event) => onChange(items.map((row, rowIndex) => rowIndex === index ? { ...row, to: event.target.value } : row))}
            placeholder="/ruta o https://..."
            disabled={!canEdit}
          />
          {canEdit && (
            <button
              type="button"
              className={styles.btn}
              style={{ padding: '6px 12px', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
              onClick={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function ScheduleRows({ items = [], onChange, canEdit = true }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>Horarios</h4>
        {canEdit && (
          <button
            type="button"
            className={styles.btn}
            style={{ padding: '6px 12px' }}
            onClick={() => onChange([...(items ?? []), { label: '', value: '' }])}
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>
      {items.map((item, index) => (
        <div key={item?.label ?? index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8 }}>
          <input
            className={styles.formInput}
            value={item?.label ?? ''}
            onChange={(event) => onChange(items.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row))}
            placeholder="Etiqueta"
            disabled={!canEdit}
          />
          <input
            className={styles.formInput}
            value={item?.value ?? ''}
            onChange={(event) => onChange(items.map((row, rowIndex) => rowIndex === index ? { ...row, value: event.target.value } : row))}
            placeholder="Valor"
            disabled={!canEdit}
          />
          {canEdit && (
            <button
              type="button"
              className={styles.btn}
              style={{ padding: '6px 12px', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
              onClick={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function TextAreaField({ label: textLabel, value, onChange, rows = 1, canEdit = true }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={label}>{textLabel}</span>
      <textarea
        rows={rows}
        className={styles.formInput}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={!canEdit}
        style={{ resize: 'vertical' }}
      />
    </label>
  )
}

export default function FooterEditor({ value, onChange, onUploadFile, canEdit = true }) {
  const brand = value?.brand ?? {}
  const links = value?.links ?? {}
  const social = value?.social ?? {}
  const contact = value?.contact ?? {}
  const scheduleRows = Array.isArray(value?.scheduleRows) ? value.scheduleRows : []

  const setFooter = (next) => onChange?.(next)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Footer</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Marca, links, redes, contacto y horarios.
          </p>
        </div>
      </div>

      <div style={panel}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Marca</h3>
        <div style={grid2}>
          <MediaPicker
            label="Logo footer"
            value={brand.logo}
            onChange={(next) => setFooter({ ...(value ?? {}), brand: { ...brand, logo: next } })}
            onUploadFile={onUploadFile}
            allowedTypes={['image']}
            field="footer.brand.logo"
            publicIdPrefix="footer-brand"
            canEdit={canEdit}
          />
          <TextAreaField
            label="Tagline"
            value={brand.tagline}
            onChange={(next) => setFooter({ ...(value ?? {}), brand: { ...brand, ...{ tagline: next } } })}
            rows={3}
            canEdit={canEdit}
          />
        </div>
      </div>

      <div style={panel}>
        <LinkList
          title="Links estudio"
          items={Array.isArray(links.studio) ? links.studio : []}
          onChange={(next) => setFooter({ ...(value ?? {}), links: { ...links, studio: next } })}
          canEdit={canEdit}
        />
        <LinkList
          title="Links visita"
          items={Array.isArray(links.visit) ? links.visit : []}
          onChange={(next) => setFooter({ ...(value ?? {}), links: { ...links, visit: next } })}
          canEdit={canEdit}
        />
      </div>

      <div style={panel}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Contacto</h3>
        <div style={grid2}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={label}>Teléfono</span>
            <input
              className={styles.formInput}
              value={contact.phone ?? ''}
              onChange={(event) => setFooter({ ...(value ?? {}), contact: { ...contact, phone: event.target.value } })}
              disabled={!canEdit}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={label}>Email</span>
            <input
              className={styles.formInput}
              value={contact.email ?? ''}
              onChange={(event) => setFooter({ ...(value ?? {}), contact: { ...contact, email: event.target.value } })}
              disabled={!canEdit}
            />
          </label>
        </div>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={label}>Dirección</span>
          <textarea
            rows={2}
            className={styles.formInput}
            value={contact.address ?? ''}
            onChange={(event) => setFooter({ ...(value ?? {}), contact: { ...contact, address: event.target.value } })}
            disabled={!canEdit}
            style={{ resize: 'vertical' }}
          />
        </label>
      </div>

      <div style={panel}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Redes</h3>
        <div style={grid2}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={label}>Instagram</span>
            <input
              className={styles.formInput}
              value={social.instagramUrl ?? ''}
              onChange={(event) => setFooter({ ...(value ?? {}), social: { ...social, instagramUrl: event.target.value } })}
              disabled={!canEdit}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={label}>Facebook</span>
            <input
              className={styles.formInput}
              value={social.facebookUrl ?? ''}
              onChange={(event) => setFooter({ ...(value ?? {}), social: { ...social, facebookUrl: event.target.value } })}
              disabled={!canEdit}
            />
          </label>
        </div>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={label}>YouTube</span>
          <input
            className={styles.formInput}
            value={social.youtubeUrl ?? ''}
            onChange={(event) => setFooter({ ...(value ?? {}), social: { ...social, youtubeUrl: event.target.value } })}
            disabled={!canEdit}
          />
        </label>
      </div>

      <div style={panel}>
        <ScheduleRows
          items={scheduleRows}
          onChange={(next) => setFooter({ ...(value ?? {}), scheduleRows: next })}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
