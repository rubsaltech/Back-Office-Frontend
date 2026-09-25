import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PosModal } from './PosOverlay'
import { Button, Field, Input } from '../../../../shared/ui'

export function CustomerModal({ open, onClose, onContinue }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', phone: '', address: '', guests: 1 })
  useEffect(() => { if (open) setForm({ name: '', phone: '', address: '', guests: 1 }) }, [open])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim() && form.address.trim()

  return (
    <PosModal
      open={open}
      onClose={onClose}
      title={t('pos.customer.title')}
      footer={
        <Button disabled={!valid} onClick={() => onContinue(form)}>
          {t('pos.customer.continue')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('pos.customer.name')} required>
          <Input placeholder={t('pos.customer.namePlaceholder')} value={form.name} onChange={set('name')} />
        </Field>
        <Field label={t('pos.customer.phone')}>
          <Input placeholder="+92 3xx xxxxxxx" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label={t('pos.customer.address')} required className="sm:col-span-2">
          <Input placeholder={t('pos.customer.addressPlaceholder')} value={form.address} onChange={set('address')} />
        </Field>
      </div>
    </PosModal>
  )
}
