import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Store as StoreIcon } from 'lucide-react'
import { RubsalLogo } from '../../shared/Brand'
import { LanguageToggle } from '../../shared/LanguageToggle'
import { Button, Field, Input, Select } from '../../shared/ui'
import { Toast } from '../../shared/States'
import { logout } from '../../store/authSlice'
import { api, useCreateStoreMutation } from '../../store/api'
import { apiErrorMessage } from '../../lib/apiError'
import { STORE_TYPES } from './pages/pos/verticals'

/*
 * Compulsory first-run form. A business starts with NO store; the owner must
 * create one here before using the app. The store's TYPE (vertical) is what
 * drives the POS flow, so it's collected up front. Business email and store
 * email may be the same — the store email is just contact info.
 */
export default function StoreOnboarding() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [createStore, { isLoading }] = useCreateStoreMutation()
  const [form, setForm] = useState({ name: '', type: 'RESTAURANT', phone: '', email: '', address: '' })
  const [toast, setToast] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim() && form.type

  const submit = async (e) => {
    e.preventDefault()
    try {
      await createStore({
        name: form.name.trim(),
        type: form.type,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        main: true,
      }).unwrap()
      // The Store cache tag is invalidated → the layout guard re-checks and
      // lets the app through.
    } catch (err) {
      setToast({ type: 'error', message: apiErrorMessage(err) })
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-canvas px-4 py-10">
      <LanguageToggle className="absolute right-4 top-4" />
      <button
        onClick={() => { dispatch(logout()); dispatch(api.util.resetApiState()) }}
        className="absolute left-4 top-4 text-sm font-medium text-muted hover:text-ink"
      >
        {t('nav.logout', 'Log out')}
      </button>

      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center"><RubsalLogo /></div>
        <div className="rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><StoreIcon className="h-5 w-5" /></span>
            <div>
              <h1 className="text-xl font-bold text-ink">{t('onboarding.title')}</h1>
              <p className="text-sm text-muted">{t('onboarding.subtitle')}</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <Field label={t('onboarding.storeName')} required>
              <Input placeholder={t('onboarding.storeNamePlaceholder')} value={form.name} onChange={set('name')} />
            </Field>
            <Field label={t('onboarding.storeType')} required hint={t('onboarding.storeTypeHint')}>
              <Select value={form.type} onChange={set('type')}>
                {STORE_TYPES.map((ty) => <option key={ty} value={ty}>{t(`storeTypes.${ty}`)}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('onboarding.phone')}>
                <Input placeholder="+92 3xx xxxxxxx" value={form.phone} onChange={set('phone')} />
              </Field>
              <Field label={t('onboarding.email')} hint={t('onboarding.emailHint')}>
                <Input type="email" placeholder="store@business.com" value={form.email} onChange={set('email')} />
              </Field>
            </div>
            <Field label={t('onboarding.address')}>
              <Input placeholder={t('onboarding.addressPlaceholder')} value={form.address} onChange={set('address')} />
            </Field>
            <Button type="submit" className="w-full" disabled={!valid || isLoading}>
              {isLoading ? t('common.saving') : t('onboarding.submit')}
            </Button>
          </form>
        </div>
      </div>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
