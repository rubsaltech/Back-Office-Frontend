import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, CircleX } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { SuccessDialog } from '../../../shared/Overlay'
import { useValidateResetTokenMutation, useResetPasswordMutation } from '../../../store/api'
import { apiErrorMessage } from '../../../lib/apiError'

/** Landing page for the password-reset link: validates the token, then sets a new password. */
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState('checking') // checking | ready | invalid
  const [passwords, setPasswords] = useState({ p1: '', p2: '' })
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const [validateToken] = useValidateResetTokenMutation()
  const [reset, { isLoading: resetting }] = useResetPasswordMutation()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!token) { setState('invalid'); setError(t('auth.reset.missingToken')); return }
    validateToken({ token }).unwrap()
      .then(() => setState('ready'))
      .catch((err) => { setState('invalid'); setError(apiErrorMessage(err, t('auth.reset.invalid'))) })
  }, [token, validateToken, t])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (passwords.p1 !== passwords.p2) { setError(t('auth.reset.mismatch')); return }
    try {
      await reset({ token, newPassword: passwords.p1 }).unwrap()
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <AuthShell
      title={t('auth.reset.title')}
      subtitle={state === 'ready' ? t('auth.reset.subtitle') : ''}
      footer={<Link to="/business/login" className="font-medium text-brand-700">{t('auth.forgot.backToLogin')}</Link>}
    >
      {error && <div className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}

      {state === 'checking' && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
          <p className="text-sm text-muted">{t('auth.reset.checking')}</p>
        </div>
      )}

      {state === 'invalid' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger"><CircleX className="h-8 w-8" /></span>
          <Link to="/business/forgot-password" className="text-sm font-medium text-brand-700">{t('auth.reset.requestNew')}</Link>
        </div>
      )}

      {state === 'ready' && (
        <form className="space-y-4" onSubmit={submit}>
          <Field label={t('auth.reset.newPassword')} required>
            <Input type="password" placeholder="••••••••" value={passwords.p1} onChange={(e) => setPasswords((p) => ({ ...p, p1: e.target.value }))} />
          </Field>
          <Field label={t('auth.reset.confirmPassword')} required>
            <Input type="password" placeholder="••••••••" value={passwords.p2} onChange={(e) => setPasswords((p) => ({ ...p, p2: e.target.value }))} />
          </Field>
          <Button type="submit" className="w-full" disabled={resetting}>{resetting ? t('auth.reset.resetting') : t('auth.reset.reset')}</Button>
        </form>
      )}

      <SuccessDialog
        open={done}
        onClose={() => navigate('/business/login')}
        title={t('auth.reset.doneTitle')}
        message={t('auth.reset.doneMessage')}
      />
    </AuthShell>
  )
}
