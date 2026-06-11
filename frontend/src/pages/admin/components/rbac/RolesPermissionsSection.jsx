import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  useCreateRbacRoleMutation,
  useDeleteRbacRoleMutation,
  useRbacPermissionsQuery,
  useRbacRoleDetailQuery,
  useRbacRolesQuery,
  useRbacUserPermissionsQuery,
  useRbacUsersQuery,
  useUpdateRbacRoleMutation,
  useUpdateRbacRolePermissionsMutation,
  useUpdateRbacUserPermissionOverridesMutation,
  useUpdateRbacUserRoleMutation,
} from '@/hooks/useApiQueries'
import { hasPermission } from '@/auth/permissions'
import styles from '../../AdminPanel.module.css'
import PermissionMatrix from './PermissionMatrix'
import RoleEditorModal from './RoleEditorModal'
import RolesList from './RolesList'
import UserPermissionsDrawer from './UserPermissionsDrawer'
import UsersRoleTable from './UsersRoleTable'

function getRbacErrorMessage(error) {
  const code = String(error?.code ?? error?.message ?? '').trim()
  if (code === '403') return 'No tienes permisos para esta acción.'
  if (code === 'ROLE_CODE_ALREADY_EXISTS') return 'Ya existe un rol con ese código.'
  if (code === 'ROLE_SYSTEM_PROTECTED') return 'Este rol del sistema está protegido.'
  if (code === 'LAST_ADMIN_PROTECTED') return 'No puedes dejar el sistema sin administrador.'
  if (code === 'PERMISSION_NOT_FOUND') return 'El permiso seleccionado no existe.'
  if (code === 'USER_NOT_FOUND') return 'Usuario no encontrado.'
  if (code === 'ROLE_NOT_FOUND') return 'Rol no encontrado.'
  if (error?.status === 403) return 'No tienes permisos para esta acción.'
  return error?.message ?? 'No se pudo completar la operación.'
}

