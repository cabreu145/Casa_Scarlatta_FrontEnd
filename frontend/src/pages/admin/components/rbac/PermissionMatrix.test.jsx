import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PermissionMatrix from './PermissionMatrix'

describe('PermissionMatrix', () => {
  it('agrupa por modulo y notifica cambios', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <PermissionMatrix
        permissions={[
          { key: 'roles.read', module: 'roles', label: 'Ver roles', description: 'Lectura' },
          { key: 'roles.update', module: 'roles', label: 'Editar roles', description: 'Edición' },
          { key: 'finance.read', module: 'finance', label: 'Ver finanzas', description: 'Lectura' },
        ]}
        selectedKeys={['roles.read']}
        onChange={onChange}
      />
    )

    expect(screen.getByText('roles')).toBeInTheDocument()
    expect(screen.getByText('finance')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/Editar roles/i))
    expect(onChange).toHaveBeenCalled()
  })
})
