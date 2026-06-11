import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useConfiguracionStore, CONFIG_DEFAULTS } from '@/stores/configuracionStore'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'
import ConfiguracionCorreoSection from './ConfiguracionCorreoSection'
import RolesPermissionsSection from '../components/rbac/RolesPermissionsSection'
import { hasAnyPermission, hasPermission } from '@/auth/permissions'
import {
  useUpdateSiteConfigurationMutation,
  useUploadSiteConfigurationMediaMutation,
} from '@/hooks/useApiQueries'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { isVideoMediaUrl } from '@/adapters/siteConfigurationAdapter'

// ── Compresión de imagen vía canvas (max 1920px, JPEG 0.82) ──────────────────
function compressImage(file, maxWidth = 1920, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const TABS = [
  { id: 'contacto', label: 'Contacto' },
  { id: 'textos', label: 'Textos' },
  { id: 'imagenes', label: 'Imagenes' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'estudio', label: 'Estudio' },
  { id: 'correo', label: 'Correo' },
  { id: 'roles', label: 'Roles y permisos' },
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

const SITE_CONFIGURATION_ERROR_MESSAGES = {
  SITE_CONFIG_MAX_HERO_SLIDES_EXCEEDED: 'Máximo 6 slides en el carrusel de inicio.',
  SITE_CONFIG_MAX_NOSOTROS_ITEMS_EXCEEDED: 'Máximo 8 elementos en el carrusel de Nosotros.',
  SITE_MEDIA_INVALID_TYPE: 'Formato no permitido. Usa JPG, PNG o WEBP.',
  SITE_MEDIA_TOO_LARGE: 'La imagen supera el tamaño máximo permitido.',
  SITE_VIDEO_UPLOAD_NOT_SUPPORTED: 'El video local aún no está soportado.',
  SITE_CONFIG_INVALID_INSTAGRAM_URL: 'La URL de Instagram debe iniciar con https://',
  SITE_CONFIG_INVALID_WHATSAPP: 'WhatsApp debe contener solo números.',
}

function getSiteConfigurationErrorMessage(error) {
  return SITE_CONFIGURATION_ERROR_MESSAGES[error?.code]
    ?? error?.message
    ?? 'No se pudo guardar la configuración del sitio.'
}

async function persistConfiguration({ actualizar, payload, setGuardando, successMessage }) {
  setGuardando(true)
  try {
    await actualizar(payload)
    toast.success(successMessage)
    return true
  } catch (error) {
    toast.error(getSiteConfigurationErrorMessage(error))
    return false
  } finally {
    setGuardando(false)
  }
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

function MediaPreview({ url, isVideo }) {
  if (!url) return null
  if (isVideo) {
    return (
      <>
        <video
          src={url}
          style={{ height: 80, borderRadius: 8, objectFit: 'cover', marginTop: 8, display: 'block', background: '#111' }}
          muted autoPlay loop playsInline
          onError={e => { e.target.style.display = 'none' }}
        />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(245,158,11,0.8)', marginTop: 4 }}>
          ⚠️ Video temporal — se perderá al recargar la página. Usa YouTube o el backend para persistencia.
        </p>
      </>
    )
  }
  return (
    <img
      src={url}
      alt="preview"
      style={{ height: 80, borderRadius: 8, objectFit: 'cover', marginTop: 8, display: 'block' }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

function BotonesGuardar({ guardando, onRestaurar, canEdit = true }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
      <button
        type="button"
        onClick={onRestaurar}
        disabled={guardando || !canEdit}
        style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
      >
        ↩️ Restaurar defaults
      </button>
      <button
        type="submit"
        disabled={guardando || !canEdit}
        style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}
      >
        {guardando ? 'Guardando…' : canEdit ? 'Guardar cambios' : 'Sin permiso para editar'}
      </button>
    </div>
  )
}

// ── TAB 1: Contacto ───────────────────────────────────────────────────────────
function TabContacto({ cfg, actualizar, canEdit = true }) {
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
    await persistConfiguration({
      actualizar,
      setGuardando,
      successMessage: 'Información de contacto guardada',
      payload: {
      telefono:        form.telefono.trim(),
      direccion:       form.direccion.trim(),
      instagram:       form.instagram.trim(),
      instagramHandle: form.instagramHandle.trim(),
      whatsapp:        form.whatsapp.trim(),
      },
    })
  }

  async function handleRestaurar() {
    if (!window.confirm('¿Restaurar la información de contacto a los valores predeterminados?')) return
    const keys = ['telefono', 'direccion', 'instagram', 'instagramHandle', 'whatsapp']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    const saved = await persistConfiguration({
      actualizar,
      payload: defaults,
      setGuardando,
      successMessage: 'Contacto restaurado',
    })
    if (saved) setForm(defaults)
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
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} canEdit={canEdit} />
    </form>
  )
}

// ── TAB 2: Textos ─────────────────────────────────────────────────────────────
function TabTextos({ cfg, actualizar, canEdit = true }) {
  const [form, setForm] = useState({
    nosotrosTexto1: cfg.get('nosotrosTexto1'),
    nosotrosTexto2: cfg.get('nosotrosTexto2'),
  })
  const [guardando, setGuardando] = useState(false)

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleGuardar(e) {
    e.preventDefault()
    await persistConfiguration({
      actualizar,
      setGuardando,
      successMessage: 'Textos del sitio guardados',
      payload: {
        nosotrosTexto1: form.nosotrosTexto1.trim(),
        nosotrosTexto2: form.nosotrosTexto2.trim(),
      },
    })
  }

  async function handleRestaurar() {
    if (!window.confirm('¿Restaurar los textos a los valores predeterminados?')) return
    const keys = ['nosotrosTexto1', 'nosotrosTexto2']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    const saved = await persistConfiguration({
      actualizar,
      payload: defaults,
      setGuardando,
      successMessage: 'Textos restaurados',
    })
    if (saved) setForm(defaults)
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
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} canEdit={canEdit} />
    </form>
  )
}

// ── TAB 3: Imágenes ───────────────────────────────────────────────────────────
function TabImagenes({ cfg, actualizar, uploadMedia, apiMode, canEdit = true }) {
  const [carouselHero,     setCarouselHero]     = useState(() => cfg.get('carouselHero'))
  const [carouselNosotros, setCarouselNosotros] = useState(() => cfg.get('carouselNosotros'))
  const [imagenes, setImagenes] = useState({
    imagenBannerClases:  cfg.get('imagenBannerClases'),
    imagenStryde:        cfg.get('imagenStryde'),
    imagenSlow:          cfg.get('imagenSlow'),
    imagenCoachesBanner: cfg.get('imagenCoachesBanner'),
  })
  const [guardando,  setGuardando]  = useState(false)
  const [uploading,  setUploading]  = useState(false)

  // Tracks which fields/indices have a video blob this session (blob URLs don't persist)
  const [videoNosotros, setVideoNosotros] = useState(new Set())   // Set of indices
  const [videoImagenes, setVideoImagenes] = useState(new Set())   // Set of keys

  // ── Shared hidden file input ──────────────────────────────────────────────
  const fileInputRef = useRef(null)
  const callbackRef  = useRef(null)

  const triggerUpload = useCallback((field, onResult) => {
    callbackRef.current = { field, onResult }
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }, [])

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file || !callbackRef.current) return
    setUploading(true)
    try {
      const { field, onResult } = callbackRef.current
      if (apiMode && file.type.startsWith('video/')) {
        const error = new Error('El video local aún no está soportado.')
        error.code = 'SITE_VIDEO_UPLOAD_NOT_SUPPORTED'
        throw error
      }
      if (apiMode) {
        const result = await uploadMedia({ field, file })
        if (!result?.url) throw new Error('SITE_MEDIA_UPLOAD_FAILED')
        onResult(result.url, false)
        toast.success('Imagen subida. Presiona Guardar cambios para publicarla.')
      } else if (file.type.startsWith('video/')) {
        const blobUrl = URL.createObjectURL(file)
        onResult(blobUrl, true)
        toast('Video cargado. Solo disponible esta sesión — se perderá al recargar.', { icon: '⚠️', duration: 6000 })
      } else {
        const dataUrl = await compressImage(file)
        onResult(dataUrl, false)
      }
    } catch (error) {
      toast.error(getSiteConfigurationErrorMessage(error))
    } finally {
      setUploading(false)
      callbackRef.current = null
    }
  }

  async function handleGuardar(e) {
    e.preventDefault()
    await persistConfiguration({
      actualizar,
      setGuardando,
      successMessage: 'Imágenes publicadas',
      payload: { carouselHero, carouselNosotros, ...imagenes },
    })
  }

  async function handleRestaurar() {
    if (!window.confirm('¿Restaurar todas las imágenes a los valores predeterminados?')) return
    const keys = ['carouselHero', 'carouselNosotros', 'imagenBannerClases', 'imagenStryde', 'imagenSlow', 'imagenCoachesBanner']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    const saved = await persistConfiguration({
      actualizar,
      payload: defaults,
      setGuardando,
      successMessage: 'Imágenes restauradas',
    })
    if (saved) {
      setCarouselHero(CONFIG_DEFAULTS.carouselHero)
      setCarouselNosotros(CONFIG_DEFAULTS.carouselNosotros)
      setImagenes({ imagenBannerClases: CONFIG_DEFAULTS.imagenBannerClases, imagenStryde: CONFIG_DEFAULTS.imagenStryde, imagenSlow: CONFIG_DEFAULTS.imagenSlow, imagenCoachesBanner: CONFIG_DEFAULTS.imagenCoachesBanner })
      setVideoNosotros(new Set())
      setVideoImagenes(new Set())
    }
  }

  // ── Carrusel Home helpers
  function updateHomeSlide(idx, field, val) {
    setCarouselHero(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }
  function removeHomeSlide(idx) {
    setCarouselHero(prev => prev.filter((_, i) => i !== idx))
  }
  function addHomeSlide() {
    if (carouselHero.length >= 6) return
    setCarouselHero(prev => [...prev, { tipo: 'imagen', url: '' }])
  }

  // ── Carrusel Nosotros helpers
  function updateNosotrosSlide(idx, val) {
    setCarouselNosotros(prev => prev.map((s, i) => i === idx ? val : s))
  }
  function removeNosotrosSlide(idx) {
    setCarouselNosotros(prev => prev.filter((_, i) => i !== idx))
    setVideoNosotros(prev => { const n = new Set(prev); n.delete(idx); return n })
  }
  function addNosotrosSlide() {
    if (carouselNosotros.length >= 8) return
    setCarouselNosotros(prev => [...prev, ''])
  }

  // ── Shared upload button ──────────────────────────────────────────────────
  const uploadBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '0 12px', height: 36, borderRadius: 8,
    border: '1px solid var(--neutral-border)',
    background: 'rgba(255,255,255,0.04)',
    color: uploading ? 'var(--text-muted)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-body)', fontSize: 12,
    cursor: uploading ? 'not-allowed' : 'pointer',
    flexShrink: 0, whiteSpace: 'nowrap',
  }

  function UploadBtn({ field, onResult, videoUpload = false, ariaLabel = 'Subir archivo' }) {
    return (
      <button
        type="button"
        style={uploadBtnStyle}
        disabled={uploading || !canEdit}
        aria-label={ariaLabel}
        onClick={() => {
          if (apiMode && videoUpload) {
            toast.error(SITE_CONFIGURATION_ERROR_MESSAGES.SITE_VIDEO_UPLOAD_NOT_SUPPORTED)
            return
          }
          triggerUpload(field, onResult)
        }}
        title="Subir imagen o video desde tu computadora"
      >
        {uploading ? '⏳' : '📁'} {uploading ? 'Leyendo…' : 'Subir'}
      </button>
    )
  }

  // ── Section image field with upload ──────────────────────────────────────
  const imgField = (key, labelText, hintText) => (
    <Field label={labelText} hint={hintText}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={imagenes[key]}
          onChange={e => setImagenes(p => ({ ...p, [key]: e.target.value }))}
          className={styles.formInput}
          placeholder="https://... o /fotos/archivo.jpg"
          style={{ flex: 1 }}
        />
        <UploadBtn field={key} ariaLabel={`Subir ${labelText}`} onResult={(val, isVid) => {
          setImagenes(p => ({ ...p, [key]: val }))
          setVideoImagenes(prev => { const n = new Set(prev); isVid ? n.add(key) : n.delete(key); return n })
        }} />
      </div>
      <MediaPreview url={imagenes[key]} isVideo={videoImagenes.has(key)} />
    </Field>
  )

  return (
    <form onSubmit={handleGuardar}>
      {/* Hidden shared file input — accepts images AND videos */}
      <input
        ref={fileInputRef}
        type="file"
        accept={apiMode ? 'image/jpeg,image/png,image/webp' : 'image/*,video/*'}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Carrusel Home ──────────────────────────────────────────────── */}
      <div style={panel}>
        <div style={sectionTitle}>Inicio — Carrusel hero</div>
        <p style={{ ...hint, marginBottom: 16 }}>
          Máx. 6 slides. YouTube: pega solo el ID (ej: djp5ZQQ7WXA). {apiMode ? 'Upload de video local aún no soportado.' : 'Video local: solo esta sesión.'}
        </p>
        {carouselHero.map((slide, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, borderBottom: '1px solid var(--neutral-border)', paddingBottom: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={slide.tipo}
                  onChange={e => updateHomeSlide(i, 'tipo', e.target.value)}
                  className={styles.formInput}
                  style={{ width: 160, flexShrink: 0 }}
                >
                  <option value="imagen">🖼 Imagen</option>
                  <option value="videolocal">🎬 Video local</option>
                  <option value="video">▶ Video YouTube</option>
                </select>

                {slide.tipo === 'video' && (
                  <input
                    type="text"
                    placeholder="ID de YouTube (ej: djp5ZQQ7WXA)"
                    value={slide.videoId ?? ''}
                    onChange={e => updateHomeSlide(i, 'videoId', e.target.value)}
                    className={styles.formInput}
                    style={{ flex: 1 }}
                  />
                )}

                {(slide.tipo === 'imagen' || slide.tipo === 'videolocal') && (
                  <>
                    <input
                      type="text"
                      placeholder={slide.tipo === 'videolocal' ? 'URL de video' : 'URL de imagen'}
                      value={slide.url ?? ''}
                      onChange={e => updateHomeSlide(i, 'url', e.target.value)}
                      className={styles.formInput}
                      style={{ flex: 1 }}
                    />
                    <UploadBtn
                      field="carouselHero"
                      ariaLabel={`Subir slide ${i + 1} del carrusel de inicio`}
                      videoUpload={slide.tipo === 'videolocal'}
                      onResult={(val) => updateHomeSlide(i, 'url', val)}
                    />
                  </>
                )}
              </div>

              {slide.tipo === 'imagen'     && slide.url && <MediaPreview url={slide.url} isVideo={false} />}
              {slide.tipo === 'videolocal' && slide.url && <MediaPreview url={slide.url} isVideo={true} />}
              {slide.tipo === 'video'      && slide.videoId && (
                <p style={hint}>▶ youtube.com/watch?v={slide.videoId}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeHomeSlide(i)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '4px 8px', flexShrink: 0 }}
              title="Eliminar slide"
            >×</button>
          </div>
        ))}
        {carouselHero.length < 6 && (
          <button
            type="button"
            onClick={addHomeSlide}
            style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, border: '1px dashed var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
          >+ Agregar slide</button>
        )}
      </div>

      {/* ── Carrusel Nosotros ──────────────────────────────────────────── */}
      <div style={panel}>
        <div style={sectionTitle}>Nosotros — Carrusel de fotos</div>
        <p style={{ ...hint, marginBottom: 16 }}>
          Máx. 8 archivos. En API mode el upload acepta imágenes JPG, PNG o WEBP; video puede configurarse por URL.
        </p>
        {carouselNosotros.map((url, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="URL de imagen o video"
                  value={url}
                  onChange={e => updateNosotrosSlide(i, e.target.value)}
                  className={styles.formInput}
                  style={{ flex: 1 }}
                />
                <UploadBtn field="carouselNosotros" ariaLabel={`Subir elemento ${i + 1} del carrusel Nosotros`} onResult={(val, isVid) => {
                  updateNosotrosSlide(i, val)
                  setVideoNosotros(prev => { const n = new Set(prev); isVid ? n.add(i) : n.delete(i); return n })
                }} />
              </div>
              <MediaPreview url={url} isVideo={videoNosotros.has(i) || isVideoMediaUrl(url)} />
            </div>
            <button
              type="button"
              onClick={() => removeNosotrosSlide(i)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '4px 8px', flexShrink: 0 }}
              title="Eliminar"
            >×</button>
          </div>
        ))}
        {carouselNosotros.length < 8 && (
          <button
            type="button"
            onClick={addNosotrosSlide}
            style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, border: '1px dashed var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
          >+ Agregar foto / video</button>
        )}
      </div>

      {/* ── Imágenes de sección ────────────────────────────────────────── */}
      <div style={panel}>
        <div style={sectionTitle}>Imágenes de sección</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {imgField('imagenBannerClases',  'Banner página Clases',       'Fondo hero de la página Clases. [BACKEND] → configuracion.imagenBannerClases')}
          {imgField('imagenStryde',        'Imagen disciplina Stryde X', 'Fondo del botón Stryde X en Inicio. [BACKEND] → configuracion.imagenStryde')}
          {imgField('imagenSlow',          'Imagen disciplina Slow',     'Fondo del botón Slow en Inicio. [BACKEND] → configuracion.imagenSlow')}
          {imgField('imagenCoachesBanner', 'Banner coaches',             "Fondo de la sección 'Conoce a nuestro equipo'. [BACKEND] → configuracion.imagenCoachesBanner")}
        </div>
      </div>

      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} canEdit={canEdit} />
    </form>
  )
}

