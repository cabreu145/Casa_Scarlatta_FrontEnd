import { useMemo } from 'react'
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

const fieldWrap = {
  display: 'grid',
  gap: 6,
}

const fieldLabel = {
  fontSize: 12,
  color: 'var(--muted)',
  fontWeight: 600,
  letterSpacing: '0.02em',
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

function updateArrayItem(list = [], index, nextValue) {
  return list.map((item, itemIndex) => (itemIndex === index ? nextValue : item))
}

function ArrayEditor({
  title,
  items = [],
  onAdd,
  onRemove,
  renderItem,
  canEdit = true,
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, fontSize: 14 }}>{title}</h4>
        {canEdit && (
          <button
            type="button"
            className={styles.btn}
            style={{ padding: '6px 12px' }}
            onClick={onAdd}
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item, index) => (
          <div key={item?.id ?? index} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--muted-2)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {renderItem(item, index)}
              {canEdit && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className={styles.btn}
                    style={{ padding: '6px 12px', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, canEdit = true, rows = 1 }) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      {rows > 1 ? (
        <textarea
          rows={rows}
          className={styles.formInput}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={!canEdit}
          style={{ resize: 'vertical' }}
        />
      ) : (
        <input
          className={styles.formInput}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={!canEdit}
        />
      )}
    </label>
  )
}

function HeroEditor({ value, onChange, onUploadFile, canEdit = true, pageKey }) {
  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Hero</h3>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Pieza principal de página pública</span>
      </div>

      <div style={grid2}>
        <TextField label="Overline" value={value?.overline} onChange={(next) => onChange(setAtPath(value, ['overline'], next))} canEdit={canEdit} />
        <TextField label="Tagline" value={value?.tagline} onChange={(next) => onChange(setAtPath(value, ['tagline'], next))} canEdit={canEdit} />
      </div>

      <div style={grid2}>
        <TextField label="Título" value={value?.title} onChange={(next) => onChange(setAtPath(value, ['title'], next))} canEdit={canEdit} />
        <TextField label="Slogan" value={value?.slogan} onChange={(next) => onChange(setAtPath(value, ['slogan'], next))} canEdit={canEdit} />
      </div>

      <TextField label="Subtítulo" value={value?.subtitle} onChange={(next) => onChange(setAtPath(value, ['subtitle'], next))} rows={3} canEdit={canEdit} />
      <TextField label="Subtexto" value={value?.subtext} onChange={(next) => onChange(setAtPath(value, ['subtext'], next))} rows={2} canEdit={canEdit} />

      <div style={grid2}>
        <MediaPicker
          label="Imagen hero"
          value={value?.image}
          onChange={(next) => onChange(setAtPath(value, ['image'], next))}
          onUploadFile={onUploadFile}
          allowedTypes={['image', 'video']}
          field={`pages.${pageKey}.hero.image`}
          publicIdPrefix={`${pageKey}-hero`}
          canEdit={canEdit}
          hint="Imagen o video del hero."
        />
        <MediaPicker
          label="Logo hero"
          value={value?.logo}
          onChange={(next) => onChange(setAtPath(value, ['logo'], next))}
          onUploadFile={onUploadFile}
          allowedTypes={['image']}
          field={`pages.${pageKey}.hero.logo`}
          publicIdPrefix={`${pageKey}-logo`}
          canEdit={canEdit}
          hint="Logo / palabra marca."
        />
      </div>

      <ArrayEditor
        title="CTAs"
        items={Array.isArray(value?.ctas) ? value.ctas : []}
        onAdd={() => onChange(setAtPath(value, ['ctas'], [...(value?.ctas ?? []), { label: 'Nuevo CTA', to: '/clases', variant: 'primary' }]))}
        onRemove={(index) => onChange(setAtPath(value, ['ctas'], updateArrayItem(value?.ctas ?? [], index, null).filter(Boolean)))}
        canEdit={canEdit}
        renderItem={(item, index) => (
          <div style={grid2}>
            <TextField label={`CTA ${index + 1} - Label`} value={item?.label} onChange={(next) => onChange(setAtPath(value, ['ctas'], updateArrayItem(value?.ctas ?? [], index, { ...item, label: next })))} canEdit={canEdit} />
            <TextField label={`CTA ${index + 1} - URL`} value={item?.to} onChange={(next) => onChange(setAtPath(value, ['ctas'], updateArrayItem(value?.ctas ?? [], index, { ...item, to: next })))} canEdit={canEdit} />
          </div>
        )}
      />
    </div>
  )
}

