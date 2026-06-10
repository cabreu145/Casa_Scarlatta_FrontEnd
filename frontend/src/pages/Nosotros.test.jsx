import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import Nosotros from './Nosotros'

const getPublicCoachesApi = vi.fn()

vi.mock('@/services/coachesApiService', () => ({
  getPublicCoachesApi: (...args) => getPublicCoachesApi(...args),
}))

vi.mock('@/stores/coachesStore', () => ({
  useCoachesStore: () => ({ coaches: [] }),
}))

vi.mock('@/stores/configuracionStore', () => ({
  useConfiguracionStore: () => ({
    get: (key) => {
      if (key === 'carouselNosotros') return ['https://example.com/1.jpg']
      if (key === 'nosotrosTexto1') return 'Casa Scarlatta'
      if (key === 'nosotrosTexto2') return 'Texto'
      return ''
    },
  }),
}))

describe('Nosotros coaches públicos', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_API_CLASSES', 'true')
    getPublicCoachesApi.mockResolvedValue([
      {
        coach_id: 1,
        name: 'Coach Demo',
        specialties: ['slow'],
        primary_discipline: 'slow',
        bio: 'Bio pública',
        instagram: '@coachdemo',
        avatar_url: 'https://cdn.example.com/coach.jpg',
      },
    ])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  test('renderiza coaches desde API pública sin email ni phone', async () => {
    render(<Nosotros />)

    expect(getPublicCoachesApi).toHaveBeenCalled()
    expect(await screen.findByText('Coach Demo')).toBeInTheDocument()
    expect(screen.getByText('Bio pública')).toBeInTheDocument()
    expect(screen.getByAltText('Coach Demo')).toBeInTheDocument()
    expect(screen.queryByText('coach@demo.local')).not.toBeInTheDocument()
    expect(screen.queryByText('5551234567')).not.toBeInTheDocument()
  })
})