// ── TAB 4: Reservas ───────────────────────────────────────────────────────────
function TabReservas({ cfg, actualizar, canEdit = true }) {
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
    await persistConfiguration({
      actualizar,
      setGuardando,
      successMessage: 'Configuración de reservas guardada',
      payload: { horasCancelacion: horas, maxListaEspera: maxEspera },
    })
  }

  async function handleRestaurar() {
    if (!window.confirm('¿Restaurar la configuración de reservas a los valores predeterminados?')) return
    const keys = ['horasCancelacion', 'maxListaEspera']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    const saved = await persistConfiguration({
      actualizar,
      payload: defaults,
      setGuardando,
      successMessage: 'Reservas restauradas',
    })
    if (saved) setForm(defaults)
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
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} canEdit={canEdit} />
    </form>
  )
}

// ── TAB 5: Estudio ────────────────────────────────────────────────────────────
function TabEstudio({ cfg, actualizar, canEdit = true }) {
  const [form, setForm] = useState({
    nombreEstudio: cfg.get('nombreEstudio'),
    ciudad:        cfg.get('ciudad'),
  })
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar(e) {
    e.preventDefault()
    await persistConfiguration({
      actualizar,
      setGuardando,
      successMessage: 'Información del estudio guardada',
      payload: {
        nombreEstudio: form.nombreEstudio.trim(),
        ciudad: form.ciudad.trim(),
      },
    })
  }

  async function handleRestaurar() {
    if (!window.confirm('¿Restaurar la información del estudio a los valores predeterminados?')) return
    const keys = ['nombreEstudio', 'ciudad']
    const defaults = Object.fromEntries(keys.map(k => [k, CONFIG_DEFAULTS[k]]))
    const saved = await persistConfiguration({
      actualizar,
      payload: defaults,
      setGuardando,
      successMessage: 'Estudio restaurado',
    })
    if (saved) setForm(defaults)
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
      <BotonesGuardar guardando={guardando} onRestaurar={handleRestaurar} canEdit={canEdit} />
    </form>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ConfiguracionSection({ currentUser = null }) {
  const store = useConfiguracionStore()
  const siteConfiguration = useEffectiveSiteConfiguration()
  const updateSiteConfiguration = useUpdateSiteConfigurationMutation()
  const uploadSiteMedia = useUploadSiteConfigurationMediaMutation()
  const [tabActivo, setTabActivo] = useState('contacto')
  const canReadSettings = hasPermission(currentUser, 'settings.read') || !currentUser
  const canUpdateSettings = hasPermission(currentUser, 'settings.update') || !currentUser
  const canReadEmailConfig = hasAnyPermission(currentUser, ['email_config.read', 'email_outbox.read']) || !currentUser
  const canReadRoles = hasPermission(currentUser, 'roles.read') || !currentUser
  const visibleTabs = useMemo(() => TABS.filter((tab) => {
    if (tab.id === 'correo') return canReadEmailConfig
    if (tab.id === 'roles') return canReadRoles
    return canReadSettings
  }), [canReadEmailConfig, canReadRoles, canReadSettings])

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === tabActivo)) return
    setTabActivo(visibleTabs[0]?.id ?? '')
  }, [tabActivo, visibleTabs])

  const actualizarSite = useCallback(async (changes) => {
    if (!canUpdateSettings) {
      const error = new Error('No tienes permisos para modificar la configuración.')
      error.code = 'FORBIDDEN'
      throw error
    }
    if (siteConfiguration.apiMode) {
      return updateSiteConfiguration.mutateAsync(changes)
    }
    store.actualizar(changes)
    return changes
  }, [canUpdateSettings, siteConfiguration.apiMode, store, updateSiteConfiguration])

  const actualizarLegacy = useCallback(async (changes) => {
    if (!canUpdateSettings) {
      const error = new Error('No tienes permisos para modificar la configuración.')
      error.code = 'FORBIDDEN'
      throw error
    }
    store.actualizar(changes)
    return changes
  }, [canUpdateSettings, store])

  const uploadMedia = useCallback(
    (payload) => uploadSiteMedia.mutateAsync(payload),
    [uploadSiteMedia]
  )

  const siteTabActive = ['contacto', 'textos', 'imagenes', 'estudio'].includes(tabActivo)

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
        {visibleTabs.map(t => (
          <button key={t.id} style={tabStyle(t.id)} onClick={() => setTabActivo(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      {siteTabActive && siteConfiguration.apiMode && siteConfiguration.isLoading && (
        <div style={panel}>Cargando configuración del sitio...</div>
      )}
      {siteTabActive && siteConfiguration.apiMode && siteConfiguration.isError && (
        <div style={{ ...panel, borderColor: 'rgba(245,158,11,0.45)', color: 'var(--text-secondary)' }}>
          No se pudo cargar la configuración del backend. Se muestra fallback local temporal; guardar volverá a intentar contra API.
        </div>
      )}
      {(!siteTabActive || !siteConfiguration.apiMode || !siteConfiguration.isLoading) && (
        <>
          {tabActivo === 'contacto' && <TabContacto cfg={siteConfiguration} actualizar={actualizarSite} canEdit={canUpdateSettings} />}
          {tabActivo === 'textos'   && <TabTextos cfg={siteConfiguration} actualizar={actualizarSite} canEdit={canUpdateSettings} />}
          {tabActivo === 'imagenes' && (
            <TabImagenes
              cfg={siteConfiguration}
              actualizar={actualizarSite}
              uploadMedia={uploadMedia}
              apiMode={siteConfiguration.apiMode}
              canEdit={canUpdateSettings}
            />
          )}
          {tabActivo === 'reservas' && <TabReservas cfg={store} actualizar={actualizarLegacy} canEdit={canUpdateSettings} />}
          {tabActivo === 'estudio'  && <TabEstudio cfg={siteConfiguration} actualizar={actualizarSite} canEdit={canUpdateSettings} />}
        </>
      )}
      {tabActivo === 'correo'   && <ConfiguracionCorreoSection />}
      {tabActivo === 'roles'    && <RolesPermissionsSection currentUser={currentUser} />}
    </div>
  )
}