function StatsEditor({ value = [], onChange, canEdit = true }) {
  return (
    <div style={panel}>
      <ArrayEditor
        title="Stats"
        items={value}
        onAdd={() => onChange([...(value ?? []), { value: '', label: '' }])}
        onRemove={(index) => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
        canEdit={canEdit}
        renderItem={(item, index) => (
          <div style={grid2}>
            <TextField
              label={`Stat ${index + 1} - Valor`}
              value={item?.value}
              onChange={(next) => onChange(updateArrayItem(value, index, { ...item, value: next }))}
              canEdit={canEdit}
            />
            <TextField
              label={`Stat ${index + 1} - Etiqueta`}
              value={item?.label}
              onChange={(next) => onChange(updateArrayItem(value, index, { ...item, label: next }))}
              canEdit={canEdit}
            />
          </div>
        )}
      />
    </div>
  )
}

function SectionEditor({ value, onChange, onUploadFile, canEdit = true, pageKey, sectionIndex }) {
  return (
    <div style={panel}>
      <div style={grid2}>
        <TextField label="ID" value={value?.id} onChange={(next) => onChange(setAtPath(value, ['id'], next))} canEdit={canEdit} />
        <TextField label="Título" value={value?.title} onChange={(next) => onChange(setAtPath(value, ['title'], next))} canEdit={canEdit} />
      </div>

      <div style={grid2}>
        <TextField label="Heading" value={value?.heading} onChange={(next) => onChange(setAtPath(value, ['heading'], next))} rows={2} canEdit={canEdit} />
        <TextField label="Subtitle" value={value?.subtitle} onChange={(next) => onChange(setAtPath(value, ['subtitle'], next))} rows={2} canEdit={canEdit} />
      </div>

      <TextField label="Body" value={value?.body} onChange={(next) => onChange(setAtPath(value, ['body'], next))} rows={4} canEdit={canEdit} />
      <TextField label="Conclusion" value={value?.conclusion} onChange={(next) => onChange(setAtPath(value, ['conclusion'], next))} canEdit={canEdit} />

      <div style={grid2}>
        <MediaPicker
          label="Media"
          value={value?.media}
          onChange={(next) => onChange(setAtPath(value, ['media'], next))}
          onUploadFile={onUploadFile}
          allowedTypes={['image', 'video']}
          field={`pages.${pageKey}.sections.${sectionIndex}.media`}
          publicIdPrefix={`${pageKey}-section-${sectionIndex}`}
          canEdit={canEdit}
        />
        <div style={{ display: 'grid', gap: 12 }}>
          <TextField label="Visible" value={value?.isActive === false ? 'false' : 'true'} onChange={(next) => onChange(setAtPath(value, ['isActive'], String(next).toLowerCase() !== 'false'))} canEdit={canEdit} />
          <TextField label="Sort order" value={String(value?.sortOrder ?? '')} onChange={(next) => onChange(setAtPath(value, ['sortOrder'], Number(next) || 0))} canEdit={canEdit} />
        </div>
      </div>

      <ArrayEditor
        title="Items"
        items={Array.isArray(value?.items) ? value.items : []}
        onAdd={() => onChange(setAtPath(value, ['items'], [...(value?.items ?? []), { title: '', description: '' }]))}
        onRemove={(index) => onChange(setAtPath(value, ['items'], (value?.items ?? []).filter((_, itemIndex) => itemIndex !== index)))}
        canEdit={canEdit}
        renderItem={(item, index) => (
          <div style={grid2}>
            <TextField
              label={`Item ${index + 1} - Título`}
              value={item?.title}
              onChange={(next) => onChange(setAtPath(value, ['items'], updateArrayItem(value?.items ?? [], index, { ...item, title: next })))}
              canEdit={canEdit}
            />
            <TextField
              label={`Item ${index + 1} - Descripción`}
              value={item?.description}
              onChange={(next) => onChange(setAtPath(value, ['items'], updateArrayItem(value?.items ?? [], index, { ...item, description: next })))}
              canEdit={canEdit}
              rows={2}
            />
          </div>
        )}
      />

      <ArrayEditor
        title="Steps"
        items={Array.isArray(value?.steps) ? value.steps : []}
        onAdd={() => onChange(setAtPath(value, ['steps'], [...(value?.steps ?? []), { title: '', description: '' }]))}
        onRemove={(index) => onChange(setAtPath(value, ['steps'], (value?.steps ?? []).filter((_, itemIndex) => itemIndex !== index)))}
        canEdit={canEdit}
        renderItem={(item, index) => (
          <div style={grid2}>
            <TextField
              label={`Step ${index + 1} - Título`}
              value={item?.title}
              onChange={(next) => onChange(setAtPath(value, ['steps'], updateArrayItem(value?.steps ?? [], index, { ...item, title: next })))}
              canEdit={canEdit}
            />
            <TextField
              label={`Step ${index + 1} - Descripción`}
              value={item?.description}
              onChange={(next) => onChange(setAtPath(value, ['steps'], updateArrayItem(value?.steps ?? [], index, { ...item, description: next })))}
              canEdit={canEdit}
              rows={2}
            />
          </div>
        )}
      />
    </div>
  )
}

export default function PageContentEditor({
  pageKey,
  title,
  value,
  onChange,
  onUploadFile,
  canEdit = true,
}) {
  const hero = value?.hero ?? {}
  const stats = Array.isArray(value?.stats) ? value.stats : []
  const sections = Array.isArray(value?.sections) ? value.sections : []

  const setPage = (next) => onChange?.(next)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Hero, stats y secciones editables.
          </p>
        </div>
      </div>

      <HeroEditor
        value={hero}
        onChange={(next) => setPage({ ...(value ?? {}), hero: next })}
        onUploadFile={onUploadFile}
        canEdit={canEdit}
        pageKey={pageKey}
      />

      <StatsEditor
        value={stats}
        onChange={(next) => setPage({ ...(value ?? {}), stats: next })}
        canEdit={canEdit}
      />

      <div style={panel}>
        <ArrayEditor
          title="Secciones"
          items={sections}
          onAdd={() => setPage({
            ...(value ?? {}),
            sections: [
              ...sections,
              {
                id: `section-${sections.length + 1}`,
                title: '',
                heading: '',
                subtitle: '',
                body: '',
                conclusion: '',
                media: null,
                items: [],
                steps: [],
                isActive: true,
                sortOrder: sections.length,
              },
            ],
          })}
          onRemove={(index) => setPage({ ...(value ?? {}), sections: sections.filter((_, itemIndex) => itemIndex !== index) })}
          canEdit={canEdit}
          renderItem={(section, index) => (
            <details open style={{ display: 'grid' }}>
              <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                {section?.title || section?.id || `Sección ${index + 1}`}
              </summary>
              <SectionEditor
                value={section}
                onChange={(next) => setPage({ ...(value ?? {}), sections: updateArrayItem(sections, index, next) })}
                onUploadFile={onUploadFile}
                canEdit={canEdit}
                pageKey={pageKey}
                sectionIndex={index}
              />
            </details>
          )}
        />
      </div>
    </div>
  )
}
