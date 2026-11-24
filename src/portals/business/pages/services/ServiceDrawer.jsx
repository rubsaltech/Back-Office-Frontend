import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea } from '../../../../shared/ui'

const empty = { name: '', description: '', price: '', status: 'ACTIVE' }

function fromService(s) {
  return {
    name: s.name ?? '',
    description: s.description ?? '',
    price: s.price ?? '',
    status: s.status ?? 'ACTIVE',
  }
}

export function ServiceDrawer({ open, onClose, onSave, saving, service }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)

  useEffect(() => { setForm(service ? fromService(service) : empty) }, [service, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    onSave?.({
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price === '' ? 0 : Number(form.price),
      status: form.status,
      products: [],
      labels: [],
    })
  }

  return (
    <Drawer
      open={open} onClose={onClose}
      title={service ? t('services.form.editTitle') : t('services.form.addTitle')}
      footer={
        <Button className="w-full" onClick={submit} disabled={saving || !form.name.trim()}>
          {saving ? t('services.form.saving') : service ? t('services.form.save') : t('services.form.create')}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label={t('services.form.name')} required>
          <Input placeholder={t('services.form.namePlaceholder')} value={form.name} onChange={set('name')} />
        </Field>

        <Field label={t('services.form.description')}>
          <Textarea rows={3} value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('services.form.price')} hint={t('services.form.priceHint')}>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
          </Field>
          <Field label={t('services.form.status')}>
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
