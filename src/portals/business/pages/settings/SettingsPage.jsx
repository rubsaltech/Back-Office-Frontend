import { useState } from 'react'
import { Camera } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Field, Input, Select, Toggle, Avatar } from '../../../../shared/ui'
import { ConfirmDialog, SuccessDialog } from '../../../../shared/Overlay'
import { cn } from '../../../../lib/cn'
import { currentUser } from '../../data/mock'

const sections = [
  'Profile Settings',
  'Notifications',
  'Privacy Policy',
  'Terms of Use',
  'Password & Security',
  'Business Setting',
  'Account Deactivation',
]

export default function SettingsPage() {
  const [active, setActive] = useState('Profile Settings')
  const [success, setSuccess] = useState(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  return (
    <div>
      <PageHeader title="Settings" />

      <Card className="overflow-hidden p-0">
        {/* cover + identity */}
        <div className="h-32 bg-gradient-to-r from-brand-700 to-brand-500" />
        <div className="flex items-center gap-4 px-6 pb-4">
          <div className="relative -mt-10">
            <Avatar name={currentUser.name} size={80} className="ring-4 ring-white" />
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{currentUser.name}</h2>
            <p className="text-sm text-muted">{currentUser.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-line p-6 lg:grid-cols-[220px_1fr]">
          {/* sub-nav */}
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={cn(
                  'w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors',
                  active === s ? 'bg-brand-50 text-brand-800' : 'text-muted hover:bg-canvas',
                )}
              >
                {s}
              </button>
            ))}
          </nav>

          {/* content */}
          <div>
            {active === 'Profile Settings' && <ProfileForm onSave={() => setSuccess('Profile updated successfully')} />}
            {active === 'Password & Security' && <PasswordForm onSave={() => setSuccess('Password updated successfully')} />}
            {active === 'Notifications' && <NotificationsForm />}
            {active === 'Business Setting' && <BusinessForm onSave={() => setSuccess('Business settings updated')} />}
            {active === 'Account Deactivation' && <DeactivatePanel onDeactivate={() => setConfirmDeactivate(true)} />}
            {(active === 'Privacy Policy' || active === 'Terms of Use') && <LegalText title={active} />}
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => setSuccess('Account deactivated')}
        title="Deactivate Account"
        message="Your account will be deactivated. You can reactivate by contacting support."
        confirmLabel="Yes, Deactivate"
      />
      <SuccessDialog open={!!success} onClose={() => setSuccess(null)} message={success} />
    </div>
  )
}

function ProfileForm({ onSave }) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Profile Settings" note="last update August 1" />
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <div className="md:col-span-2 text-sm font-semibold text-muted">Personal</div>
        <Field label="First Name" required><Input defaultValue="Okasha" /></Field>
        <Field label="Last Name" required><Input defaultValue="Sipra" /></Field>
        <Field label="Phone Number" required><Input defaultValue="+92 3098487880" /></Field>
        <Field label="Date of Birth" required><Input type="date" defaultValue="2001-03-05" /></Field>

        <div className="md:col-span-2 mt-2 text-sm font-semibold text-muted">Business</div>
        <Field label="Business Name" required><Input defaultValue="Rubsal Store" /></Field>
        <Field label="Business Email" required><Input defaultValue="rubsalstore@info.com" /></Field>
        <Field label="Country" required>
          <Select defaultValue="Pakistan"><option>Pakistan</option><option>United States</option><option>Canada</option></Select>
        </Field>
        <Field label="City" required><Input defaultValue="Lahore" /></Field>
      </div>
      <Button onClick={onSave}>Update Profile</Button>
    </div>
  )
}

function PasswordForm({ onSave }) {
  return (
    <div className="max-w-md space-y-6">
      <SectionTitle title="Password & Security" />
      <Field label="Current Password" required><Input type="password" placeholder="••••••••" /></Field>
      <Field label="New Password" required><Input type="password" placeholder="••••••••" /></Field>
      <Field label="Confirm New Password" required><Input type="password" placeholder="••••••••" /></Field>
      <Button onClick={onSave}>Update Password</Button>
    </div>
  )
}

function NotificationsForm() {
  const [prefs, setPrefs] = useState({ orders: true, lowStock: true, reports: false, marketing: false })
  const items = [
    { key: 'orders', label: 'New order alerts', desc: 'Notify when a new order is placed' },
    { key: 'lowStock', label: 'Low stock warnings', desc: 'Alert when inventory runs low' },
    { key: 'reports', label: 'Daily reports', desc: 'Email a daily sales summary' },
    { key: 'marketing', label: 'Product updates', desc: 'News about RUBSAL features' },
  ]
  return (
    <div className="space-y-6">
      <SectionTitle title="Notifications" />
      <div className="divide-y divide-line">
        {items.map((i) => (
          <div key={i.key} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-ink">{i.label}</p>
              <p className="text-xs text-muted">{i.desc}</p>
            </div>
            <Toggle checked={prefs[i.key]} onChange={(v) => setPrefs((p) => ({ ...p, [i.key]: v }))} />
          </div>
        ))}
      </div>
    </div>
  )
}

function BusinessForm({ onSave }) {
  return (
    <div className="max-w-xl space-y-6">
      <SectionTitle title="Business Setting" />
      <Field label="Business Name" required><Input defaultValue="Rubsal Store" /></Field>
      <Field label="Business Email" required><Input defaultValue="rubsalstore@info.com" /></Field>
      <Field label="Business Address" required><Input defaultValue="67L, Mini Market, Gulberg III, Lahore." /></Field>
      <Field label="Currency" required>
        <Select defaultValue="EUR"><option value="EUR">Euro (€)</option><option value="USD">US Dollar ($)</option><option value="PKR">Pakistani Rupee (₨)</option><option value="CAD">Canadian Dollar (C$)</option></Select>
      </Field>
      <Button onClick={onSave}>Save Changes</Button>
    </div>
  )
}

function DeactivatePanel({ onDeactivate }) {
  return (
    <div className="max-w-xl space-y-4">
      <SectionTitle title="Account Deactivation" />
      <div className="rounded-xl border border-danger-bg bg-danger-bg/40 p-4">
        <p className="text-sm font-medium text-ink">Deactivating your account will disable access to all portals.</p>
        <p className="mt-1 text-xs text-muted">This can be reversed by contacting support. Your data is retained.</p>
      </div>
      <Button variant="danger" onClick={onDeactivate}>Deactivate Account</Button>
    </div>
  )
}

function LegalText({ title }) {
  return (
    <div className="space-y-3">
      <SectionTitle title={title} />
      <p className="text-sm leading-relaxed text-muted">
        This is placeholder {title.toLowerCase()} content. The final copy will be provided by RUBSAL Technologies
        and rendered here. It covers how data is handled, user responsibilities, and the terms governing use of the
        POS platform.
      </p>
    </div>
  )
}

function SectionTitle({ title, note }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  )
}
