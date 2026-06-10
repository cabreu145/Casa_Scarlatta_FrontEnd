import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CoachAvatar from './CoachAvatar'

describe('CoachAvatar', () => {
  it('muestra imagen cuando hay avatarUrl', () => {
    render(<CoachAvatar name="Coach Demo" avatarUrl="https://cdn.example.com/coach.jpg" />)

    expect(screen.getByRole('img', { name: 'Coach Demo' })).toBeInTheDocument()
  })

  it('resuelve ruta relativa de media contra backend', () => {
    render(<CoachAvatar name="Coach Demo" avatarUrl="/media/coaches/coach-demo.png" />)

    const image = screen.getByRole('img', { name: 'Coach Demo' })
    const src = image.getAttribute('src') ?? ''
    expect(src).toContain('/media/coaches/coach-demo.png')
    expect(src).toMatch(/^https?:\/\//)
    expect(src).not.toContain('5173/media')
  })

  it('cae a iniciales cuando no hay avatar o la imagen falla', async () => {
    const { rerender } = render(<CoachAvatar name="Coach Demo" />)

    expect(screen.getByText('CD')).toBeInTheDocument()

    rerender(<CoachAvatar name="Coach Demo" avatarUrl="https://cdn.example.com/coach.jpg" />)
    const image = screen.getByRole('img', { name: 'Coach Demo' })
    fireEvent.error(image)

    await waitFor(() => expect(screen.getByText('CD')).toBeInTheDocument())
  })
})
