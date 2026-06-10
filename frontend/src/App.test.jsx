import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
}))

vi.mock('@/components/layout/Navbar', () => ({
  default: () => <div>Navbar Mock</div>,
}))

vi.mock('@/components/layout/Footer', () => ({
  default: () => <div>Footer Mock</div>,
}))

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('@/components/layout/ScrollToTop', () => ({
  default: () => null,
}))

vi.mock('@/components/auth/ProtectedRoute', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('@/features/pagos/PaymentReturnPage', () => ({
  default: () => <div>Payment Return Mock</div>,
}))

describe('App payment routes', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  test.each([
    ['/pago/success?external_reference=ref-1'],
    ['/pago/pending?external_reference=ref-2'],
    ['/pago/failure?external_reference=ref-3'],
  ])('renderiza PaymentReturnPage en %s', async (pathname) => {
    window.history.pushState({}, '', pathname)
    const { default: App } = await import('./App')

    render(<App />)

    expect(await screen.findByText('Payment Return Mock', {}, { timeout: 20000 })).toBeInTheDocument()
  }, 20000)
})
