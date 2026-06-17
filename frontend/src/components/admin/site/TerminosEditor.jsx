import { Plus, Trash2 } from 'lucide-react'
import MediaPicker from './MediaPicker'
import styles from '@/pages/admin/AdminPanel.module.css'

function clone(v) {
  if (typeof structuredClone === 'function') return structuredClone(v)
  return JSON.parse(JSON.stringify(v ?? {}))
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const panel = {
  padding: 18,
  borderRadius: 12,
  border: '1px solid var(--muted-2)',
  background: 'rgba(255,255,255,0.02)',
  display: 'grid',
  gap: 14,
}

const fieldWrap = { display: 'grid', gap: 6 }
const fieldLabel = { fontSize: 12, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.02em' }

function TextField({ label, value, onChange, placeholder, canEdit = true, rows = 1 }) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      {rows > 1 ? (
        <textarea
          rows={rows}
          className={styles.formInput}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={!canEdit}
          style={{ resize: 'vertical' }}
        />
      ) : (
        <input
          className={styles.formInput}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={!canEdit}
        />
      )}
    </label>
  )
}

export default function TerminosEditor({ value = {}, onChange, onUploadFile, canEdit = true }) {
  const sections = Array.isArray(value.sections) ? value.sections : []
  const images   = Array.isArray(value.images)   ? value.images   : []

  function updateField(key, val) {
    onChange({ ...clone(value), [key]: val })
  }

  function updateSection(index, next) {
    const next_sections = sections.map((s, i) => i === index ? next : s)
    updateField('sections', next_sections)
  }

  function addSection() {
    updateField('sections', [...sections, { id: uid(), titulo: 'Nueva sección', contenido: '' }])
  }

  function removeSection(index) {
    updateField('sections', sections.filter((_, i) => i !== index))
  }

  function updateImage(index, next) {
    updateField('images', images.map((img, i) => i === index ? next : img))
  }

  function addImage() {
    updateField('images', [...images, { id: uid(), url: '', alt: '' }])
  }

  function removeImage(index) {
    updateField('images', images.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>

      {/* Metadatos */}
      <div style={panel}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Metadatos</h3>
        <TextField
          label="Fecha de última actualización"
          value={value.lastUpdated}
          onChange={(v) => updateField('lastUpdated', v)}
          placeholder="ej. junio 2026"
          canEdit={canEdit}
        />
      </div>

      {/* Secciones de texto */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Secciones de texto</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              Cada sección tiene un título y un párrafo de contenido.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              className={styles.btn}
              style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={addSection}
            >
              <Plus size={14} /> Agregar sección
            </button>
          )}
        </div>

        {sections.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Sin secciones todavía.</p>
        )}

        {sections.map((sec, index) => (
          <div key={sec.id ?? index} style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Sección {index + 1}</span>
              {canEdit && (
                <button
                  type="button"
                  className={styles.btn}
                  style={{ padding: '5px 10px', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={() => removeSection(index)}
                >
                  <Trash2 size={13} /> Eliminar
                </button>
              )}
            </div>
            <TextField
              label="Título"
              value={sec.titulo}
              onChange={(v) => updateSection(index, { ...sec, titulo: v })}
              placeholder="ej. 1. Aceptación de los términos"
              canEdit={canEdit}
            />
            <TextField
              label="Contenido"
              value={sec.contenido}
              onChange={(v) => updateSection(index, { ...sec, contenido: v })}
              placeholder="Escribe el texto de esta sección..."
              canEdit={canEdit}
              rows={5}
            />
          </div>
        ))}
      </div>

      {/* Imágenes */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Imágenes</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              Imágenes opcionales que aparecen en la página de términos.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              className={styles.btn}
              style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={addImage}
            >
              <Plus size={14} /> Agregar imagen
            </button>
          )}
        </div>

        {images.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Sin imágenes todavía.</p>
        )}

        {images.map((img, index) => (
          <div key={img.id ?? index} style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Imagen {index + 1}</span>
              {canEdit && (
                <button
                  type="button"
                  className={styles.btn}
                  style={{ padding: '5px 10px', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={() => removeImage(index)}
                >
                  <Trash2 size={13} /> Eliminar
                </button>
              )}
            </div>
            <MediaPicker
              label="Imagen"
              value={img}
              onChange={(next) => updateImage(index, { ...next, id: img.id })}
              onUploadFile={onUploadFile}
              allowedTypes={['image']}
              field={`pages.terminos.images.${index}`}
              publicIdPrefix="terminos-img"
              canEdit={canEdit}
            />
            <TextField
              label="Texto alternativo (alt)"
              value={img.alt}
              onChange={(v) => updateImage(index, { ...img, alt: v })}
              placeholder="Descripción de la imagen"
              canEdit={canEdit}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
