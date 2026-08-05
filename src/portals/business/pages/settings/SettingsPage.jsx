import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Camera } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Field, Input, Select, Toggle, Avatar } from '../../../../shared/ui'
import { ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { cn } from '../../../../lib/cn'
import { apiErrorMessage } from '../../../../lib/apiError'
import { selectCurrentUser, logout } from '../../../../store/authSlice'
import {
  useGetSettingsQuery, useUpdateSettingsMutation, useChangePasswordMutation,
  useGetNotificationsQuery, useUpdateNotificationsMutation, useDeactivateAccountMutation,
} from '../../../../store/api'

const SECTION_KEYS = ['profile', 'notifications', 'password', 'business', 'privacy', 'terms', 'deactivation']

export default function SettingsPage() {
  const { t } = useTranslation()
  const [section, setSection] = useState('profile')
  const [toast, setToast] = useState(null)
  const user = useSelector(selectCurrentUser)
  const { data: settings, isLoading, isError, error } = useGetSettingsQuery()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  if (isLoading) return <Loading label={t('common.loading')} />
  if (isError) return <ErrorState error={error} />

  return (
    <div>
      <PageHeader title={t('settings.title')} />
      <Card className="overflow-hidden p-0">
        <div className="h-32 bg-gradient-to-r from-brand-700 to-brand-500" />
        <div className="flex items-center gap-4 px-6 pb-4">
          <div className="relative -mt-10">
            <Avatar name={user?.name || settings.name} size={80} className="ring-4 ring-white" />
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white"><Camera className="h-3.5 w-3.5" /></span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{settings.ownerName || settings.name}</h2>
            <p className="text-sm text-muted">{settings.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-line p-6 lg:grid-cols-[220px_1fr]">
          <nav className="space-y-1">
            {SECTION_KEYS.map((key) => (
              <button key={key} onClick={() => setSection(key)}
                className={cn('w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors',
                  section === key ? 'bg-brand-50 text-brand-800' : 'text-muted hover:bg-canvas')}>
                {t(`settings.sections.${key}`)}
              </button>
            ))}
          </nav>

          <div>
            {(section === 'profile' || section === 'business') && <BusinessForm settings={settings} onOk={ok} onFail={fail} />}
            {section === 'password' && <PasswordForm onOk={ok} onFail={fail} />}
            {section === 'notifications' && <NotificationsForm onOk={ok} onFail={fail} />}
            {section === 'deactivation' && <DeactivatePanel onFail={fail} />}
            {(section === 'privacy' || section === 'terms') && <LegalText title={t(`settings.sections.${section}`)} />}
          </div>
        </div>
      </Card>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function BusinessForm({ settings, onOk, onFail }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(settings)
  const [save, { isLoading }] = useUpdateSettingsMutation()
  useEffect(() => { setForm(settings) }, [settings])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    try {
      await save({
        name: form.name, email: form.email, ownerName: form.ownerName, ownerPhone: form.ownerPhone,
        logoUrl: form.logoUrl, address: form.address, city: form.city, country: form.country,
        currency: form.currency, locale: form.locale,
      }).unwrap()
      onOk(t('toasts.settingsUpdated'))
    } catch (e) { onFail(e) }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-ink">{t('settings.profileBusiness')}</h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <div className="md:col-span-2 text-sm font-semibold text-muted">{t('settings.owner')}</div>
        <Field label={t('settings.ownerName')}><Input value={form.ownerName || ''} onChange={set('ownerName')} /></Field>
        <Field label={t('settings.ownerPhone')}><Input value={form.ownerPhone || ''} onChange={set('ownerPhone')} /></Field>

        <div className="md:col-span-2 mt-2 text-sm font-semibold text-muted">{t('settings.business')}</div>
        <Field label={t('settings.businessName')} required><Input value={form.name || ''} onChange={set('name')} /></Field>
        <Field label={t('settings.businessEmail')}><Input value={form.email || ''} onChange={set('email')} /></Field>
        <Field label={t('settings.address')}><Input value={form.address || ''} onChange={set('address')} /></Field>
        <Field label={t('settings.city')}><Input value={form.city || ''} onChange={set('city')} /></Field>
        <Field label={t('settings.country')}><Input value={form.country || ''} onChange={set('country')} /></Field>
        <Field label={t('settings.currency')}>
          <Select value={form.currency || 'EUR'} onChange={set('currency')}>
            <option value="EUR">Euro (€)</option><option value="USD">US Dollar ($)</option>
            <option value="PKR">Pakistani Rupee (₨)</option><option value="CAD">Canadian Dollar (C$)</option>
          </Select>
        </Field>
      </div>
      <Button onClick={submit} disabled={isLoading}>{isLoading ? t('common.saving') : t('settings.updateProfile')}</Button>
    </div>
  )
}

function PasswordForm({ onOk, onFail }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [change, { isLoading }] = useChangePasswordMutation()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = async () => {
    if (form.newPassword !== form.confirm) { onFail({ data: { message: t('auth.signup.mismatch') } }); return }
    try {
      await change({ currentPassword: form.currentPassword, newPassword: form.newPassword }).unwrap()
      onOk(t('toasts.passwordUpdated')); setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (e) { onFail(e) }
  }
  return (
    <div className="max-w-md space-y-6">
      <h3 className="text-lg font-semibold text-ink">{t('settings.password.title')}</h3>
      <Field label={t('settings.password.current')} required><Input type="password" value={form.currentPassword} onChange={set('currentPassword')} /></Field>
      <Field label={t('settings.password.new')} required><Input type="password" value={form.newPassword} onChange={set('newPassword')} /></Field>
      <Field label={t('settings.password.confirm')} required><Input type="password" value={form.confirm} onChange={set('confirm')} /></Field>
      <Button onClick={submit} disabled={isLoading}>{isLoading ? t('common.saving') : t('settings.password.update')}</Button>
    </div>
  )
}

function NotificationsForm({ onOk, onFail }) {
  const { t } = useTranslation()
  const { data } = useGetNotificationsQuery()
  const [save, { isLoading }] = useUpdateNotificationsMutation()
  const [prefs, setPrefs] = useState(null)
  useEffect(() => { if (data) setPrefs(data) }, [data])
  if (!prefs) return <Loading />
  const items = [
    { key: 'notifyOrders', label: t('settings.notifications.orders'), desc: t('settings.notifications.ordersDesc') },
    { key: 'notifyLowStock', label: t('settings.notifications.lowStock'), desc: t('settings.notifications.lowStockDesc') },
    { key: 'notifyReports', label: t('settings.notifications.reports'), desc: t('settings.notifications.reportsDesc') },
    { key: 'notifyMarketing', label: t('settings.notifications.marketing'), desc: t('settings.notifications.marketingDesc') },
  ]
  const save2 = async (next) => {
    setPrefs(next)
    try { await save(next).unwrap(); onOk(t('toasts.prefsSaved')) } catch (e) { onFail(e) }
  }
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-ink">{t('settings.notifications.title')}</h3>
      <div className="divide-y divide-line">
        {items.map((i) => (
          <div key={i.key} className="flex items-center justify-between py-4">
            <div><p className="text-sm font-medium text-ink">{i.label}</p><p className="text-xs text-muted">{i.desc}</p></div>
            <Toggle checked={prefs[i.key]} onChange={(v) => save2({ ...prefs, [i.key]: v })} disabled={isLoading} />
          </div>
        ))}
      </div>
    </div>
  )
}

function DeactivatePanel({ onFail }) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const [deactivate] = useDeactivateAccountMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const doIt = async () => {
    try { await deactivate().unwrap(); dispatch(logout()); navigate('/business/login', { replace: true }) }
    catch (e) { onFail(e) }
  }
  return (
    <div className="max-w-xl space-y-4">
      <h3 className="text-lg font-semibold text-ink">{t('settings.deactivate.title')}</h3>
      <div className="rounded-xl border border-danger-bg bg-danger-bg/40 p-4">
        <p className="text-sm font-medium text-ink">{t('settings.deactivate.warn')}</p>
        <p className="mt-1 text-xs text-muted">{t('settings.deactivate.hint')}</p>
      </div>
      <Button variant="danger" onClick={() => setConfirm(true)}>{t('settings.deactivate.button')}</Button>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doIt}
        title={t('settings.deactivate.confirmTitle')} message={t('settings.deactivate.confirmMsg')}
        confirmLabel={t('settings.deactivate.confirmBtn')} />
    </div>
  )
}

function LegalText({ title }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{title}</p>
    </div>
  )
}
