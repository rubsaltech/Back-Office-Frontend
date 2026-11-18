import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Loader2, CircleCheck, CircleX } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { useSignupVerifyMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { apiErrorMessage } from '../../../lib/apiError'

/** Landing page for the signup verification link. Creates the account + logs in. */
export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [error, setError] = useState(null)
  const [signupVerify] = useSignupVerifyMutation()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // guard React 18 double-invoke so we don't verify twice
    ran.current = true
    if (!token) {
      setStatus('error')
      setError(t('auth.verify.missingToken'))
      return
    }
    signupVerify({ token })
      .unwrap()
      .then((data) => {
        dispatch(setCredentials(data))
        setStatus('success')
        setTimeout(() => navigate('/business', { replace: true }), 1200)
      })
      .catch((err) => {
        setStatus('error')
        setError(apiErrorMessage(err, t('auth.verify.failed')))
      })
  }, [token, signupVerify, dispatch, navigate, t])

  return (
    <AuthShell
      title={t('auth.verify.title')}
      subtitle=""
      footer={<Link to="/business/login" className="font-medium text-brand-700">{t('auth.forgot.backToLogin')}</Link>}
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            <p className="text-sm text-muted">{t('auth.verify.verifying')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success"><CircleCheck className="h-8 w-8" /></span>
            <p className="text-sm font-medium text-ink">{t('auth.verify.success')}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger"><CircleX className="h-8 w-8" /></span>
            <p className="text-sm text-danger">{error}</p>
            <Link to="/business/signup" className="text-sm font-medium text-brand-700">{t('auth.verify.restart')}</Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
