import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
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

const sections = ['Profile Settings', 'Notifications', 'Password & Security', 'Business Setting', 'Privacy Policy', 'Terms of Use', 'Account Deactivation']

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('Profile Settings')
  const [toast, setToast] = useState(null)
  const user = useSelector(selectCurrentUser)
  const { data: settings, isLoading, isError, error } = useGetSettingsQuery()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  if (isLoading) return <Loading label="Loading settings…" />
  if (isError) return <ErrorState error={error} />

  return (
    <div>
      <PageHeader title="Settings" />
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
            {sections.map((s) => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={cn('w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors',
                  activeSection === s ? 'bg-brand-50 text-brand-800' : 'text-muted hover:bg-canvas')}>
                {s}
              </button>
            ))}
          </nav>

          <div>
            {(activeSection === 'Profile Settings' || activeSection === 'Business Setting') &&
              <BusinessForm settings={settings} onOk={ok} onFail={fail} />}
            {activeSection === 'Password & Security' && <PasswordForm onOk={ok} onFail={fail} />}
            {activeSection === 'Notifications' && <NotificationsForm onOk={ok} onFail={fail} />}
            {activeSection === 'Account Deactivation' && <DeactivatePanel onFail={fail} />}
            {(activeSection === 'Privacy Policy' || activeSection === 'Terms of Use') && <LegalText title={activeSection} />}
          </div>
        </div>
      </Card>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function BusinessForm({ settings, onOk, onFail }) {
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
      onOk('Settings updated')
    } catch (e) { onFail(e) }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-ink">Profile & Business</h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <div className="md:col-span-2 text-sm font-semibold text-muted">Owner</div>
        <Field label="Owner Name"><Input value={form.ownerName || ''} onChange={set('ownerName')} /></Field>
        <Field label="Owner Phone"><Input value={form.ownerPhone || ''} onChange={set('ownerPhone')} /></Field>

        <div className="md:col-span-2 mt-2 text-sm font-semibold text-muted">Business</div>
        <Field label="Business Name" required><Input value={form.name || ''} onChange={set('name')} /></Field>
        <Field label="Business Email"><Input value={form.email || ''} onChange={set('email')} /></Field>
        <Field label="Address"><Input value={form.address || ''} onChange={set('address')} /></Field>
        <Field label="City"><Input value={form.city || ''} onChange={set('city')} /></Field>
        <Field label="Country"><Input value={form.country || ''} onChange={set('country')} /></Field>
        <Field label="Currency">
          <Select value={form.currency || 'EUR'} onChange={set('currency')}>
            <option value="EUR">Euro (€)</option><option value="USD">US Dollar ($)</option>
            <option value="PKR">Pakistani Rupee (₨)</option><option value="CAD">Canadian Dollar (C$)</option>
          </Select>
        </Field>
      </div>
      <Button onClick={submit} disabled={isLoading}>{isLoading ? 'Saving…' : 'Update Profile'}</Button>
    </div>
  )
}

function PasswordForm({ onOk, onFail }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [change, { isLoading }] = useChangePasswordMutation()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = async () => {
    if (form.newPassword !== form.confirm) { onFail({ data: { message: 'Passwords do not match' } }); return }
    try {
      await change({ currentPassword: form.currentPassword, newPassword: form.newPassword }).unwrap()
      onOk('Password updated'); setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (e) { onFail(e) }
  }
  return (
    <div className="max-w-md space-y-6">
      <h3 className="text-lg font-semibold text-ink">Password & Security</h3>
      <Field label="Current Password" required><Input type="password" value={form.currentPassword} onChange={set('currentPassword')} /></Field>
      <Field label="New Password" required><Input type="password" value={form.newPassword} onChange={set('newPassword')} /></Field>
      <Field label="Confirm New Password" required><Input type="password" value={form.confirm} onChange={set('confirm')} /></Field>
      <Button onClick={submit} disabled={isLoading}>{isLoading ? 'Saving…' : 'Update Password'}</Button>
    </div>
  )
}

function NotificationsForm({ onOk, onFail }) {
  const { data } = useGetNotificationsQuery()
  const [save, { isLoading }] = useUpdateNotificationsMutation()
  const [prefs, setPrefs] = useState(null)
  useEffect(() => { if (data) setPrefs(data) }, [data])
  if (!prefs) return <Loading />
  const items = [
    { key: 'notifyOrders', label: 'New order alerts', desc: 'Notify when a new order is placed' },
    { key: 'notifyLowStock', label: 'Low stock warnings', desc: 'Alert when inventory runs low' },
    { key: 'notifyReports', label: 'Daily reports', desc: 'Email a daily sales summary' },
    { key: 'notifyMarketing', label: 'Product updates', desc: 'News about RUBSAL features' },
  ]
  const save2 = async (next) => {
    setPrefs(next)
    try { await save(next).unwrap(); onOk('Preferences saved') } catch (e) { onFail(e) }
  }
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-ink">Notifications</h3>
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
      <h3 className="text-lg font-semibold text-ink">Account Deactivation</h3>
      <div className="rounded-xl border border-danger-bg bg-danger-bg/40 p-4">
        <p className="text-sm font-medium text-ink">Deactivating your account disables access to all portals.</p>
        <p className="mt-1 text-xs text-muted">You'll be logged out. Contact support to reactivate.</p>
      </div>
      <Button variant="danger" onClick={() => setConfirm(true)}>Deactivate Account</Button>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={doIt}
        title="Deactivate Account" message="Your account will be deactivated and you'll be logged out."
        confirmLabel="Yes, Deactivate" />
    </div>
  )
}

function LegalText({ title }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">
        This is placeholder {title.toLowerCase()} content, to be provided by RUBSAL Technologies.
      </p>
    </div>
  )
}
