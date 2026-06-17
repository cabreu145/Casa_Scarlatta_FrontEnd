import { BASE_URL } from '@/constants/api'
import { CONFIG_DEFAULTS } from '@/stores/configuracionStore'
import {
  createDefaultFooterConfig as createFooterDefaults,
  createDefaultSiteConfiguration as createPageDefaults,
} from '@/constants/siteConfigurationDefaults'

const LEGACY_MEDIA_KEYS = new Set(['url', 'src', 'image', 'logo', 'media', 'secureUrl', 'secure_url'])

const LEGACY_DEFAULTS = normalizeLegacyTopLevelFields(CONFIG_DEFAULTS, CONFIG_DEFAULTS)
const PAGE_DEFAULTS = createPageDefaults()

function valueOf(item, camelKey, snakeKey) {
  return item?.[camelKey] ?? item?.[snakeKey]
}

function mergeValue(baseValue, incomingValue) {
  if (incomingValue === undefined) return baseValue
  if (Array.isArray(baseValue) && Array.isArray(incomingValue)) return incomingValue
  if (isPlainObject(baseValue) && isPlainObject(incomingValue)) {
    return mergeObjects(baseValue, incomingValue)
  }
  return incomingValue
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeObjects(base = {}, incoming = {}) {
  const result = { ...base }
  Object.entries(incoming ?? {}).forEach(([key, value]) => {
    if (value === undefined) return
    result[key] = mergeValue(base?.[key], value)
  })
  return result
}

function normalizeDeepMediaKey(value, key = '') {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDeepMediaKey(item, key))
  }
  if (isPlainObject(value)) {
    const result = {}
    Object.entries(value).forEach(([childKey, childValue]) => {
      result[childKey] = normalizeDeepMediaKey(childValue, childKey)
    })
    return result
  }
  if (typeof value === 'string' && LEGACY_MEDIA_KEYS.has(String(key))) {
    return resolveSiteMediaUrl(value)
  }
  return value
}

function toBackendMediaValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return raw
  if (raw.startsWith(`${BASE_URL}/`)) {
    return raw.slice(BASE_URL.length)
  }
  return raw
}

function normalizeHeroSlide(slide = {}) {
  if (typeof slide === 'string') {
    return { tipo: 'imagen', url: resolveSiteMediaUrl(slide) }
  }

  const rawType = String(slide.type ?? slide.tipo ?? '').toLowerCase()
  const youtubeId =
    slide.youtubeId ??
    slide.youtube_id ??
    slide.videoId ??
    slide.video_id ??
    ''
  const url = resolveSiteMediaUrl(slide.src ?? slide.url ?? slide.secureUrl ?? '')

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
  return resolveSiteMediaUrl(item?.src ?? item?.url ?? item?.secureUrl ?? '')
}

function normalizeSectionMedia(media) {
  if (!media) return media
  if (typeof media === 'string') {
    const type = isVideoMediaUrl(media) ? 'video' : 'image'
    return { type, url: resolveSiteMediaUrl(media), secureUrl: resolveSiteMediaUrl(media), resourceType: type }
  }
  return {
    ...media,
    type: media.type ?? (isVideoMediaUrl(media.url ?? media.secureUrl ?? '') ? 'video' : 'image'),
    url: resolveSiteMediaUrl(media.url ?? media.secureUrl ?? media.src ?? ''),
    secureUrl: resolveSiteMediaUrl(media.secureUrl ?? media.url ?? media.src ?? ''),
  }
}

function normalizeSectionItem(item = {}) {
  if (!isPlainObject(item)) return item
  const normalized = { ...item }
  if ('media' in normalized) normalized.media = normalizeSectionMedia(normalized.media)
  if ('image' in normalized) normalized.image = normalizeSectionMedia(normalized.image)
  if ('logo' in normalized) normalized.logo = normalizeSectionMedia(normalized.logo)
  if (Array.isArray(normalized.items)) normalized.items = normalized.items.map((entry) => normalizeSectionItem(entry))
  if (Array.isArray(normalized.steps)) normalized.steps = normalized.steps.map((entry) => normalizeSectionItem(entry))
  if (Array.isArray(normalized.ctas)) normalized.ctas = normalized.ctas.map((entry) => normalizeSectionItem(entry))
  return normalized
}

