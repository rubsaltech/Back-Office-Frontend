import { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select } from '../../../../shared/ui'
import { stores, roles } from '../../data/mock'

const empty = {
  name: '',
  email: '',
  store: stores[0].name,
  role: '',
  pin: '',
  password: '',
  status: 'Active',
}

export function EmployeeDrawer({ open, onClose, onSave, employee }) {
  const [form, setForm] = useState(empty)
  useEffect(() => {
    setForm(employee ? { ...empty, ...employee } : empty)
  }, [employee, open])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={employee ? 'Edit Employee' : 'Create New Employee'}
      footer={
        <Button className="w-full" onClick={() => onSave?.(form)}>
          {employee ? 'Save Changes' : 'Create Employee'}
        </Button>
      }
    >
      <div className="space-y-5">
        <button className="relative flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-line bg-canvas text-muted">
          <Camera className="h-6 w-6" />
        </button>

        <Field label="Full Name" required>
          <Input placeholder="Enter name" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email Address" required>
          <Input type="email" placeholder="Enter email" value={form.email} onChange={set('email')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Assigned Store" required>
            <Select value={form.store} onChange={set('store')}>
              {stores.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={set('role')}>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id}>{r.type}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Terminal PIN" required hint="4–6 digit passcode for the cashier terminal">
            <Input inputMode="numeric" maxLength={6} placeholder="••••" value={form.pin} onChange={set('pin')} />
          </Field>
          <Field label="Password" required>
            <Input type="password" placeholder="Create password" value={form.password} onChange={set('password')} />
          </Field>
        </div>

        <Field label="Status" required>
          <Select value={form.status} onChange={set('status')}>
            <option>Active</option>
            <option>Inactive</option>
          </Select>
        </Field>
      </div>
    </Drawer>
  )
}
