import { useState } from 'react'
import { useConfiguracionStore, CONFIG_DEFAULTS } from '@/stores/configuracionStore'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'

const TABS = [
  { id: 'contacto',  label: '📞 Contacto'   },
  { id: 'textos',    label: '📝 Textos'      },
  { id: 'imagenes',  label: '🖼️ Imágenes'   },
  { id: 'reservas',  label: '🗓️ Reservas'   },
  { id: 'estudio',   label: '🏢 Estudio'     },
]

// ── Estilos compartidos ───────────────────────────────────────────────────────
const panel = {
  background:   'var(--neutral-card)',
  border:       '1px solid var(--neutral-border)',
  borderRadius: 12,
  padding:      '24px 28px',
  marginBottom: 16,
}
const label = {
  display:      'block',
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  color:        'var(--text-secondary)',
  marginBottom: 6,
  fontWeight:   500,
}
const hint = {
  fontFamily: 'var(--font-body)',
  fontSize:   11,
  color:      'var(--text-muted)',
  marginTop:  4,
  lineHeight: 1.5,
}
const sectionTitle = {
  fontFamily:    'var(--font-heading)',
  fontSize:      15,
  color:         'var(--text-primary)',
  marginBottom:  20,
  paddingBottom: 12,
  borderBottom:  '1px solid var(--neutral-border)',
}
const grid2 = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap:                 20,
}

// ── Componentes pequeños ──────────────────────────────────────────────────────
function Field({ label: lbl, children, hint: h }) {
  return (
    <div>
      <label style={label}>{lbl}</label>
      {children}
      {h && <p style={hint}>{h}</p>}
    </div>
  )
}