function normalizePageConfig(page = {}, defaults = {}) {
  const resolvedHero = {
    ...(defaults.hero ?? {}),
    ...(page.hero ?? {}),
  }
  if (resolvedHero.image !== undefined) resolvedHero.image = normalizeSectionMedia(resolvedHero.image)
  if (resolvedHero.logo !== undefined) resolvedHero.logo = normalizeSectionMedia(resolvedHero.logo)

  const sections = Array.isArray(page.sections)
    ? page.sections.map((section, index) => normalizeSectionItem({
        ...(defaults.sections?.[index] ?? {}),
        ...section,
      }))
    : (defaults.sections ?? []).map((section) => normalizeSectionItem(section))

  const stats = Array.isArray(page.stats)
    ? page.stats.map((stat, index) => ({ ...(defaults.stats?.[index] ?? {}), ...stat }))
    : (defaults.stats ?? []).map((stat) => ({ ...stat }))

  return {
    ...(defaults ?? {}),
    ...page,
    hero: resolvedHero,
    stats,
    sections,
  }
}

function normalizeFooterConfig(footer = {}) {
  const defaults = createFooterDefaults()
  const resolved = mergeObjects(defaults, footer)
  if (resolved.brand?.logo !== undefined) {
    resolved.brand = {
      ...(defaults.brand ?? {}),
      ...(footer.brand ?? {}),
      logo: normalizeSectionMedia(resolved.brand?.logo ?? defaults.brand?.logo),
    }
  }
  if (Array.isArray(footer.scheduleRows)) {
    resolved.scheduleRows = footer.scheduleRows.map((row, index) => ({ ...(defaults.scheduleRows?.[index] ?? {}), ...row }))
  }
  if (footer.links) {
    resolved.links = {
      ...(defaults.links ?? {}),
      ...(Array.isArray(footer.links.studio) && footer.links.studio.length > 0 ? { studio: footer.links.studio } : {}),
      ...(Array.isArray(footer.links.visit) && footer.links.visit.length > 0 ? { visit: footer.links.visit } : {}),
    }
  }
  if (footer.social) {
    resolved.social = {
      ...(defaults.social ?? {}),
      ...footer.social,
    }
  }
  if (footer.contact) {
    resolved.contact = {
      ...(defaults.contact ?? {}),
      ...footer.contact,
    }
  }
  return resolved
}

function normalizeLegacyTopLevelFields(item = {}, fallback = CONFIG_DEFAULTS) {
  return {
    carouselHero: Array.isArray(valueOf(item, 'carouselHero', 'carousel_hero'))
      ? valueOf(item, 'carouselHero', 'carousel_hero').map(normalizeHeroSlide)
      : fallback.carouselHero,
    carouselNosotros: Array.isArray(valueOf(item, 'carouselNosotros', 'carousel_nosotros'))
      ? valueOf(item, 'carouselNosotros', 'carousel_nosotros').map(normalizeNosotrosItem).filter(Boolean)
      : fallback.carouselNosotros,
    imagenBannerClases: resolveSiteMediaUrl(valueOf(item, 'imagenBannerClases', 'imagen_banner_clases'))
      || fallback.imagenBannerClases,
    imagenStryde: resolveSiteMediaUrl(valueOf(item, 'imagenStryde', 'imagen_stryde'))
      || fallback.imagenStryde,
    imagenSlow: resolveSiteMediaUrl(valueOf(item, 'imagenSlow', 'imagen_slow'))
      || fallback.imagenSlow,
    imagenCoachesBanner: resolveSiteMediaUrl(valueOf(item, 'imagenCoachesBanner', 'imagen_coaches_banner'))
      || fallback.imagenCoachesBanner,
    telefono: item.telefono ?? fallback.telefono,
    instagramHandle: valueOf(item, 'instagramHandle', 'instagram_handle') ?? fallback.instagramHandle,
    instagram: item.instagram ?? fallback.instagram,
    whatsapp: item.whatsapp ?? fallback.whatsapp,
    direccion: item.direccion ?? fallback.direccion,
    nosotrosTexto1: valueOf(item, 'nosotrosTexto1', 'nosotros_texto_1') ?? fallback.nosotrosTexto1,
    nosotrosTexto2: valueOf(item, 'nosotrosTexto2', 'nosotros_texto_2') ?? fallback.nosotrosTexto2,
    nosotrosReglamento: valueOf(item, 'nosotrosReglamento', 'nosotros_reglamento') ?? fallback.nosotrosReglamento ?? '',
    nombreEstudio: valueOf(item, 'nombreEstudio', 'nombre_estudio') ?? fallback.nombreEstudio,
    ciudad: item.ciudad ?? fallback.ciudad,
    updatedAt: valueOf(item, 'updatedAt', 'updated_at') ?? fallback.updatedAt,
  }
}

