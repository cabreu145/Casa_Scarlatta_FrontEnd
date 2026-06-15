import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { isVideoMediaUrl, resolveSiteMediaUrl } from '@/adapters/siteConfigurationAdapter'
import styles from '@/pages/admin/AdminPanel.module.css'

function inferType(value) {
  if (!value) return 'image'
  if (typeof value === 'string') return isVideoMediaUrl(value) ? 'video' : 'image'
  return value.type ?? value.tipo ?? (isVideoMediaUrl(value.url ?? value.secureUrl ?? value.src ?? '') ? 'video' : 'image')
}

function normalizeValue(value, fallbackType = 'image') {
  if (!value) {
    return {
      type: fallbackType,
      url: '',
      secureUrl: '',
      alt: '',
      youtubeId: '',
      publicId: '',
      resourceType: fallbackType,
    }
  }

  if (typeof value === 'string') {
    return {
      type: inferType(value),
      url: value,
      secureUrl: value,
      alt: '',
      youtubeId: '',
      publicId: '',
      resourceType: inferType(value),
    }
  }

  return {
    type: inferType(value),
    url: value.url ?? value.secureUrl ?? value.src ?? '',
    secureUrl: value.secureUrl ?? value.url ?? value.src ?? '',
    alt: value.alt ?? '',
    youtubeId: value.youtubeId ?? value.youtube_id ?? value.videoId ?? value.video_id ?? '',
    publicId: value.publicId ?? value.public_id ?? '',
    resourceType: value.resourceType ?? value.resource_type ?? inferType(value),
    width: value.width ?? null,
    height: value.height ?? null,
    duration: value.duration ?? null,
    format: value.format ?? '',
  }
}

function toYoutubeId(raw = '') {
  const text = String(raw ?? '').trim()
  if (!text) return ''
  const match = text.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)
  return match?.[1] ?? text
}

export default function MediaPicker({
  value,
  onChange,
  onUploadFile,
  allowedTypes = ['image'],
  label,
  hint,
  canEdit = true,
  field,
  folder = 'site',
  publicIdPrefix = 'site',
  context = 'site_configuration',
}) {
  const inputRef = useRef(null)
  const current = useMemo(() => normalizeValue(value, allowedTypes[0] ?? 'image'), [value, allowedTypes])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const setCurrent = (next) => {
    onChange?.(next)
  }

  const handleTypeChange = (nextType) => {
    if (nextType === current.type) return
    if (nextType === 'youtube') {
      setCurrent({
        type: 'youtube',
        youtubeId: current.youtubeId ?? '',
        url: '',
        secureUrl: '',
        alt: current.alt ?? '',
      })
      return
    }
    setCurrent({
      type: nextType,
      url: current.url ?? current.secureUrl ?? '',
      secureUrl: current.secureUrl ?? current.url ?? '',
      alt: current.alt ?? '',
      publicId: current.publicId ?? '',
      resourceType: nextType,
    })
  }

  const handleFileUpload = async (file) => {
    if (!file || !onUploadFile) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await onUploadFile({
        file,
        field,
        folder,
        publicIdPrefix,
        context,
        resourceType: current.type === 'video' ? 'video' : 'image',
        alt: current.alt ?? '',
      })
      if (uploaded?.url || uploaded?.secureUrl) {
        setCurrent({
          ...current,
          ...uploaded,
          type: uploaded?.type ?? (current.type === 'video' ? 'video' : 'image'),
          url: uploaded?.url ?? uploaded?.secureUrl ?? '',
          secureUrl: uploaded?.secureUrl ?? uploaded?.url ?? '',
        })
      }
    } catch (uploadError) {
      setError(uploadError?.message ?? 'No se pudo subir media.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const accept = useMemo(() => {
    const list = []
    if (allowedTypes.includes('image')) list.push('image/*')
    if (allowedTypes.includes('video')) list.push('video/*')
    return list.join(',')
  }, [allowedTypes])

  const previewUrl = resolveSiteMediaUrl(current.url || current.secureUrl)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>}

      {allowedTypes.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allowedTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={styles.btn}
              style={{
                border: current.type === type ? '1px solid #7B1E22' : '1px solid var(--muted-2)',
                background: current.type === type ? 'rgba(123,30,34,0.12)' : 'transparent',
                color: current.type === type ? '#fff' : 'var(--text-muted)',
                padding: '6px 12px',
              }}
              onClick={() => handleTypeChange(type)}
              disabled={!canEdit}
            >
              {type === 'image' ? 'Imagen' : type === 'video' ? 'Video' : 'YouTube'}
            </button>
          ))}
        </div>
      )}

      {(current.type === 'image' || current.type === 'video') && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
            <input
              className={styles.formInput}
              value={current.url ?? current.secureUrl ?? ''}
              onChange={(event) => setCurrent({ ...current, url: event.target.value, secureUrl: event.target.value })}
              placeholder={current.type === 'video' ? 'URL de video' : 'URL de imagen'}
              disabled={!canEdit}
            />
            <label
              className={styles.btn}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.6,
                padding: '8px 12px',
              }}
            >
              <Upload size={14} />
              Subir
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                style={{ display: 'none' }}
                disabled={!canEdit || uploading}
                onChange={(event) => handleFileUpload(event.target.files?.[0])}
              />
            </label>
          </div>
          <input
            className={styles.formInput}
            value={current.alt ?? ''}
            onChange={(event) => setCurrent({ ...current, alt: event.target.value })}
            placeholder="Texto alternativo"
            disabled={!canEdit}
          />
        </>
      )}

      {current.type === 'youtube' && (
        <input
          className={styles.formInput}
          value={current.youtubeId ?? ''}
          onChange={(event) => setCurrent({ ...current, youtubeId: toYoutubeId(event.target.value) })}
          placeholder="ID o URL de YouTube"
          disabled={!canEdit}
        />
      )}

      {previewUrl && current.type !== 'youtube' && (
        <img
          src={previewUrl}
          alt={current.alt || label || 'preview'}
          style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--muted-2)' }}
        />
      )}

      {current.type === 'youtube' && current.youtubeId && (
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          YouTube ID: <strong>{current.youtubeId}</strong>
        </div>
      )}

      {hint && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{hint}</div>}
      {uploading && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Subiendo…</div>}
      {error && <div style={{ fontSize: 12, color: '#fca5a5' }}>{error}</div>}
    </div>
  )
}

export { normalizeValue as normalizeMediaValue }
