import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useSignupMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { apiErrorMessage } from '../../../lib/apiError'

const empty = { name: '', email: '', password: '', confirm: '' }

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
        <Field label={t('auth.signup.name')} required><Input placeholder={t('auth.signup.namePlaceholder')} value={form.name} onChange={set('name')} /></Field>
        <Field label={t('auth.signup.email')} required><Input type="email" placeholder={t('auth.signup.emailPlaceholder')} value={form.email} onChange={set('email')} /></Field>
        <Field label={t('auth.signup.password')} required><Input type="password" placeholder={t('auth.signup.passwordPlaceholder')} value={form.password} onChange={set('password')} /></Field>
        <Field label={t('auth.signup.confirm')} required><Input type="password" placeholder={t('auth.signup.confirmPlaceholder')} value={form.confirm} onChange={set('confirm')} /></Field>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
