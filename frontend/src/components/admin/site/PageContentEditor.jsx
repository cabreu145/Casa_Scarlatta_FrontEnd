import { Plus, Trash2, ChevronDown } from 'lucide-react'
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

const fieldHint = {
  fontSize: 11,
  color: 'var(--muted)',
  opacity: 0.75,
}

// Mapea cada "id" de sección con un nombre amigable, una pista de qué parte
// de la página pública controla, y la lista exacta de campos que usa esa
// sección — así no se muestran campos vacíos que no tienen efecto en la página.
const SECTION_INFO = {
  concept: {
    label: 'Concepto',
    hint: 'Bloque de texto principal + imagen, justo debajo de las estadísticas.',
    fields: ['title', 'heading', 'body', 'media'],
  },
  experience: {
    label: 'Experiencia',
    hint: 'Lista de 3 puntos destacados (música, ambiente, enfoque, etc.).',
    fields: ['title', 'items'],
  },
  philosophy: {
    label: 'Filosofía',
    hint: 'Lista de 3 puntos destacados sobre la filosofía de la clase.',
    fields: ['title', 'items'],
  },
  quote: {
    label: 'Frase destacada',
    hint: 'Cita grande sobre una imagen de fondo.',
    fields: ['quote', 'media'],
  },
  methodology: {
    label: 'Metodología',
    hint: 'Pasos del método + frase de cierre.',
    fields: ['title', 'subtitle', 'steps', 'conclusion'],
  },
  benefits: {
    label: 'Beneficios',
    hint: 'Lista de beneficios de la disciplina.',
    fields: ['title', 'items'],
  },
  ideal: {
    label: 'Ideal para ti si…',
    hint: 'Lista de perfiles a los que les conviene esta disciplina.',
    fields: ['title', 'items'],
  },
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

// Bloque colapsable reutilizable: agrupa una parte de la página con título,
// descripción de qué controla y un caret que indica si está abierto.
function CollapsibleSection({ title, hint, defaultOpen = false, children, badge }) {
  return (
    <details open={defaultOpen} style={{ ...panel, padding: 0, overflow: 'hidden' }}>
      <summary
        style={{
          cursor: 'pointer',
          listStyle: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
            {title}
            {badge}
          </span>
          {hint && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{hint}</span>}
        </div>
        <ChevronDown size={18} className={styles.detailsChevron} style={{ flexShrink: 0, color: 'var(--muted)' }} />
      </summary>
      <div style={{ display: 'grid', gap: 18, padding: 20 }}>{children}</div>
    </details>
  )
}

function ArrayEditor({
  title,
  hint,
  items = [],
  onAdd,
  addLabel = 'Agregar',
  onRemove,
  renderItem,
  itemLabel,
  canEdit = true,
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 2 }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>{title}</h4>
          {hint && <span style={fieldHint}>{hint}</span>}
        </div>
        {canEdit && onAdd && (
          <button
            type="button"
            className={styles.btn}
            style={{ padding: '6px 12px' }}
            onClick={onAdd}
          >
            <Plus size={14} />
            {addLabel}
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.length === 0 && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Sin elementos todavía.</p>
        )}
        {items.map((item, index) => (
          <div key={item?.id ?? index} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--muted-2)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {itemLabel && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                  {itemLabel} {index + 1}
                </span>
              )}
              {renderItem(item, index)}
              {canEdit && onRemove && (
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

function TextField({ label, hint, value, onChange, placeholder, canEdit = true, rows = 1 }) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      {hint && <span style={fieldHint}>{hint}</span>}
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

function ToggleField({ label, hint, checked, onChange, canEdit = true }) {
  return (
    <label style={{ ...fieldWrap, cursor: canEdit ? 'pointer' : 'default' }}>
      <span style={fieldLabel}>{label}</span>
      {hint && <span style={fieldHint}>{hint}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={!canEdit}
          style={{ width: 18, height: 18 }}
        />
        <span style={{ fontSize: 13 }}>{checked ? 'Visible en la página' : 'Oculta en la página'}</span>
      </div>
    </label>
  )
}

function HeroEditor({ value, onChange, onUploadFile, canEdit = true, pageKey }) {
  return (
    <CollapsibleSection
      title="Banner principal (Hero)"
      hint="La primera pantalla que ve el visitante: imagen de fondo, logo, frases y botón de reserva."
      defaultOpen
    >
      <div style={grid2}>
        <MediaPicker
          label="Imagen de fondo"
          value={value?.image}
          onChange={(next) => onChange(setAtPath(value, ['image'], next))}
          onUploadFile={onUploadFile}
          allowedTypes={['image', 'video']}
          field={`pages.${pageKey}.hero.image`}
          publicIdPrefix={`${pageKey}-hero`}
          canEdit={canEdit}
          hint="Foto o video que ocupa todo el banner."
        />
        <MediaPicker
          label="Logo / palabra grande"
          value={value?.logo}
          onChange={(next) => onChange(setAtPath(value, ['logo'], next))}
          onUploadFile={onUploadFile}
          allowedTypes={['image']}
          field={`pages.${pageKey}.hero.logo`}
          publicIdPrefix={`${pageKey}-logo`}
          canEdit={canEdit}
          hint='El nombre grande de la disciplina (ej. "STRYDE X").'
        />
      </div>

      <TextField
        label="Texto pequeño superior"
        hint='Frase en mayúsculas arriba del logo, ej. "Casa Scarlatta — Alta Intensidad".'
        value={value?.overline}
        onChange={(next) => onChange(setAtPath(value, ['overline'], next))}
        canEdit={canEdit}
      />

      <TextField
        label="Frase debajo del logo"
        hint='Lema corto bajo el logo, ej. "Stronger Every Stryde".'
        value={value?.tagline}
        onChange={(next) => onChange(setAtPath(value, ['tagline'], next))}
        canEdit={canEdit}
      />

      <TextField
        label="Texto descriptivo"
        hint="Párrafo de presentación que aparece debajo de la frase."
        value={value?.subtitle}
        onChange={(next) => onChange(setAtPath(value, ['subtitle'], next))}
        rows={3}
        canEdit={canEdit}
      />

      <ArrayEditor
        title="Botón principal"
        hint='Texto y destino del botón rojo (ej. "Reservar clase").'
        items={Array.isArray(value?.ctas) ? value.ctas : []}
        itemLabel="Botón"
        onAdd={() => onChange(setAtPath(value, ['ctas'], [...(value?.ctas ?? []), { label: 'Nuevo botón', to: '/clases', variant: 'primary' }]))}
        addLabel="Agregar botón"
        onRemove={(index) => onChange(setAtPath(value, ['ctas'], updateArrayItem(value?.ctas ?? [], index, null).filter(Boolean)))}
        canEdit={canEdit}
        renderItem={(item, index) => (
          <div style={grid2}>
            <TextField label="Texto del botón" value={item?.label} onChange={(next) => onChange(setAtPath(value, ['ctas'], updateArrayItem(value?.ctas ?? [], index, { ...item, label: next })))} canEdit={canEdit} />
            <TextField label="Enlace (a dónde lleva)" value={item?.to} onChange={(next) => onChange(setAtPath(value, ['ctas'], updateArrayItem(value?.ctas ?? [], index, { ...item, to: next })))} canEdit={canEdit} />
          </div>
        )}
      />
    </CollapsibleSection>
  )
}

function StatsEditor({ value = [], onChange, canEdit = true }) {
  return (
    <CollapsibleSection
      title="Datos rápidos (cupo y duración)"
      hint='Los números destacados arriba de la página, ej. "15 Cupo máximo" y "50 Minutos".'
    >
      <ArrayEditor
        title="Datos"
        items={value}
        itemLabel="Dato"
        onAdd={() => onChange([...(value ?? []), { value: '', label: '' }])}
        addLabel="Agregar dato"
        onRemove={(index) => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
        canEdit={canEdit}
        renderItem={(item, index) => (
          <div style={grid2}>
            <TextField
              label="Número"
              value={item?.value}
              onChange={(next) => onChange(updateArrayItem(value, index, { ...item, value: next }))}
              canEdit={canEdit}
            />
            <TextField
              label="Descripción"
              value={item?.label}
              onChange={(next) => onChange(updateArrayItem(value, index, { ...item, label: next }))}
              canEdit={canEdit}
            />
          </div>
        )}
      />
    </CollapsibleSection>
  )
}

function SectionEditor({ value, onChange, onUploadFile, canEdit = true, pageKey, sectionIndex, fields }) {
  // Si conocemos el id de la sección usamos la lista exacta de campos que
  // usa esa sección (definida en SECTION_INFO). Para secciones nuevas /
  // desconocidas, detectamos los campos según lo que ya tenga el dato.
  const allow = (key) => (fields ? fields.includes(key) : true)

  const showTitle = allow('title')
  const hasHeading = allow('heading') && (value?.heading !== undefined || value?.body !== undefined)
  const hasQuote = allow('quote') && value?.quote !== undefined
  const hasSteps = allow('steps') && Array.isArray(value?.steps)
  const hasItems = allow('items') && Array.isArray(value?.items)
  const hasMedia = allow('media') && value?.media !== undefined
  const hasSubtitle = allow('subtitle') && value?.subtitle !== undefined
  const hasConclusion = allow('conclusion') && value?.conclusion !== undefined

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {showTitle && (
        <TextField
          label="Título de la sección"
          hint="Nombre interno / encabezado visible de este bloque."
          value={value?.title}
          onChange={(next) => onChange(setAtPath(value, ['title'], next))}
          canEdit={canEdit}
        />
      )}

      {hasHeading && (
        <>
          <TextField
            label="Título grande"
            hint="Frase grande de impacto de esta sección."
            value={value?.heading}
            onChange={(next) => onChange(setAtPath(value, ['heading'], next))}
            rows={2}
            canEdit={canEdit}
          />
          <TextField
            label="Texto del párrafo"
            hint="Texto descriptivo debajo del título grande."
            value={value?.body}
            onChange={(next) => onChange(setAtPath(value, ['body'], next))}
            rows={4}
            canEdit={canEdit}
          />
        </>
      )}

      {hasQuote && (
        <TextField
          label="Frase destacada (cita)"
          hint="Texto grande que aparece sobre la imagen de fondo."
          value={value?.quote}
          onChange={(next) => onChange(setAtPath(value, ['quote'], next))}
          rows={2}
          canEdit={canEdit}
        />
      )}

      {hasSubtitle && (
        <TextField
          label="Subtítulo"
          hint="Texto corto debajo del título de la sección."
          value={value?.subtitle}
          onChange={(next) => onChange(setAtPath(value, ['subtitle'], next))}
          rows={2}
          canEdit={canEdit}
        />
      )}

      {hasMedia && (
        <MediaPicker
          label="Imagen / video de la sección"
          value={value?.media}
          onChange={(next) => onChange(setAtPath(value, ['media'], next))}
          onUploadFile={onUploadFile}
          allowedTypes={['image', 'video']}
          field={`pages.${pageKey}.sections.${sectionIndex}.media`}
          publicIdPrefix={`${pageKey}-section-${sectionIndex}`}
          canEdit={canEdit}
        />
      )}

      {hasItems && (
        <ArrayEditor
          title="Puntos / tarjetas"
          hint="Cada elemento es una tarjeta con título y (opcional) descripción."
          items={value.items}
          itemLabel="Punto"
          onAdd={() => onChange(setAtPath(value, ['items'], [...(value?.items ?? []), { title: '', description: '' }]))}
          addLabel="Agregar punto"
          onRemove={(index) => onChange(setAtPath(value, ['items'], (value?.items ?? []).filter((_, itemIndex) => itemIndex !== index)))}
          canEdit={canEdit}
          renderItem={(item, index) => (
            <div style={grid2}>
              <TextField
                label="Título"
                value={item?.title}
                onChange={(next) => onChange(setAtPath(value, ['items'], updateArrayItem(value?.items ?? [], index, { ...item, title: next })))}
                canEdit={canEdit}
              />
              <TextField
                label="Descripción"
                value={item?.description}
                onChange={(next) => onChange(setAtPath(value, ['items'], updateArrayItem(value?.items ?? [], index, { ...item, description: next })))}
                canEdit={canEdit}
                rows={2}
              />
            </div>
          )}
        />
      )}

      {hasSteps && (
        <ArrayEditor
          title="Pasos"
          hint="Cada paso del método, en orden."
          items={value.steps}
          itemLabel="Paso"
          onAdd={() => onChange(setAtPath(value, ['steps'], [...(value?.steps ?? []), { title: '', description: '' }]))}
          addLabel="Agregar paso"
          onRemove={(index) => onChange(setAtPath(value, ['steps'], (value?.steps ?? []).filter((_, itemIndex) => itemIndex !== index)))}
          canEdit={canEdit}
          renderItem={(item, index) => (
            <div style={grid2}>
              <TextField
                label="Título"
                value={item?.title}
                onChange={(next) => onChange(setAtPath(value, ['steps'], updateArrayItem(value?.steps ?? [], index, { ...item, title: next })))}
                canEdit={canEdit}
              />
              <TextField
                label="Descripción"
                value={item?.description}
                onChange={(next) => onChange(setAtPath(value, ['steps'], updateArrayItem(value?.steps ?? [], index, { ...item, description: next })))}
                canEdit={canEdit}
                rows={2}
              />
            </div>
          )}
        />
      )}

      {hasConclusion && (
        <TextField
          label="Frase de cierre"
          hint="Frase corta que cierra esta sección."
          value={value?.conclusion}
          onChange={(next) => onChange(setAtPath(value, ['conclusion'], next))}
          canEdit={canEdit}
        />
      )}

      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--muted)' }}>Opciones avanzadas</summary>
        <div style={{ ...grid2, marginTop: 12 }}>
          <ToggleField
            label="Visibilidad"
            checked={value?.isActive !== false}
            onChange={(next) => onChange(setAtPath(value, ['isActive'], next))}
            canEdit={canEdit}
          />
          <TextField
            label="Orden"
            hint="Número menor = aparece primero."
            value={String(value?.sortOrder ?? '')}
            onChange={(next) => onChange(setAtPath(value, ['sortOrder'], Number(next) || 0))}
            canEdit={canEdit}
          />
        </div>
      </details>
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
          <h2 style={{ margin: 0, fontSize: 20 }}>Página {title}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Cada bloque de abajo corresponde a una parte de la página pública de {title}. Haz clic en un bloque para abrirlo y editarlo.
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

      {sections.map((section, index) => {
        const info = SECTION_INFO[section?.id] ?? {}
        const label = info.label ?? section?.title ?? `Sección ${index + 1}`
        return (
          <CollapsibleSection
            key={section?.id ?? index}
            title={`Sección ${index + 1}: ${label}`}
            hint={info.hint}
          >
            <SectionEditor
              value={section}
              onChange={(next) => setPage({ ...(value ?? {}), sections: updateArrayItem(sections, index, next) })}
              onUploadFile={onUploadFile}
              canEdit={canEdit}
              pageKey={pageKey}
              sectionIndex={index}
              fields={info.fields}
            />
            {canEdit && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={styles.btn}
                  style={{ padding: '6px 12px', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
                  onClick={() => setPage({ ...(value ?? {}), sections: sections.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <Trash2 size={14} />
                  Eliminar esta sección
                </button>
              </div>
            )}
          </CollapsibleSection>
        )
      })}

      {canEdit && (
        <button
          type="button"
          className={styles.btn}
          style={{ padding: '10px 16px', justifySelf: 'start' }}
          onClick={() => setPage({
            ...(value ?? {}),
            sections: [
              ...sections,
              {
                id: `section-${sections.length + 1}`,
                title: '',
                heading: '',
                body: '',
                media: null,
                items: [],
                isActive: true,
                sortOrder: sections.length,
              },
            ],
          })}
        >
          <Plus size={14} />
          Agregar sección nueva
        </button>
      )}
    </div>
  )
}
