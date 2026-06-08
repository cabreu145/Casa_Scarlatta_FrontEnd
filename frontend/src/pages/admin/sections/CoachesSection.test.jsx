import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import CoachesSection from './CoachesSection'

describe('CoachesSection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renderiza coaches API y dispara callbacks', async () => {
    const user = userEvent.setup()
    const onToggleStatus = vi.fn()
    const onDeleteCoach = vi.fn()
    const setModalEditCoach = vi.fn()
    const setEditCoachForm = vi.fn()
    const setEditFotoPreview = vi.fn()
    const setEditFotoPath = vi.fn()
    const setModalHorarioCoach = vi.fn()
    const setSearch = vi.fn()
    const setStatus = vi.fn()

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <CoachesSection
        coaches={[
          {
            coachId: 1,
            nombre: 'Coach Demo',
            email: 'coach@demo.local',
            phone: '5551234567',
            status: 'active',
            specialties: ['slow', 'stryde'],
            avatarUrl: null,
          },
        ]}
        useApiMode
        isLoading={false}
        error=""
        search=""
        setSearch={setSearch}
        status="Todos"
        setStatus={setStatus}
        openModal={vi.fn()}
        setModalEditCoach={setModalEditCoach}
        setEditCoachForm={setEditCoachForm}
        setEditFotoPreview={setEditFotoPreview}
        setEditFotoPath={setEditFotoPath}
        setModalHorarioCoach={setModalHorarioCoach}
        onToggleStatus={onToggleStatus}
        onDeleteCoach={onDeleteCoach}
      />
    )

    expect(screen.getByText('Coach Demo')).toBeInTheDocument()
    expect(screen.getByText('Ambas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dar de baja' }))
    expect(onToggleStatus).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onDeleteCoach).toHaveBeenCalled()
  })
})
