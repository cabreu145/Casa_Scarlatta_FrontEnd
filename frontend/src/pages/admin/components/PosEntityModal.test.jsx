import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import PosEntityModal from './PosEntityModal'

describe('PosEntityModal', () => {
  test('renderiza title, body y footer', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <PosEntityModal
        title="Nueva categoría"
        ariaLabel="Nueva categoría"
        onClose={onClose}
        footer={(
          <>
            <button type="button">Cancelar</button>
            <button type="button">Guardar</button>
          </>
        )}
      >
        <div>Contenido</div>
      </PosEntityModal>
    )

    expect(screen.getByRole('dialog', { name: 'Nueva categoría' })).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
