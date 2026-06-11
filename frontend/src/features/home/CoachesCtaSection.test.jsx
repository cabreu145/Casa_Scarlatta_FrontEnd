import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import CoachesCtaSection from './CoachesCtaSection'

const coachBanner = 'https://cdn.example.com/custom-coaches.jpg'
const originalInnerWidth = window.innerWidth

vi.mock('@/hooks/useSiteConfiguration', () => ({
  useEffectiveSiteConfiguration: () => ({
    get: (key) => key === 'imagenCoachesBanner' ? coachBanner : undefined,
  }),
}))

vi.mock('@/components/ui/MotionButton', () => ({
  default: ({ label }) => <button type="button">{label}</button>,
}))

describe('CoachesCtaSection configurable media', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 414 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth })
  })

  test('uses configured coach banner in mobile viewport', () => {
    render(
      <MemoryRouter>
        <CoachesCtaSection />
      </MemoryRouter>
    )

    expect(screen.getByAltText('Equipo de instructores Casa Scarlatta')).toHaveAttribute('src', coachBanner)
  })
})
