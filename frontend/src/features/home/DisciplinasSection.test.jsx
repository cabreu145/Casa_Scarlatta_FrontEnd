import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import DisciplinasSection from './DisciplinasSection'

const configuredImages = {
  imagenStryde: 'https://cdn.example.com/custom-stryde.jpg',
  imagenSlow: 'https://cdn.example.com/custom-slow.jpg',
}
const originalInnerWidth = window.innerWidth

vi.mock('@/hooks/useSiteConfiguration', () => ({
  useEffectiveSiteConfiguration: () => ({
    get: (key) => configuredImages[key],
  }),
}))

vi.mock('@/components/ui/MotionButton', () => ({
  default: ({ label }) => <button type="button">{label}</button>,
}))

describe('DisciplinasSection configurable media', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth })
  })

  test('uses configured Stryde and Slow images in mobile viewport', () => {
    render(
      <MemoryRouter>
        <DisciplinasSection />
      </MemoryRouter>
    )

    expect(screen.getByAltText(/Sala Stride/i)).toHaveAttribute('src', configuredImages.imagenStryde)
    expect(screen.getByAltText(/Sala Slow/i)).toHaveAttribute('src', configuredImages.imagenSlow)
  })
})
