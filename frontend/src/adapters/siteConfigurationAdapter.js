import { BASE_URL } from '@/constants/api'

const SITE_CONFIGURATION_FIELDS = [
  'carouselHero',
  'carouselNosotros',
  'imagenBannerClases',
  'imagenStryde',
  'imagenSlow',
  'imagenCoachesBanner',
  'telefono',
  'instagramHandle',
  'instagram',
  'whatsapp',
  'direccion',
  'nosotrosTexto1',
  'nosotrosTexto2',
  'nombreEstudio',
  'ciudad',
]

export const EMPTY_SITE_CONFIGURATION = {
  carouselHero: [],
  carouselNosotros: [],
  imagenBannerClases: '',
  imagenStryde: '',
  imagenSlow: '',
  imagenCoachesBanner: '',
  telefono: '',
  instagramHandle: '',
  instagram: '',
  whatsapp: '',
  direccion: '',
  nosotrosTexto1: '',
  nosotrosTexto2: '',
  nombreEstudio: '',
  ciudad: '',
  updatedAt: null,
}

function valueOf(item, camelKey, snakeKey) {
  return item?.[camelKey] ?? item?.[snakeKey]
}

export function resolveSiteMediaUrl(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/media/')) return `${BASE_URL}${raw}`
  return raw
}

export function isVideoMediaUrl(value) {
  return /\.(mp4|webm|ogg)(?:$|[?#])/i.test(String(value ?? '').trim())
}

function toBackendMediaValue(value) {
  const raw = String(value ?? '').trim()
  if (raw.startsWith(`${BASE_URL}/media/`)) return raw.slice(BASE_URL.length)
  return raw
}

function normalizeHeroSlide(slide = {}) {
  if (typeof slide === 'string') {
    return { tipo: 'imagen', url: resolveSiteMediaUrl(slide) }
  }

  const rawType = String(slide.type ?? slide.tipo ?? '').toLowerCase()
  const youtubeId = slide.youtubeId ?? slide.youtube_id ?? slide.videoId ?? slide.video_id ?? ''
  const url = resolveSiteMediaUrl(slide.src ?? slide.url ?? '')

  if (rawType === 'youtube' || (rawType === 'video' && youtubeId)) {
    return {
      tipo: 'video',
      url: '',
      videoId: youtubeId,
      start: Number(slide.start ?? 0) || 0,
    }
  }

  if (rawType === 'video' || rawType === 'videolocal') {
    return { tipo: 'videolocal', url }
  }

  return { tipo: 'imagen', url }
}

function normalizeNosotrosItem(item) {
  if (typeof item === 'string') return resolveSiteMediaUrl(item)
  return resolveSiteMediaUrl(item?.src ?? item?.url ?? '')
}

export function mapBackendSiteConfigurationToFrontend(item = {}) {
  return {
    carouselHero: Array.isArray(valueOf(item, 'carouselHero', 'carousel_hero'))
      ? valueOf(item, 'carouselHero', 'carousel_hero').map(normalizeHeroSlide)
      : [],
    carouselNosotros: Array.isArray(valueOf(item, 'carouselNosotros', 'carousel_nosotros'))
      ? valueOf(item, 'carouselNosotros', 'carousel_nosotros').map(normalizeNosotrosItem).filter(Boolean)
      : [],
    imagenBannerClases: resolveSiteMediaUrl(valueOf(item, 'imagenBannerClases', 'imagen_banner_clases')),
    imagenStryde: resolveSiteMediaUrl(valueOf(item, 'imagenStryde', 'imagen_stryde')),
    imagenSlow: resolveSiteMediaUrl(valueOf(item, 'imagenSlow', 'imagen_slow')),
    imagenCoachesBanner: resolveSiteMediaUrl(valueOf(item, 'imagenCoachesBanner', 'imagen_coaches_banner')),
    telefono: item.telefono ?? '',
    instagramHandle: valueOf(item, 'instagramHandle', 'instagram_handle') ?? '',
    instagram: item.instagram ?? '',
    whatsapp: item.whatsapp ?? '',
    direccion: item.direccion ?? '',
    nosotrosTexto1: valueOf(item, 'nosotrosTexto1', 'nosotros_texto_1') ?? '',
    nosotrosTexto2: valueOf(item, 'nosotrosTexto2', 'nosotros_texto_2') ?? '',
    nombreEstudio: valueOf(item, 'nombreEstudio', 'nombre_estudio') ?? '',
    ciudad: item.ciudad ?? '',
    updatedAt: valueOf(item, 'updatedAt', 'updated_at') ?? null,
  }
}

function mapHeroSlideToPayload(slide = {}) {
  if (typeof slide === 'string') return { type: 'image', src: slide }

  const legacyType = String(slide.tipo ?? '').toLowerCase()
  const canonicalType = String(slide.type ?? '').toLowerCase()
  const youtubeId = slide.youtubeId ?? slide.youtube_id ?? slide.videoId ?? slide.video_id ?? ''
  const src = toBackendMediaValue(slide.src ?? slide.url ?? '')

  if (canonicalType === 'youtube' || legacyType === 'video' || youtubeId) {
    return {
      type: 'youtube',
      youtubeId,
      start: Number(slide.start ?? 0) || 0,
    }
  }
  if (canonicalType === 'video' || legacyType === 'videolocal') {
    return { type: 'video', src }
  }
  return { type: 'image', src }
}

function mapNosotrosItemToPayload(item) {
  if (typeof item === 'string') {
    const type = isVideoMediaUrl(item) ? 'video' : 'image'
    return { type, src: toBackendMediaValue(item) }
  }
  return {
    type: String(item?.type ?? item?.tipo ?? 'image').toLowerCase() === 'video' ? 'video' : 'image',
    src: toBackendMediaValue(item?.src ?? item?.url ?? ''),
  }
}

export function toSiteConfigurationPayload(config = {}) {
  const payload = {}

  SITE_CONFIGURATION_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(config, field)) return
    if (field === 'carouselHero') {
      payload.carouselHero = Array.isArray(config.carouselHero)
        ? config.carouselHero.map(mapHeroSlideToPayload)
        : []
      return
    }
    if (field === 'carouselNosotros') {
      payload.carouselNosotros = Array.isArray(config.carouselNosotros)
        ? config.carouselNosotros.map(mapNosotrosItemToPayload)
        : []
      return
    }
    payload[field] = field.startsWith('imagen')
      ? toBackendMediaValue(config[field])
      : config[field]
  })

  return payload
}