function ImagePreview({ url }) {
  if (!url) return null
  return (
    <img
      src={url}
      alt="preview"
      style={{ height: 80, borderRadius: 8, objectFit: 'cover', marginTop: 8, display: 'block' }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

function BotonesGuardar({ guardando, onRestaurar }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
      <button
        type="button"
        onClick={onRestaurar}
        style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
      >
        ↩️ Restaurar defaults
      </button>
      <button
        type="submit"
        disabled={guardando}
        style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}
      >
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ── TAB 1: Contacto ───────────────────────────────────────────────────────────
function TabContacto({ cfg, actualizar }) {
  const [form, setForm] = useState({
    telefono:        cfg.get('telefono'),
    direccion:       cfg.get('direccion'),
    instagram:       cfg.get('instagram'),
    instagramHandle: cfg.get('instagramHandle'),
    whatsapp:        cfg.get('whatsapp'),
  })
  const [guardando, setGuardando] = useState(false)

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    actualizar({
      telefono:        form.telefono.trim(),
      direccion:       form.direccion.trim(),
      instagram:       form.instagram.trim(),
      instagramHandle: form.instagramHandle.trim(),
      whatsapp:        form.whatsapp.trim(),
    })
    await new Promise(r => setTimeout(r, 350))
    setGuardando(false)
    toast.success('Información de contacto guardada 📞')
  }

  function handleRestaurar() {
    if (!window.confirm('¿Restaurar la información de contacto a los valores predeterminados?')) return
    const keys = ['telefono', 'direccion', 'instagram', 'instagramHandle', 'whatsapp']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    actualizar(defaults)
    setForm(defaults)
    toast('Contacto restaurado', { icon: '↩️' })
  }

  return (
    <form onSubmit={handleGuardar}>
      <div style={panel}>
        <div style={sectionTitle}>📞 Información de contacto</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={grid2}>
            <Field label="Teléfono" hint="Aparece en la página de Contacto. [BACKEND] → configuracion.telefono">
              <input type="text" value={form.telefono} onChange={f('telefono')} className={styles.formInput} placeholder="+52 (999) 000-0000" />
            </Field>
            <Field label="Handle de Instagram" hint='El texto visible del link (ej: @casa.scarlatta). [BACKEND] → configuracion.instagramHandle'>
              <input type="text" value={form.instagramHandle} onChange={f('instagramHandle')} className={styles.formInput} placeholder="@cuenta" />
            </Field>
          </div>
          <Field label="URL de Instagram" hint="[BACKEND] → configuracion.instagram">
            <input type="text" value={form.instagram} onChange={f('instagram')} className={styles.formInput} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="WhatsApp" hint="Solo números. Se usa para el botón de WhatsApp directo. Dejar vacío para no mostrar. [BACKEND] → configuracion.whatsapp">
            <input type="text" value={form.whatsapp} onChange={f('whatsapp')} className={styles.formInput} placeholder="+52 999 000 0000" />
          </Field>
          <Field label="Dirección completa" hint="Aparece en la página de Contacto. [BACKEND] → configuracion.direccion">
            <textarea rows={2} value={form.direccion} onChange={f('direccion')} className={styles.formInput} placeholder="Calle 00 #00, Col. Centro..." style={{ resize: 'vertical' }} />
          </Field>
        </div>
      </div>
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} />
    </form>
  )
}

// ── TAB 2: Textos ─────────────────────────────────────────────────────────────
function TabTextos({ cfg, actualizar }) {
  const [form, setForm] = useState({
    nosotrosTexto1: cfg.get('nosotrosTexto1'),
    nosotrosTexto2: cfg.get('nosotrosTexto2'),
  })
  const [guardando, setGuardando] = useState(false)

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    actualizar({ nosotrosTexto1: form.nosotrosTexto1.trim(), nosotrosTexto2: form.nosotrosTexto2.trim() })
    await new Promise(r => setTimeout(r, 350))
    setGuardando(false)
    toast.success('Textos del sitio guardados 📝')
  }

  function handleRestaurar() {
    if (!window.confirm('¿Restaurar los textos a los valores predeterminados?')) return
    const keys = ['nosotrosTexto1', 'nosotrosTexto2']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    actualizar(defaults)
    setForm(defaults)
    toast('Textos restaurados', { icon: '↩️' })
  }

  return (
    <form onSubmit={handleGuardar}>
      <div style={panel}>
        <div style={sectionTitle}>📝 Textos de la página Nosotros</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Frase principal" hint="Aparece como título en la página Nosotros. [BACKEND] → configuracion.nosotrosTexto1">
            <textarea rows={3} value={form.nosotrosTexto1} onChange={f('nosotrosTexto1')} className={styles.formInput} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Palabras clave / subtítulo" hint="Aparece debajo de la frase principal. [BACKEND] → configuracion.nosotrosTexto2">
            <textarea rows={2} value={form.nosotrosTexto2} onChange={f('nosotrosTexto2')} className={styles.formInput} style={{ resize: 'vertical' }} />
          </Field>
        </div>
      </div>
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} />
    </form>
  )
}

