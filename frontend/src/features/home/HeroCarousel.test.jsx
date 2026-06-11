import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import HeroCarousel from './HeroCarousel'

const customSlides = [
  { tipo: 'imagen', url: 'https://cdn.example.com/custom-hero.jpg' },
]
const originalInnerWidth = window.innerWidth

vi.mock('@/hooks/useSiteConfiguration', () => ({
  useEffectiveSiteConfiguration: () => ({
    get: (key) => key === 'carouselHero' ? customSlides : undefined,
  }),
}))

describe('HeroCarousel configurable media', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth })
    vi.restoreAllMocks()
  })

  test('uses same configured carousel in mobile viewport', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroCarousel />
      </MemoryRouter>
    )

    const image = container.querySelector('img')
    expect(image).toHaveAttribute('src', customSlides[0].url)
  })
})
