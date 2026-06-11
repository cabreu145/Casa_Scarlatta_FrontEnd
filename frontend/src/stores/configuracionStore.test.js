import { afterEach, describe, expect, test } from 'vitest'
import { CONFIG_DEFAULTS, useConfiguracionStore } from './configuracionStore'

const initialConfig = { ...CONFIG_DEFAULTS }

afterEach(() => {
  useConfiguracionStore.setState({ config: { ...initialConfig } })
  localStorage.clear()
})

describe('configuracionStore media configuration', () => {
  test('uses carouselHero as canonical field', () => {
    const customSlides = [{ tipo: 'imagen', url: 'https://cdn.example.com/hero-mobile.jpg' }]

    useConfiguracionStore.getState().actualizar({ carouselHero: customSlides })

    expect(useConfiguracionStore.getState().get('carouselHero')).toEqual(customSlides)
    expect(useConfiguracionStore.getState().config.carouselHome).toBeUndefined()
  })

  test('reads and migrates persisted carouselHome legacy field', () => {
    const legacySlides = [{ tipo: 'imagen', url: 'https://cdn.example.com/legacy-hero.jpg' }]
    useConfiguracionStore.setState({ config: { carouselHome: legacySlides } })

    expect(useConfiguracionStore.getState().get('carouselHero')).toEqual(legacySlides)

    useConfiguracionStore.getState().actualizar({ carouselHome: legacySlides })
    expect(useConfiguracionStore.getState().config.carouselHero).toEqual(legacySlides)
    expect(useConfiguracionStore.getState().config.carouselHome).toBeUndefined()
  })
})
