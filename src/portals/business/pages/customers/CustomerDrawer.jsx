import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea } from '../../../../shared/ui'

const empty = { name: '', email: '', phone: '', address: '', city: '', country: '', note: '', status: 'ACTIVE' }

function fromCustomer(c) {
  return {
    name: c.name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    address: c.address ?? '',
    city: c.city ?? '',
    country: c.country ?? '',
    note: c.note ?? '',
    status: c.status ?? 'ACTIVE',
  }
}

export function CustomerDrawer({ open, onClose, onSave, saving, customer }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)

  useEffect(() => { setForm(customer ? fromCustomer(customer) : empty) }, [customer, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    onSave?.({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      note: form.note.trim() || null,
      status: form.status,
    })
  }

  return (
    <Drawer
      open={open} onClose={onClose}
      title={customer ? t('customers.form.editTitle') : t('customers.form.addTitle')}
      footer={
        <Button className="w-full" onClick={submit} disabled={saving || !form.name.trim()}>
          {saving ? t('customers.form.saving') : customer ? t('customers.form.save') : t('customers.form.create')}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label={t('customers.form.name')} required>
          <Input placeholder={t('customers.form.namePlaceholder')} value={form.name} onChange={set('name')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('customers.form.email')}>
            <Input type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label={t('customers.form.phone')}>
            <Input value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <Field label={t('customers.form.address')}>
          <Input value={form.address} onChange={set('address')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('customers.form.city')}>
            <Input value={form.city} onChange={set('city')} />
          </Field>
          <Field label={t('customers.form.country')}>
            <Input value={form.country} onChange={set('country')} />
          </Field>
        </div>
        <Field label={t('customers.form.note')}>
          <Textarea rows={2} value={form.note} onChange={set('note')} />
        </Field>
        <Field label={t('customers.form.status')}>
          <Select value={form.status} onChange={set('status')}>
            <option value="ACTIVE">{t('common.active')}</option>
            <option value="INACTIVE">{t('common.inactive')}</option>
          </Select>
        </Field>
      </div>
    </Drawer>
  )
}
