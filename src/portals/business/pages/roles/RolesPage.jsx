import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Badge, Field, Input, Textarea } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { Modal, ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { cn } from '../../../../lib/cn'
import { apiErrorMessage } from '../../../../lib/apiError'
import {
  useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
  useGetPermissionsQuery, useCreatePermissionMutation, useUpdatePermissionMutation, useDeletePermissionMutation,
} from '../../../../store/api'

const SIZE = 10

export default function RolesPage() {
  const [tab, setTab] = useState('roles')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState(null)
  const [roleModal, setRoleModal] = useState({ open: false, item: null })
  const [permModal, setPermModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState(null)

  const rolesQ = useGetRolesQuery({ query: query || undefined, page, size: SIZE }, { skip: tab !== 'roles' })
  const permsQ = useGetPermissionsQuery({ query: query || undefined, page, size: 15 }, { skip: tab !== 'permissions' })
  const { data: allPerms } = useGetPermissionsQuery({ size: 200 })
  const permissionOptions = allPerms?.content ?? []

  const [createRole] = useCreateRoleMutation()
  const [updateRole] = useUpdateRoleMutation()
  const [deleteRole] = useDeleteRoleMutation()
  const [createPermission] = useCreatePermissionMutation()
  const [updatePermission] = useUpdatePermissionMutation()
  const [deletePermission] = useDeletePermissionMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })
  const changeTab = (t) => { setTab(t); setPage(0); setQuery('') }

  const actions = (onEdit, onDelete) => (
    <span className="flex items-center gap-3">
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>
    </span>
  )

  const roleColumns = [
    { key: 'name', header: 'Role', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-muted">{r.description}</span> },
    { key: 'perms', header: 'Permissions', render: (r) => <Badge tone="info">{r.permissions?.length ?? 0}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setRoleModal({ open: true, item: r }), () => setConfirm({ kind: 'role', row: r })) },
  ]
  const permColumns = [
    { key: 'createdAt', header: 'Created', render: (r) => <span className="text-muted">{(r.createdAt || '').slice(0, 10)}</span> },
    { key: 'key', header: 'Can Do', render: (r) => <span className="font-mono text-sm">{r.key}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-muted">{r.description}</span> },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setPermModal({ open: true, item: r }), () => setConfirm({ kind: 'permission', row: r })) },
  ]

  const doDelete = async () => {
    try {
      if (confirm.kind === 'role') { await deleteRole(confirm.row.id).unwrap(); ok('Role deleted') }
      else { await deletePermission(confirm.row.id).unwrap(); ok('Permission deleted') }
    } catch (e) { fail(e) }
  }

  const active = tab === 'roles' ? rolesQ : permsQ

  return (
    <div>
      <PageHeader title="Roles & Permissions">
        <Tabs tabs={[{ value: 'roles', label: 'Roles' }, { value: 'permissions', label: 'Permissions' }]} value={tab} onChange={changeTab} />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder="Search..." className="w-full sm:w-72" />
          {tab === 'roles'
            ? <Button onClick={() => setRoleModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create New Role</Button>
            : <Button onClick={() => setPermModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create New Permission</Button>}
        </div>

        {active.isLoading ? <Loading /> : active.isError ? <ErrorState error={active.error} /> : (
          <>
            {tab === 'roles'
              ? <DataTable columns={roleColumns} rows={rolesQ.data?.content ?? []} rowKey={(r) => r.id} empty="No roles yet." />
              : <DataTable columns={permColumns} rows={permsQ.data?.content ?? []} rowKey={(r) => r.id} empty="No permissions yet." />}
            {(active.data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={active.data.totalPages} onChange={(p) => setPage(p - 1)} />}
          </>
        )}
      </Card>

      <RoleModal
        state={roleModal} permissions={permissionOptions}
        onClose={() => setRoleModal({ open: false, item: null })}
        onSave={async (body) => {
          try {
            if (roleModal.item) await updateRole({ id: roleModal.item.id, ...body }).unwrap()
            else await createRole(body).unwrap()
            ok(roleModal.item ? 'Role updated' : 'Role created')
            setRoleModal({ open: false, item: null })
          } catch (e) { fail(e) }
        }}
      />
      <PermissionModal
        state={permModal}
        onClose={() => setPermModal({ open: false, item: null })}
        onSave={async (body) => {
          try {
            if (permModal.item) await updatePermission({ id: permModal.item.id, ...body }).unwrap()
            else await createPermission(body).unwrap()
            ok(permModal.item ? 'Permission updated' : 'Permission created')
            setPermModal({ open: false, item: null })
          } catch (e) { fail(e) }
        }}
      />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={confirm?.kind === 'role' ? 'Delete Role' : 'Delete Permission'} message="Are you sure? This cannot be undone." />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function RoleModal({ state, permissions, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] })
  const item = state.item
  useEffect(() => {
    if (state.open) {
      setForm(item
        ? { name: item.name, description: item.description || '', permissionIds: (item.permissions || []).map((p) => p.id) }
        : { name: '', description: '', permissionIds: [] })
    }
  }, [state.open, item])

  const toggle = (id) =>
    setForm((f) => ({ ...f, permissionIds: f.permissionIds.includes(id) ? f.permissionIds.filter((x) => x !== id) : [...f.permissionIds, id] }))

  return (
    <Modal open={state.open} onClose={onClose} title={item ? 'Edit Role' : 'Create Role'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{item ? 'Save' : 'Create'}</Button></>}>
      <div className="space-y-4">
        <Field label="Role Name" required><Input placeholder="e.g. Manager" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Description"><Textarea placeholder="Describe this role" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Permissions ({form.permissionIds.length} selected)</p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-line p-2">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {permissions.map((p) => {
                const on = form.permissionIds.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => toggle(p.id)}
                    className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm', on ? 'bg-brand-50 text-brand-800' : 'hover:bg-canvas')}>
                    <span className={cn('flex h-4 w-4 items-center justify-center rounded border', on ? 'border-brand-700 bg-brand-700 text-white' : 'border-toggle-off')}>
                      {on && '✓'}
                    </span>
                    <span className="font-mono text-xs">{p.key}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function PermissionModal({ state, onClose, onSave }) {
  const [form, setForm] = useState({ key: '', description: '' })
  const item = state.item
  useEffect(() => {
    if (state.open) setForm(item ? { key: item.key, description: item.description || '' } : { key: '', description: '' })
  }, [state.open, item])

  return (
    <Modal open={state.open} onClose={onClose} title={item ? 'Edit Permission' : 'Create Permission'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{item ? 'Save' : 'Create'}</Button></>}>
      <div className="space-y-4">
        <Field label="Permission Key" required hint="e.g. product.create, order.void">
          <Input placeholder="resource.action" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
        </Field>
        <Field label="Description"><Textarea placeholder="What does this allow?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
      </div>
    </Modal>
  )
}
