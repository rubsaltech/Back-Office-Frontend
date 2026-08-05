import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useLoginMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { apiErrorMessage } from '../../../lib/apiError'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)

  const from = location.state?.from?.pathname || '/business'

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const data = await login(form).unwrap()
      dispatch(setCredentials(data))
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.login.invalid')))
    }
  }

  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={<>{t('auth.login.noAccount')} <Link to="/business/signup" className="font-medium text-brand-700">{t('auth.login.signup')}</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && <div className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}
        <Field label={t('auth.login.email')} required>
          <Input type="email" placeholder="you@business.com" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>
        <Field label={t('auth.login.password')} required>
          <Input type="password" placeholder="••••••••" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </Field>
        <div className="flex justify-end">
          <Link to="/business/forgot-password" className="text-sm font-medium text-brand-700">{t('auth.login.forgot')}</Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
