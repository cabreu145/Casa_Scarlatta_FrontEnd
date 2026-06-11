import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Contacto from './Contacto'

const backendConfig = {
  telefono: '+52 999 111 2233',
  instagramHandle: '@backend.site',
  instagram: 'https://instagram.com/backend.site',
  whatsapp: '529991112233',
  direccion: 'Mérida, Yucatán',
}

vi.mock('@/hooks/useSiteConfiguration', () => ({
  useEffectiveSiteConfiguration: () => ({
    get: (key) => backendConfig[key] ?? '',
  }),
}))

describe('Contacto site configuration', () => {
  test('uses contact values from effective backend configuration', () => {
    render(<Contacto />)

    expect(screen.getByText('@backend.site')).toBeInTheDocument()
    expect(screen.getByText('+52 999 111 2233')).toBeInTheDocument()
    expect(screen.getByText('Mérida, Yucatán')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /backend.site/i })).toHaveAttribute(
      'href',
      'https://instagram.com/backend.site'
    )
  })
})