// ── TAB 3: Imágenes ───────────────────────────────────────────────────────────
function TabImagenes({ cfg, actualizar }) {
  const [carouselHome,     setCarouselHome]     = useState(() => cfg.get('carouselHome'))
  const [carouselNosotros, setCarouselNosotros] = useState(() => cfg.get('carouselNosotros'))
  const [imagenes, setImagenes] = useState({
    imagenBannerClases:  cfg.get('imagenBannerClases'),
    imagenStryde:        cfg.get('imagenStryde'),
    imagenSlow:          cfg.get('imagenSlow'),
    imagenCoachesBanner: cfg.get('imagenCoachesBanner'),
  })
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    actualizar({ carouselHome, carouselNosotros, ...imagenes })
    await new Promise(r => setTimeout(r, 350))
    setGuardando(false)
    toast.success('Imágenes guardadas 🖼️')
  }

  function handleRestaurar() {
    if (!window.confirm('¿Restaurar todas las imágenes a los valores predeterminados?')) return
    const keys = ['carouselHome', 'carouselNosotros', 'imagenBannerClases', 'imagenStryde', 'imagenSlow', 'imagenCoachesBanner']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    actualizar(defaults)
    setCarouselHome(CONFIG_DEFAULTS.carouselHome)
    setCarouselNosotros(CONFIG_DEFAULTS.carouselNosotros)
    setImagenes({ imagenBannerClases: CONFIG_DEFAULTS.imagenBannerClases, imagenStryde: CONFIG_DEFAULTS.imagenStryde, imagenSlow: CONFIG_DEFAULTS.imagenSlow, imagenCoachesBanner: CONFIG_DEFAULTS.imagenCoachesBanner })
    toast('Imágenes restauradas', { icon: '↩️' })
  }

  // ── Carrusel Home helpers
  function updateHomeSlide(idx, field, val) {
    setCarouselHome(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }
  function removeHomeSlide(idx) {
    setCarouselHome(prev => prev.filter((_, i) => i !== idx))
  }
  function addHomeSlide() {
    if (carouselHome.length >= 6) return
    setCarouselHome(prev => [...prev, { tipo: 'imagen', url: '' }])
  }

  // ── Carrusel Nosotros helpers
  function updateNosotrosSlide(idx, val) {
    setCarouselNosotros(prev => prev.map((s, i) => i === idx ? val : s))
  }
  function removeNosotrosSlide(idx) {
    setCarouselNosotros(prev => prev.filter((_, i) => i !== idx))
  }
  function addNosotrosSlide() {
    if (carouselNosotros.length >= 8) return
    setCarouselNosotros(prev => [...prev, ''])
  }

  const imgField = (key, labelText, hintText) => (
    <Field label={labelText} hint={hintText}>
      <input
        type="text"
        value={imagenes[key]}
        onChange={e => setImagenes(p => ({ ...p, [key]: e.target.value }))}
        className={styles.formInput}
        placeholder="https://... o /fotos/imagen.jpg"
      />
      <ImagePreview url={imagenes[key]} />
    </Field>
  )

  const noteStyle = {
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'rgba(245,158,11,0.85)',
    marginBottom: 20,
    lineHeight: 1.6,
  }

  return (
    <form onSubmit={handleGuardar}>
      <div style={noteStyle}>
        💡 Pega la URL de cualquier imagen (Google Drive con acceso público, Dropbox, Unsplash, etc.).
        Asegúrate de que sea un link de imagen directa.<br />
        <span style={{ opacity: 0.7 }}>[BACKEND] → Cuando el backend esté listo, estas URLs se reemplazarán por un botón de subida de archivos.</span>
      </div>

      {/* Carrusel Home */}
      <div style={panel}>
        <div style={sectionTitle}>Inicio — Carrusel hero</div>
        <p style={{ ...hint, marginBottom: 16 }}>
          Para videos YouTube, usa solo el ID (ej: djp5ZQQ7WXA), no la URL completa. Máx. 6 slides.
        </p>
        {carouselHome.map((slide, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, borderBottom: '1px solid var(--neutral-border)', paddingBottom: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  value={slide.tipo}
                  onChange={e => updateHomeSlide(i, 'tipo', e.target.value)}
                  className={styles.formInput}
                  style={{ width: 160 }}
                >
                  <option value="imagen">🖼 Imagen</option>
                  <option value="video">▶ Video YouTube</option>
                </select>
                {slide.tipo === 'video' ? (
                  <input
                    type="text"
                    placeholder="ID de YouTube (ej: djp5ZQQ7WXA)"
                    value={slide.videoId ?? ''}
                    onChange={e => updateHomeSlide(i, 'videoId', e.target.value)}
                    className={styles.formInput}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="URL de imagen"
                    value={slide.url ?? ''}
                    onChange={e => updateHomeSlide(i, 'url', e.target.value)}
                    className={styles.formInput}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
              {slide.tipo === 'imagen' && slide.url && <ImagePreview url={slide.url} />}
              {slide.tipo === 'video' && slide.videoId && (
                <p style={hint}>▶ Video: youtube.com/watch?v={slide.videoId}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeHomeSlide(i)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '4px 8px', flexShrink: 0 }}
              title="Eliminar slide"
            >
              ×
            </button>
          </div>
        ))}
        {carouselHome.length < 6 && (
          <button
            type="button"
            onClick={addHomeSlide}
            style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, border: '1px dashed var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
          >
            + Agregar slide
          </button>
        )}
      </div>

      {/* Carrusel Nosotros */}
      <div style={panel}>
        <div style={sectionTitle}>Nosotros — Carrusel de fotos</div>
        <p style={{ ...hint, marginBottom: 16 }}>Máx. 8 fotos. [BACKEND] → configuracion.carouselNosotros</p>
        {carouselNosotros.map((url, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="URL de imagen"
                value={url}
                onChange={e => updateNosotrosSlide(i, e.target.value)}
                className={styles.formInput}
              />
              <ImagePreview url={url} />
            </div>
            <button
              type="button"
              onClick={() => removeNosotrosSlide(i)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '4px 8px', flexShrink: 0 }}
              title="Eliminar foto"
            >
              ×
            </button>
          </div>
        ))}
        {carouselNosotros.length < 8 && (
          <button
            type="button"
            onClick={addNosotrosSlide}
            style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, border: '1px dashed var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
          >
            + Agregar foto
          </button>
        )}
      </div>

      {/* Imágenes de sección */}
      <div style={panel}>
        <div style={sectionTitle}>Imágenes de sección</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {imgField('imagenBannerClases',  'Banner página Clases',        'Imagen de fondo en la sección hero de la página de Clases. [BACKEND] → configuracion.imagenBannerClases')}
          {imgField('imagenStryde',        'Imagen disciplina Stryde X',  'Imagen de fondo del botón Stryde X en la página de Inicio. [BACKEND] → configuracion.imagenStryde')}
          {imgField('imagenSlow',          'Imagen disciplina Slow',      'Imagen de fondo del botón Slow en la página de Inicio. [BACKEND] → configuracion.imagenSlow')}
          {imgField('imagenCoachesBanner', 'Banner coaches',               "Imagen de fondo de la sección 'Conoce a nuestro equipo'. [BACKEND] → configuracion.imagenCoachesBanner")}
        </div>
      </div>

      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} />
    </form>
  )
}

