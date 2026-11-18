import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MailCheck } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useSignupStartMutation } from '../../../store/api'
import { apiErrorMessage } from '../../../lib/apiError'

const empty = { name: '', email: '', password: '', confirm: '' }

export default function SignupPage() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState(null)

  const [signupStart, { isLoading }] = useSignupStartMutation()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) {
      setError(t('auth.signup.mismatch'))
      return
    }
    try {
      await signupStart({ name: form.name, email: form.email, password: form.password }).unwrap()
      setSent(true)
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.signup.failed')))
    }
  }

  const resend = async () => {
    setError(null)
    try {
      await signupStart({ name: form.name, email: form.email, password: form.password }).unwrap()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  if (sent) {
    return (
      <AuthShell
        title={t('auth.signup.checkEmailTitle')}
        subtitle={t('auth.signup.checkEmailSubtitle', { email: form.email })}
        footer={<Link to="/business/login" className="font-medium text-brand-700">{t('auth.signup.login')}</Link>}
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="text-sm text-muted">{t('auth.signup.checkEmailHint')}</p>
          {error && <div className="w-full rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}
          <p className="text-sm text-muted">
            {t('auth.signup.resendPrompt')}{' '}
            <button type="button" className="font-medium text-brand-700" onClick={resend} disabled={isLoading}>{t('auth.signup.resend')}</button>
          </p>
          <button type="button" className="text-sm font-medium text-muted hover:text-ink" onClick={() => { setSent(false); setError(null) }}>
            {t('auth.signup.changeDetails')}
          </button>
        </div>
      </AuthShell>
    )
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
