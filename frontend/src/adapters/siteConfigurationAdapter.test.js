import { describe, expect, test } from 'vitest'
import { BASE_URL } from '@/constants/api'
import {
  isVideoMediaUrl,
  mapBackendSiteConfigurationToFrontend,
  toSiteConfigurationPayload,
} from './siteConfigurationAdapter'

describe('siteConfigurationAdapter', () => {
  test('normalizes camelCase response and resolves backend media', () => {
    const result = mapBackendSiteConfigurationToFrontend({
      carouselHero: [
        { type: 'image', src: '/media/site/hero.webp' },
        { type: 'youtube', youtubeId: 'abc123', start: 4 },
      ],
      carouselNosotros: [{ type: 'image', src: '/media/site/team.webp' }],
      imagenStryde: '/media/site/stryde.webp',
      instagramHandle: '@casa',
      updatedAt: '2026-06-11T10:00:00-06:00',
    })

    expect(result.carouselHero[0]).toEqual({
      tipo: 'imagen',
      url: `${BASE_URL}/media/site/hero.webp`,
    })
    expect(result.carouselHero[1]).toMatchObject({
      tipo: 'video',
      videoId: 'abc123',
      start: 4,
    })
    expect(result.carouselNosotros).toEqual([`${BASE_URL}/media/site/team.webp`])
    expect(result.imagenStryde).toBe(`${BASE_URL}/media/site/stryde.webp`)
    expect(result.instagramHandle).toBe('@casa')
  })

  test('normalizes snake_case response', () => {
    const result = mapBackendSiteConfigurationToFrontend({
      carousel_hero: [{ type: 'video', src: 'https://cdn.example.com/hero.mp4' }],
      carousel_nosotros: ['/fotos/team.jpg'],
      imagen_banner_clases: '/fotos/banner.jpg',
      imagen_coaches_banner: '/fotos/coaches.jpg',
      instagram_handle: '@snake',
      nosotros_texto_1: 'Texto uno',
      nosotros_texto_2: 'Texto dos',
      nombre_estudio: 'Casa API',
      updated_at: '2026-06-11',
    })

    expect(result.carouselHero[0]).toEqual({
      tipo: 'videolocal',
      url: 'https://cdn.example.com/hero.mp4',
    })
    expect(result.carouselNosotros).toEqual(['/fotos/team.jpg'])
    expect(result.imagenBannerClases).toBe('/fotos/banner.jpg')
    expect(result.imagenCoachesBanner).toBe('/fotos/coaches.jpg')
    expect(result.nosotrosTexto1).toBe('Texto uno')
    expect(result.nombreEstudio).toBe('Casa API')
  })

  test('builds partial canonical PUT payload and restores media path', () => {
    const result = toSiteConfigurationPayload({
      imagenStryde: `${BASE_URL}/media/site/stryde.webp`,
      carouselHero: [
        { tipo: 'imagen', url: `${BASE_URL}/media/site/hero.webp` },
        { tipo: 'video', videoId: 'youtube-id', start: 8 },
      ],
      carouselNosotros: [`${BASE_URL}/media/site/team.webp`],
    })

    expect(result).toEqual({
      imagenStryde: '/media/site/stryde.webp',
      carouselHero: [
        { type: 'image', src: '/media/site/hero.webp' },
        { type: 'youtube', youtubeId: 'youtube-id', start: 8 },
      ],
      carouselNosotros: [
        { type: 'image', src: '/media/site/team.webp' },
      ],
    })
    expect(result.telefono).toBeUndefined()
  })

  test('detects supported video URLs for Nosotros', () => {
    expect(isVideoMediaUrl('https://cdn.example.com/team.mp4?version=2')).toBe(true)
    expect(isVideoMediaUrl('/media/site/team.webp')).toBe(false)
  })
})