export default function RolesPermissionsSection({ currentUser = null }) {
  const [view, setView] = useState('roles')
  const [rolesPage, setRolesPage] = useState(1)
  const [rolesSearch, setRolesSearch] = useState('')
  const [rolesStatus, setRolesStatus] = useState('all')
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersRoleFilter, setUsersRoleFilter] = useState('all')
  const [usersStatus, setUsersStatus] = useState('all')
  const [editorState, setEditorState] = useState({ open: false, mode: 'create', roleId: null })
  const [selectedUser, setSelectedUser] = useState(null)

  const canReadRoles = hasPermission(currentUser, 'roles.read')
  const canCreateRoles = hasPermission(currentUser, 'roles.create')
  const canUpdateRoles = hasPermission(currentUser, 'roles.update')
  const canDeleteRoles = hasPermission(currentUser, 'roles.delete')
  const canAssignRolePermissions = hasPermission(currentUser, 'roles.assign_permissions')
  const canAssignUserRole = hasPermission(currentUser, 'users.assign_role')
  const canManageUserOverrides = hasPermission(currentUser, 'users.permission_overrides')

  const permissionsQuery = useRbacPermissionsQuery({ enabled: canReadRoles })
  const rolesQuery = useRbacRolesQuery({
    page: rolesPage,
    pageSize: 20,
    search: rolesSearch,
    status: rolesStatus === 'all' ? undefined : rolesStatus,
    enabled: canReadRoles,
  })
  const roleDetailQuery = useRbacRoleDetailQuery(editorState.roleId, {
    enabled: canReadRoles && editorState.open && Boolean(editorState.roleId),
  })
  const usersQuery = useRbacUsersQuery({
    page: usersPage,
    pageSize: 20,
    search: usersSearch,
    role: usersRoleFilter === 'all' ? undefined : usersRoleFilter,
    status: usersStatus === 'all' ? undefined : usersStatus,
    enabled: canReadRoles,
  })
  const userPermissionsQuery = useRbacUserPermissionsQuery(selectedUser?.id, {
    enabled: canReadRoles && Boolean(selectedUser?.id),
  })

  const createRoleMutation = useCreateRbacRoleMutation()
  const updateRoleMutation = useUpdateRbacRoleMutation()
  const updateRolePermissionsMutation = useUpdateRbacRolePermissionsMutation()
  const deleteRoleMutation = useDeleteRbacRoleMutation()
  const updateUserRoleMutation = useUpdateRbacUserRoleMutation()
  const updateOverridesMutation = useUpdateRbacUserPermissionOverridesMutation()

  const roles = rolesQuery.data?.items ?? []
  const permissions = permissionsQuery.data ?? []
  const rbacUsers = usersQuery.data?.items ?? []
  const editingRole = editorState.roleId
    ? (roleDetailQuery.data ?? roles.find((role) => Number(role.id) === Number(editorState.roleId)) ?? null)
    : null

  const internalTabs = useMemo(() => ([
    { id: 'roles', label: 'Roles' },
    { id: 'users', label: 'Usuarios' },
  ]), [])

  async function handleSaveRole(form) {
    try {
      if (editorState.mode === 'edit' && editorState.roleId) {
        await updateRoleMutation.mutateAsync({ roleId: editorState.roleId, payload: form })
        await updateRolePermissionsMutation.mutateAsync({ roleId: editorState.roleId, permissionKeys: form.permissionKeys ?? [] })
        toast.success('Rol actualizado')
      } else {
        const createdRole = await createRoleMutation.mutateAsync(form)
        if (createdRole?.id) {
          await updateRolePermissionsMutation.mutateAsync({ roleId: createdRole.id, permissionKeys: form.permissionKeys ?? [] })
        }
        toast.success('Rol creado')
      }
      setEditorState({ open: false, mode: 'create', roleId: null })
    } catch (error) {
      toast.error(getRbacErrorMessage(error))
    }
  }

  async function handleToggleRoleActive(role) {
    try {
      if (role.isActive) {
        await deleteRoleMutation.mutateAsync(role.id)
        toast.success('Rol desactivado')
        return
      }
      await updateRoleMutation.mutateAsync({
        roleId: role.id,
        payload: {
          name: role.name,
          description: role.description,
          baseRole: role.baseRole,
          isActive: true,
        },
      })
      toast.success('Rol activado')
    } catch (error) {
      toast.error(getRbacErrorMessage(error))
    }
  }

  async function handleChangeUserRole(user, roleCode) {
    try {
      await updateUserRoleMutation.mutateAsync({ userId: user.id, payload: { roleCode } })
      toast.success('Rol de usuario actualizado')
    } catch (error) {
      toast.error(getRbacErrorMessage(error))
    }
  }

  async function handleSaveOverrides(overrides) {
    if (!selectedUser?.id) return
    try {
      await updateOverridesMutation.mutateAsync({ userId: selectedUser.id, overrides })
      toast.success('Overrides actualizados')
    } catch (error) {
      toast.error(getRbacErrorMessage(error))
    }
  }

  if (!canReadRoles) {
    return (
      <div className={styles.card}>
        <div style={{ padding: 24, color: 'var(--text-muted)' }}>
          No tienes permisos para esta acción.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-primary)' }}>
              Roles y permisos
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Administra accesos por módulo, roles del sistema y permisos directos por usuario.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {internalTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.btn} ${view === tab.id ? styles.btnPrimary : styles.btnGhost}`}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'roles' && (
        <RolesList
          roles={roles}
          isLoading={rolesQuery.isLoading}
          error={rolesQuery.error ? getRbacErrorMessage(rolesQuery.error) : ''}
          page={rolesQuery.data?.page ?? rolesPage}
          total={rolesQuery.data?.total ?? 0}
          pageSize={rolesQuery.data?.pageSize ?? 20}
          search={rolesSearch}
          status={rolesStatus}
          setSearch={setRolesSearch}
          setStatus={setRolesStatus}
          onPageChange={setRolesPage}
          onCreate={() => setEditorState({ open: true, mode: 'create', roleId: null })}
          onEdit={(role) => setEditorState({ open: true, mode: 'edit', roleId: role.id })}
          onToggleActive={handleToggleRoleActive}
          canCreate={canCreateRoles}
          canEdit={canUpdateRoles}
          canAssignPermissions={canAssignRolePermissions}
          canDelete={canDeleteRoles}
        />
      )}

      {view === 'users' && (
        <UsersRoleTable
          users={rbacUsers}
          roles={roles}
          isLoading={usersQuery.isLoading}
          error={usersQuery.error ? getRbacErrorMessage(usersQuery.error) : ''}
          page={usersQuery.data?.page ?? usersPage}
          total={usersQuery.data?.total ?? 0}
          pageSize={usersQuery.data?.pageSize ?? 20}
          search={usersSearch}
          role={usersRoleFilter}
          status={usersStatus}
          setSearch={setUsersSearch}
          setRole={setUsersRoleFilter}
          setStatus={setUsersStatus}
          onPageChange={setUsersPage}
          onChangeRole={handleChangeUserRole}
          onViewPermissions={setSelectedUser}
          canAssignRole={canAssignUserRole}
          canViewPermissions={canReadRoles}
        />
      )}

      <RoleEditorModal
        open={editorState.open}
        mode={editorState.mode}
        role={editingRole}
        permissions={permissions}
        isSaving={createRoleMutation.isPending || updateRoleMutation.isPending || updateRolePermissionsMutation.isPending}
        onClose={() => setEditorState({ open: false, mode: 'create', roleId: null })}
        onSave={handleSaveRole}
      />

      <UserPermissionsDrawer
        open={Boolean(selectedUser)}
        user={selectedUser}
        permissionsDetail={userPermissionsQuery.data}
        permissionsCatalog={permissions}
        isLoading={userPermissionsQuery.isLoading}
        isSaving={updateOverridesMutation.isPending}
        canManage={canManageUserOverrides}
        onClose={() => setSelectedUser(null)}
        onSave={handleSaveOverrides}
      />
    </div>
  )
}
