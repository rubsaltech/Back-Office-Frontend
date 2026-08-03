import { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select } from '../../../../shared/ui'

const empty = {
  fullName: '', email: '', storeId: '', roleId: '', pin: '', password: '', status: 'ACTIVE',
}

function fromEmployee(e) {
  return {
    ...empty,
    fullName: e.fullName ?? '',
    email: e.email ?? '',
    storeId: e.storeId ?? '',
    roleId: e.roleId ?? '',
    status: e.status ?? 'ACTIVE',
  }
}

export function EmployeeDrawer({ open, onClose, onSave, saving, employee, stores = [], roles = [] }) {
  const [form, setForm] = useState(empty)
  useEffect(() => { setForm(employee ? fromEmployee(employee) : empty) }, [employee, open])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    const payload = {
      fullName: form.fullName,
      email: form.email,
      storeId: form.storeId ? Number(form.storeId) : null,
      roleId: form.roleId ? Number(form.roleId) : null,
      status: form.status,
    }
    if (form.password) payload.password = form.password
    if (form.pin) payload.pin = form.pin
    onSave?.(payload)
  }

  return (
    <Drawer
      open={open} onClose={onClose}
      title={employee ? 'Edit Employee' : 'Create New Employee'}
      footer={<Button className="w-full" onClick={submit} disabled={saving}>{saving ? 'Saving…' : employee ? 'Save Changes' : 'Create Employee'}</Button>}
    >
      <div className="space-y-5">
        <button className="relative flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-line bg-canvas text-muted">
          <Camera className="h-6 w-6" />
        </button>

        <Field label="Full Name" required><Input placeholder="Enter name" value={form.fullName} onChange={set('fullName')} /></Field>
        <Field label="Email Address" required><Input type="email" placeholder="Enter email" value={form.email} onChange={set('email')} /></Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Assigned Store">
            <Select value={form.storeId} onChange={set('storeId')}>
              <option value="">Select store</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Role">
            <Select value={form.roleId} onChange={set('roleId')}>
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={employee ? 'Terminal PIN (blank = keep)' : 'Terminal PIN'} hint="4–6 digit passcode">
            <Input inputMode="numeric" maxLength={6} placeholder="••••" value={form.pin} onChange={set('pin')} />
          </Field>
          <Field label={employee ? 'Password (blank = keep)' : 'Password'} required={!employee}>
            <Input type="password" placeholder="Create password" value={form.password} onChange={set('password')} />
          </Field>
        </div>

        <Field label="Status" required>
          <Select value={form.status} onChange={set('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
      </div>
    </Drawer>
  )
}
