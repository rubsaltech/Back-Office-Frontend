import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Field, Input, Textarea, Select } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { Modal, ConfirmDialog, SuccessDialog } from '../../../../shared/Overlay'
import { roles as seedRoles, permissions as seedPermissions } from '../../data/mock'

export default function RolesPage() {
  const [tab, setTab] = useState('roles')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [roles, setRoles] = useState(seedRoles)
  const [permissions, setPermissions] = useState(seedPermissions)
  const [roleModal, setRoleModal] = useState({ open: false, item: null })
  const [permModal, setPermModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState(null)
  const [success, setSuccess] = useState(null)

  const actions = (onEdit, onDelete) => (
    <span className="flex items-center gap-3">
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="text-danger hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
    </span>
  )

  const roleColumns = [
    { key: 'createdAt', header: 'Created at', render: (r) => <span className="text-muted">{r.createdAt}</span> },
    { key: 'type', header: 'Role', render: (r) => <span className="font-medium">{r.type}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-muted">{r.description}</span> },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setRoleModal({ open: true, item: r }), () => setConfirm({ kind: 'role', row: r })) },
  ]
  const permColumns = [
    { key: 'createdAt', header: 'Created at', render: (r) => <span className="text-muted">{r.createdAt}</span> },
    { key: 'canDo', header: 'Can Do', render: (r) => <span className="font-mono text-sm">{r.canDo}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-muted">{r.description}</span> },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setPermModal({ open: true, item: r }), () => setConfirm({ kind: 'permission', row: r })) },
  ]

  const roleRows = roles.filter((r) => r.type.toLowerCase().includes(query.toLowerCase()))
  const permRows = permissions.filter((r) => r.canDo.toLowerCase().includes(query.toLowerCase()))

  const doDelete = () => {
    if (confirm.kind === 'role') {
      setRoles((r) => r.filter((x) => x.id !== confirm.row.id))
      setSuccess('Role deleted successfully')
    } else {
      setPermissions((p) => p.filter((x) => x.id !== confirm.row.id))
      setSuccess('Permission deleted successfully')
    }
  }

  return (
    <div>
      <PageHeader title="Roles & Permissions">
        <Tabs
          tabs={[{ value: 'roles', label: 'Roles' }, { value: 'permissions', label: 'Permissions' }]}
          value={tab}
          onChange={(t) => { setTab(t); setPage(1) }}
        />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search..." className="w-72" />
          {tab === 'roles' ? (
            <Button onClick={() => setRoleModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create New Role</Button>
          ) : (
            <Button onClick={() => setPermModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create New Permission</Button>
          )}
        </div>

        {tab === 'roles'
          ? <DataTable columns={roleColumns} rows={roleRows} rowKey={(r) => r.id} />
          : <DataTable columns={permColumns} rows={permRows} rowKey={(r) => r.id} />}

        <Pagination page={page} pageCount={tab === 'roles' ? 1 : 20} onChange={setPage} />
      </Card>

      <RoleModal
        state={roleModal}
        onClose={() => setRoleModal({ open: false, item: null })}
        onSave={(form) => {
          if (roleModal.item) {
            setRoles((r) => r.map((x) => (x.id === roleModal.item.id ? { ...x, ...form } : x)))
            setSuccess('Role updated successfully')
          } else {
            setRoles((r) => [{ ...form, id: Date.now(), createdAt: '2024-01-27' }, ...r])
            setSuccess('Role created successfully')
          }
          setRoleModal({ open: false, item: null })
        }}
      />
      <PermissionModal
        state={permModal}
        onClose={() => setPermModal({ open: false, item: null })}
        onSave={(form) => {
          if (permModal.item) {
            setPermissions((p) => p.map((x) => (x.id === permModal.item.id ? { ...x, ...form } : x)))
            setSuccess('Permission updated successfully')
          } else {
            setPermissions((p) => [{ ...form, id: Date.now(), createdAt: '2024-01-27' }, ...p])
            setSuccess('Permission created successfully')
          }
          setPermModal({ open: false, item: null })
        }}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title={confirm?.kind === 'role' ? 'Delete Role' : 'Delete Permission'}
        message="Are you sure you want to delete this? This action cannot be undone."
      />
      <SuccessDialog open={!!success} onClose={() => setSuccess(null)} message={success} />
    </div>
  )
}

function RoleModal({ state, onClose, onSave }) {
  const [form, setForm] = useState({ type: '', description: '' })
  const item = state.item
  useEffect(() => {
    if (state.open) setForm(item ? { type: item.type, description: item.description } : { type: '', description: '' })
  }, [state.open, item])
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={item ? 'Edit Role' : 'Create Role'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{item ? 'Save' : 'Create'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Role Type" required>
          <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="">Select type</option>
            <option>Manager</option>
            <option>Clerk</option>
            <option>Kitchen</option>
            <option>Waiter</option>
          </Select>
        </Field>
        <Field label="Description" required>
          <Textarea placeholder="Describe this role" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  )
}

function PermissionModal({ state, onClose, onSave }) {
  const [form, setForm] = useState({ canDo: '', description: '' })
  const item = state.item
  useEffect(() => {
    if (state.open) setForm(item ? { canDo: item.canDo, description: item.description } : { canDo: '', description: '' })
  }, [state.open, item])
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={item ? 'Edit Permission' : 'Create Permission'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{item ? 'Save' : 'Create'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Permission Key" required hint="e.g. product.create, order.void">
          <Input placeholder="resource.action" value={form.canDo} onChange={(e) => setForm((f) => ({ ...f, canDo: e.target.value }))} />
        </Field>
        <Field label="Description" required>
          <Textarea placeholder="What does this permission allow?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  )
}
