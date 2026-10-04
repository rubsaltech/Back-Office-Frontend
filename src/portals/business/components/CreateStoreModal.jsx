import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../../shared/Overlay'
import { Button, Field, Input, Select } from '../../../shared/ui'
import { apiErrorMessage } from '../../../lib/apiError'
import { STORE_TYPES } from '../pages/pos/verticals'
import { useCreateStoreMutation } from '../../../store/api'

const empty = { name: '', type: 'RESTAURANT', address: '', phone: '' }

/** Create a new store from the navbar store switcher. Calls back with the created store. */
export function CreateStoreModal({ open, onClose, onCreated }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState(null)
  const [createStore, { isLoading }] = useCreateStoreMutation()

  useEffect(() => { if (open) { setForm(empty); setError(null) } }, [open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.type

  const submit = async () => {
    setError(null)
    try {
      const created = await createStore({
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        main: false,
      }).unwrap()
      onCreated?.(created)
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('stores.createTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={isLoading || !valid}>
            {isLoading ? t('common.saving') : t('stores.create')}
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
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