// ── TAB 4: Reservas ───────────────────────────────────────────────────────────
function TabReservas({ cfg, actualizar }) {
  const [form, setForm] = useState({
    horasCancelacion: cfg.get('horasCancelacion'),
    maxListaEspera:   cfg.get('maxListaEspera'),
  })
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar(e) {
    e.preventDefault()
    const horas    = Number(form.horasCancelacion)
    const maxEspera = Number(form.maxListaEspera)
    if (isNaN(horas) || horas < 1 || horas > 72) {
      toast.error('El límite de cancelación debe estar entre 1 y 72 horas')
      return
    }
    if (isNaN(maxEspera) || maxEspera < 0 || maxEspera > 50) {
      toast.error('El máximo de lista de espera debe estar entre 0 y 50')
      return
    }
    setGuardando(true)
    actualizar({ horasCancelacion: horas, maxListaEspera: maxEspera })
    await new Promise(r => setTimeout(r, 350))
    setGuardando(false)
    toast.success('Configuración de reservas guardada 🗓️')
  }

  function handleRestaurar() {
    if (!window.confirm('¿Restaurar la configuración de reservas a los valores predeterminados?')) return
    const keys = ['horasCancelacion', 'maxListaEspera']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    actualizar(defaults)
    setForm(defaults)
    toast('Reservas restauradas', { icon: '↩️' })
  }

  return (
    <form onSubmit={handleGuardar}>
      <div style={panel}>
        <div style={sectionTitle}>🗓️ Reservas y cancelaciones</div>
        <div style={grid2}>
          <div>
            <label style={label}>Límite de cancelación (horas)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number" min={1} max={72}
                value={form.horasCancelacion}
                onChange={e => setForm(f => ({ ...f, horasCancelacion: e.target.value }))}
                className={styles.formInput}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>horas antes de la clase</span>
            </div>
            <p style={hint}>
              El cliente NO podrá cancelar si faltan menos de estas horas.
              Valor actual: <strong>{cfg.get('horasCancelacion')}h</strong>. Default: {CONFIG_DEFAULTS.horasCancelacion}h.
              [BACKEND] → configuracion.horasCancelacion
            </p>
          </div>
          <div>
            <label style={label}>Máximo en lista de espera por clase</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number" min={0} max={50}
                value={form.maxListaEspera}
                onChange={e => setForm(f => ({ ...f, maxListaEspera: e.target.value }))}
                className={styles.formInput}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>personas (0 = sin límite)</span>
            </div>
            <p style={hint}>Default: {CONFIG_DEFAULTS.maxListaEspera}. [BACKEND] → configuracion.maxListaEspera</p>
          </div>
        </div>
        <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(59,130,246,0.8)', lineHeight: 1.6 }}>
          ℹ️ Cuando un cliente cancela, el lugar se asigna automáticamente al primero en la lista de espera y recibe un correo de notificación.
        </div>
      </div>
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} />
    </form>
  )
}