function buildDefaultSiteConfiguration() {
  return mergeObjects(LEGACY_DEFAULTS, {
    pages: PAGE_DEFAULTS.pages,
    footer: PAGE_DEFAULTS.footer,
  })
}

const DEFAULT_SITE_CONFIGURATION = buildDefaultSiteConfiguration()

export const EMPTY_SITE_CONFIGURATION = DEFAULT_SITE_CONFIGURATION

export function resolveSiteMediaUrl(value) {
  if (!value) return ''
  if (typeof value === 'object') {
    return resolveSiteMediaUrl(value.secureUrl ?? value.url ?? value.src ?? '')
  }
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/media/') || raw.startsWith('/fotos/')) return `${BASE_URL}${raw}`
  if (raw.startsWith('media/') || raw.startsWith('fotos/')) return `${BASE_URL}/${raw}`
  return raw
}

export function isVideoMediaUrl(value) {
  return /\.(mp4|webm|ogg)(?:$|[?#])/i.test(String(resolveSiteMediaUrl(value) ?? '').trim())
}

export function createDefaultSuetConfig() {
  return createPageDefaults().pages.suet
}

export function createDefaultFlowConfig() {
  return createPageDefaults().pages.flow
}

export function createDefaultYogaConfig() {
  return createPageDefaults().pages.yoga
}

export function createDefaultFooterConfig() {
  return createFooterDefaults()
}

export function getPublicPageConfig(siteConfig = {}, pageKey) {
  const defaultsByPage = {
    suet: createDefaultSuetConfig(),
    flow: createDefaultFlowConfig(),
    yoga: createDefaultYogaConfig(),
  }
  const page = siteConfig?.pages?.[pageKey] ?? {}
  const defaults = defaultsByPage[pageKey] ?? {}
  return normalizePageConfig(page, defaults)
}

export function getFooterConfig(siteConfig = {}) {
  return normalizeFooterConfig(siteConfig?.footer ?? {})
}

export function mapBackendSiteConfigurationToFrontend(item = {}) {
  const normalized = {
    ...normalizeLegacyTopLevelFields(item),
    pages: {
      suet: normalizePageConfig(item?.pages?.suet ?? {}, createDefaultSuetConfig()),
      flow: normalizePageConfig(item?.pages?.flow ?? {}, createDefaultFlowConfig()),
      yoga: normalizePageConfig(item?.pages?.yoga ?? {}, createDefaultYogaConfig()),
      ...(item?.pages?.terminos !== undefined ? { terminos: item.pages.terminos } : {}),
    },
    footer: normalizeFooterConfig(item?.footer ?? {}),
  }

  return mergeObjects(DEFAULT_SITE_CONFIGURATION, normalizeDeepMediaKey(normalized))
}

function normalizePayloadValue(value, key = '') {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizePayloadValue(entry, key))
  }
  if (isPlainObject(value)) {
    const result = {}
    Object.entries(value).forEach(([childKey, childValue]) => {
      if (childValue === undefined) return
      result[childKey] = normalizePayloadValue(childValue, childKey)
    })
    return result
  }
  if (typeof value === 'string' && LEGACY_MEDIA_KEYS.has(String(key))) {
    return toBackendMediaValue(value)
  }
  return value
}

export function toSiteConfigurationPayload(config = {}) {
  return normalizePayloadValue(config)
}
