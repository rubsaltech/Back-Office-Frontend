import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Store as StoreIcon } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select } from '../../../../shared/ui'
import { cn } from '../../../../lib/cn'

const empty = {
  fullName: '', email: '', storeIds: [], roleId: '', pin: '', password: '', status: 'ACTIVE',
}

function fromEmployee(e) {
  return {
    ...empty,
    fullName: e.fullName ?? '',
    email: e.email ?? '',
    storeIds: (e.stores ?? []).map((s) => s.id),
    roleId: e.roleId ?? '',
    status: e.status ?? 'ACTIVE',
  }
}

function SectionLabel({ children }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>
}

export function EmployeeDrawer({ open, onClose, onSave, saving, employee, stores = [], roles = [] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  useEffect(() => { setForm(employee ? fromEmployee(employee) : empty) }, [employee, open])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleStore = (id) =>
    setForm((f) => ({
      ...f,
      storeIds: f.storeIds.includes(id) ? f.storeIds.filter((x) => x !== id) : [...f.storeIds, id],
    }))

  // A password is mandatory on create (so the employee can log in), optional on edit.
  const canSave = form.fullName.trim() && form.email.trim()
    && form.storeIds.length > 0 && (employee || form.password.trim())

  const submit = () => {
    if (!canSave) return
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      storeIds: form.storeIds.map(Number),
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
      title={employee ? t('employees.form.editTitle') : t('employees.form.createTitle')}
      footer={
        <Button className="w-full" onClick={submit} disabled={saving || !canSave}>
          {saving ? t('employees.form.saving') : employee ? t('employees.form.save') : t('employees.form.create')}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* ---- Details ---- */}
        <div>
          <SectionLabel>{t('employees.form.sectionDetails')}</SectionLabel>
          <div className="flex items-center gap-4">
            <button className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-line bg-canvas text-muted">
              <Camera className="h-5 w-5" />
            </button>
            <div className="flex-1 space-y-3">
              <Field label={t('employees.form.fullName')} required>
                <Input placeholder={t('employees.form.namePlaceholder')} value={form.fullName} onChange={set('fullName')} />
              </Field>
            </div>
          </div>
          <Field label={t('employees.form.email')} required hint={t('employees.form.emailHint')} className="mt-3">
            <Input type="email" placeholder={t('employees.form.emailPlaceholder')} value={form.email} onChange={set('email')} />
          </Field>
        </div>

        {/* ---- Access ---- */}
        <div className="border-t border-line pt-5">
          <SectionLabel>{t('employees.form.sectionAccess')}</SectionLabel>
          <p className="mb-1 text-sm font-medium text-ink"><span className="text-danger">*</span>{t('employees.form.stores')}</p>
          <p className="mb-2 text-xs text-muted">{t('employees.form.storesHint')}</p>
          {stores.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">{t('employees.form.noStores')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stores.map((s) => {
                const active = form.storeIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStore(s.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      active ? 'border-brand-700 bg-brand-700 text-white' : 'border-line text-ink hover:bg-canvas',
                    )}
                  >
                    <StoreIcon className="h-3.5 w-3.5" /> {s.name}
                  </button>
                )
              })}
            </div>
          )}

          <Field label={t('employees.form.role')} hint={t('employees.form.roleHint')} className="mt-4">
            <Select value={form.roleId} onChange={set('roleId')}>
              <option value="">{t('employees.form.selectRole')}</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
        </div>

        {/* ---- Security ---- */}
        <div className="border-t border-line pt-5">
          <SectionLabel>{t('employees.form.sectionSecurity')}</SectionLabel>
          <Field
            label={employee ? t('employees.form.passwordKeep') : t('employees.form.password')}
            required={!employee}
            hint={employee ? undefined : t('employees.form.passwordHint')}
          >
            <Input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </Field>
          <Field
            label={employee ? t('employees.form.pinKeep') : t('employees.form.pin')}
            hint={t('employees.form.pinHint')}
            className="mt-3"
          >
            <Input inputMode="numeric" maxLength={6} placeholder="••••" value={form.pin} onChange={set('pin')} />
          </Field>
        </div>

        {/* ---- Status ---- */}
        <div className="border-t border-line pt-5">
          <Field label={t('employees.form.status')} required>
            <Select value={form.status} onChange={set('status')}>
              <option value="ACTIVE">{t('common.active')}</option>
              <option value="INACTIVE">{t('common.inactive')}</option>
            </Select>
          </Field>
        </div>
      </div>
    </Drawer>
  )
}