// ── TAB 5: Estudio ────────────────────────────────────────────────────────────
function TabEstudio({ cfg, actualizar }) {
  const [form, setForm] = useState({
    nombreEstudio: cfg.get('nombreEstudio'),
    ciudad:        cfg.get('ciudad'),
  })
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    actualizar({ nombreEstudio: form.nombreEstudio.trim(), ciudad: form.ciudad.trim() })
    await new Promise(r => setTimeout(r, 350))
    setGuardando(false)
    toast.success('Información del estudio guardada 🏢')
  }

  function handleRestaurar() {
    if (!window.confirm('¿Restaurar la información del estudio a los valores predeterminados?')) return
    const keys = ['nombreEstudio', 'ciudad']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    actualizar(defaults)
    setForm(defaults)
    toast('Estudio restaurado', { icon: '↩️' })
  }

  return (
    <form onSubmit={handleGuardar}>
      <div style={panel}>
        <div style={sectionTitle}>🏢 Información del estudio</div>
        <div style={grid2}>
          <Field label="Nombre del estudio" hint="Aparece en encabezados de PDFs y reportes. [BACKEND] → configuracion.nombreEstudio">
            <input type="text" value={form.nombreEstudio} onChange={e => setForm(f => ({ ...f, nombreEstudio: e.target.value }))} className={styles.formInput} placeholder="Casa Scarlatta" />
          </Field>
          <Field label="Ciudad / Ubicación" hint="Aparece en el pie de página de los reportes PDF. [BACKEND] → configuracion.ciudad">
            <input type="text" value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} className={styles.formInput} placeholder="Ciudad de México, México" />
          </Field>
        </div>
      </div>
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} />
    </form>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ConfiguracionSection() {
  const store = useConfiguracionStore()
  const [tabActivo, setTabActivo] = useState('contacto')

  const tabStyle = (id) => ({
    padding:      '8px 16px',
    borderRadius: 8,
    border:       tabActivo === id ? 'none' : '1px solid var(--neutral-border)',
    background:   tabActivo === id ? '#7B1E22' : 'transparent',
    color:        tabActivo === id ? '#fff' : 'var(--text-muted)',
    fontFamily:   'var(--font-body)',
    fontSize:     13,
    fontWeight:   tabActivo === id ? 600 : 400,
    cursor:       'pointer',
    transition:   'all 0.15s',
  })

  return (
    <div>
      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} style={tabStyle(t.id)} onClick={() => setTabActivo(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      {tabActivo === 'contacto' && <TabContacto  cfg={store} actualizar={store.actualizar} />}
      {tabActivo === 'textos'   && <TabTextos    cfg={store} actualizar={store.actualizar} />}
      {tabActivo === 'imagenes' && <TabImagenes  cfg={store} actualizar={store.actualizar} />}
      {tabActivo === 'reservas' && <TabReservas  cfg={store} actualizar={store.actualizar} />}
      {tabActivo === 'estudio'  && <TabEstudio   cfg={store} actualizar={store.actualizar} />}
    </div>
  )
}
