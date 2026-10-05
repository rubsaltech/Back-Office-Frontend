import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../../shared/Overlay'
import { Button, Field, Input, Select, Toggle } from '../../../shared/ui'
import { apiErrorMessage } from '../../../lib/apiError'
import { STORE_TYPES } from '../pages/pos/verticals'
import { useCreateStoreMutation, useUpdateStoreMutation } from '../../../store/api'

const empty = { name: '', type: 'RESTAURANT', address: '', phone: '', status: 'ACTIVE', main: false }

function fromStore(s) {
  return {
    name: s.name ?? '',
    type: s.type ?? 'RESTAURANT',
    address: s.address ?? '',
    phone: s.phone ?? '',
    status: s.status ?? 'ACTIVE',
    main: !!s.main,
  }
}

/** Create or edit a store. Calls onSaved(store) with the saved store. */
export function StoreModal({ open, store, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState(null)
  const [createStore, cS] = useCreateStoreMutation()
  const [updateStore, uS] = useUpdateStoreMutation()
  const saving = cS.isLoading || uS.isLoading
  const editing = !!store

  useEffect(() => {
    if (open) { setForm(store ? fromStore(store) : empty); setError(null) }
  }, [open, store])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.type

  const submit = async () => {
    setError(null)
    const body = {
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
      main: form.main,
    }
    try {
      const saved = editing
        ? await updateStore({ id: store.id, ...body }).unwrap()
        : await createStore({ ...body, main: false }).unwrap()
      onSaved?.(saved)
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('stores.editTitle') : t('stores.createTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={saving || !valid}>
            {saving ? t('common.saving') : editing ? t('common.save') : t('stores.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('onboarding.storeName')} required>
          <Input placeholder={t('onboarding.storeNamePlaceholder')} value={form.name} onChange={set('name')} />
        </Field>
        <Field label={t('onboarding.storeType')} required hint={t('onboarding.storeTypeHint')}>
          <Select value={form.type} onChange={set('type')}>
            {STORE_TYPES.map((ty) => <option key={ty} value={ty}>{t(`storeTypes.${ty}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('onboarding.address')}>
          <Input placeholder={t('onboarding.addressPlaceholder')} value={form.address} onChange={set('address')} />
        </Field>
        <Field label={t('stores.phone')}>
          <Input value={form.phone} onChange={set('phone')} />
        </Field>

        {editing && (
          <>
            <Field label={t('stores.status')}>
              <Select value={form.status} onChange={set('status')}>
                <option value="ACTIVE">{t('common.active')}</option>
                <option value="INACTIVE">{t('common.inactive')}</option>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{t('stores.setAsMain')}</p>
                <p className="text-xs text-muted">{t('stores.setAsMainHint')}</p>
              </div>
              <Toggle checked={form.main} onChange={(v) => setForm((f) => ({ ...f, main: v }))} />
            </div>
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
