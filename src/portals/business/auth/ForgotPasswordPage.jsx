import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MailCheck } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useForgotPasswordMutation } from '../../../store/api'
import { apiErrorMessage } from '../../../lib/apiError'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [forgot, { isLoading }] = useForgotPasswordMutation()

  const sendLink = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await forgot({ email }).unwrap()
      setSent(true)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <AuthShell
      title={sent ? t('auth.forgot.checkEmailTitle') : t('auth.forgot.titleEmail')}
      subtitle={sent ? t('auth.forgot.checkEmailSubtitle', { email }) : t('auth.forgot.subtitleEmail')}
      footer={<Link to="/business/login" className="font-medium text-brand-700">{t('auth.forgot.backToLogin')}</Link>}
    >
      {error && <div className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}

      {sent ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="text-sm text-muted">{t('auth.forgot.checkEmailHint')}</p>
          <p className="text-sm text-muted">
            {t('auth.forgot.resendPrompt')}{' '}
            <button type="button" className="font-medium text-brand-700" onClick={sendLink} disabled={isLoading}>{t('auth.forgot.resend')}</button>
          </p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={sendLink}>
          <Field label={t('auth.forgot.email')} required>
            <Input type="email" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? t('auth.forgot.sending') : t('auth.forgot.sendLink')}</Button>
        </form>
      )}
    </AuthShell>
  )
}
