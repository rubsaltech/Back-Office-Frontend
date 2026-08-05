import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useSignupMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { apiErrorMessage } from '../../../lib/apiError'

const empty = {
  businessName: '', email: '', address: '',
  ownerName: '', ownerPhone: '', password: '', confirm: '',
}

export default function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [signup, { isLoading }] = useSignupMutation()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) {
      setError(t('auth.signup.mismatch'))
      return
    }
    try {
      const { confirm, ...payload } = form
      const data = await signup(payload).unwrap()
      dispatch(setCredentials(data))
      navigate('/business', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.signup.failed')))
    }
  }

  return (
    <AuthShell
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      footer={<>{t('auth.signup.haveAccount')} <Link to="/business/login" className="font-medium text-brand-700">{t('auth.signup.login')}</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && <div className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}
        <div className="text-sm font-semibold text-muted">{t('auth.signup.businessInfo')}</div>
        <Field label={t('auth.signup.businessName')} required><Input placeholder="Enter business name" value={form.businessName} onChange={set('businessName')} /></Field>
        <Field label={t('auth.signup.businessEmail')} required><Input type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} /></Field>
        <Field label={t('auth.signup.businessAddress')}><Input placeholder="Enter address" value={form.address} onChange={set('address')} /></Field>

        <div className="pt-2 text-sm font-semibold text-muted">{t('auth.signup.ownerProfile')}</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('auth.signup.ownerName')} required><Input placeholder="Full name" value={form.ownerName} onChange={set('ownerName')} /></Field>
          <Field label={t('auth.signup.ownerPhone')}><Input placeholder="+92 ..." value={form.ownerPhone} onChange={set('ownerPhone')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('auth.signup.password')} required><Input type="password" placeholder="Create password" value={form.password} onChange={set('password')} /></Field>
          <Field label={t('auth.signup.confirm')} required><Input type="password" placeholder="Confirm" value={form.confirm} onChange={set('confirm')} /></Field>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
