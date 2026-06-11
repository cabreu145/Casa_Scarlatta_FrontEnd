/**
 * configuracionStore.js
 * ─────────────────────────────────────────────────────
 * Store legacy de configuración global del estudio.
 * En API mode, GET/PUT /api/v1/configuracion/site es source of truth.
 * Este store persiste solo fallback legacy y preferencias no cubiertas por
 * el contrato site configuration.
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULTS = {
  // ── Reservas ─────────────────────────────────────────
  // Horas mínimas de anticipación para cancelar una reserva.
  // El cliente NO puede cancelar si faltan menos de estas horas.
  // Default: 6 horas. Rango válido: 1 a 72 horas.
  // [BACKEND] → campo: configuracion.horasCancelacion (integer)
  horasCancelacion: 6,

  // Máximo de usuarios en lista de espera por clase
  // [BACKEND] → campo: configuracion.maxListaEspera (integer)
  maxListaEspera: 10,

  // ── Información del estudio ──────────────────────────
  // Nombre del estudio (aparece en PDFs y reportes)
  // [BACKEND] → campo: configuracion.nombreEstudio (string)
  nombreEstudio: 'Casa Scarlatta',

  // Ciudad del estudio (aparece en PDFs)
  // [BACKEND] → campo: configuracion.ciudad (string)
  ciudad: 'Ciudad de México, México',

  // ── Información de contacto ──────────────────────────
  // [BACKEND] → configuracion.contacto (object)
  telefono:        '+52 (999) 000-0000',
  direccion:       'Calle 00 #00, Col. Centro, Mérida, Yucatán',
  instagram:       'https://www.instagram.com/casa.scarlatta',
  instagramHandle: '@casa.scarlatta',
  whatsapp:        '', // [BACKEND] → número de WhatsApp para botón directo

  // ── Texto de Nosotros ────────────────────────────────
  // [BACKEND] → configuracion.nosotros (object)
  nosotrosTexto1: 'Creemos en el equilibrio entre fluidez y fuerza, entre disciplina y presencia.',
  nosotrosTexto2: 'Arrive. Breathe. Move. Connect. Transform.',

  // ── Carrusel de Nosotros (URLs de imágenes) ──────────
  // [BACKEND] → configuracion.carouselNosotros (string[])
  // Cuando haya backend con storage: cambiar a uploads reales.
  // Por ahora el admin pega URLs externas (Drive, Dropbox, etc.)
  carouselNosotros: [
    '/fotos/team_laughing.jpg',
    '/fotos/team_scene_2.jpg',
    '/fotos/team_scene_3.jpg',
    '/fotos/team_scene_4.jpg',
  ],

  // ── Carrusel hero de Home (URLs o YouTube IDs) ───────
  // [BACKEND] → configuracion.carouselHero (object[])
  // Estructura de cada slide:
  //   { tipo: 'imagen'|'video', url: string, videoId?: string, start?: number }
  // Cuando haya backend con storage: cambiar a uploads reales.
  carouselHero: [
    { tipo: 'video',  url: '',    videoId: 'djp5ZQQ7WXA', start: 14 },
    { tipo: 'imagen', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80' },
    { tipo: 'imagen', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80' },
    { tipo: 'imagen', url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600&q=80' },
    { tipo: 'imagen', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1600&q=80' },
  ],

  // ── Imágenes de secciones ────────────────────────────
  // [BACKEND] → configuracion.imagenes (object)
  // Por ahora el admin pega URLs. Con backend: uploads reales.
  imagenBannerClases:  '/fotos/gym_banner_stryde.jpg',
  imagenStryde:        '/fotos/stride-hero.jpg',
  imagenSlow:          '/fotos/yoga_studio.jpg',
  imagenCoachesBanner: '/fotos/coaches_banner.jpg',
}

export const useConfiguracionStore = create(
  persist(
    (set, get) => ({
      config: { ...DEFAULTS },

      // carouselHome remains readable for persisted legacy configuration.
      get: (key) => {
        const config = get().config
        if (key === 'carouselHero' || key === 'carouselHome') {
          return config.carouselHero ?? config.carouselHome ?? DEFAULTS.carouselHero
        }
        return config[key] ?? DEFAULTS[key]
      },

      // Actualizar uno o varios valores
      // [BACKEND] → PUT /api/configuracion
      actualizar: (cambios) => {
        set(s => {
          const normalized = { ...cambios }
          if ('carouselHome' in normalized && !('carouselHero' in normalized)) {
            normalized.carouselHero = normalized.carouselHome
          }
          delete normalized.carouselHome

          const config = { ...s.config, ...normalized }
          delete config.carouselHome
          return { config }
        })
      },

      // Restaurar todos los valores a los defaults
      // [BACKEND] → PUT /api/configuracion (con DEFAULTS)
      restaurar: () => {
        set({ config: { ...DEFAULTS } })
      },

      // Restaurar un solo campo al default
      restaurarCampo: (key) => {
        set(s => ({
          config: { ...s.config, [key]: DEFAULTS[key] },
        }))
      },
    }),
    { name: 'casa-scarlatta-configuracion' }
  )
)

// Exportar defaults para uso externo
export { DEFAULTS as CONFIG_DEFAULTS }
