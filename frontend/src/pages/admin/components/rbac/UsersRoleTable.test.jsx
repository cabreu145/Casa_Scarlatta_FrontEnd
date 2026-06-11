import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UsersRoleTable from './UsersRoleTable'

describe('UsersRoleTable', () => {
  it('muestra usuarios y permite guardar rol', async () => {
    const user = userEvent.setup()
    const onChangeRole = vi.fn()

    render(
      <UsersRoleTable
        users={[{ id: 7, name: 'Caja Demo', email: 'caja@demo.local', roleName: 'Cajero', roleCode: 'cajero_pos', status: 'active', permissionOverridesCount: 0 }]}
        roles={[
          { id: 1, code: 'cajero_pos', name: 'Cajero POS' },
          { id: 2, code: 'recepcion', name: 'Recepción' },
        ]}
        canAssignRole
        canViewPermissions
        onChangeRole={onChangeRole}
        onViewPermissions={vi.fn()}
      />
    )

    expect(screen.getByText('Caja Demo')).toBeInTheDocument()
    await user.selectOptions(screen.getByDisplayValue('Cajero POS'), 'recepcion')
    await user.click(screen.getByRole('button', { name: 'Guardar rol' }))

    expect(onChangeRole).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 }),
      'recepcion'
    )
  })
})
