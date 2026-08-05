import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { SuccessDialog } from '../../../shared/Overlay'
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} from '../../../store/api'
import { apiErrorMessage } from '../../../lib/apiError'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [passwords, setPasswords] = useState({ p1: '', p2: '' })
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const [forgot, { isLoading: sending }] = useForgotPasswordMutation()
  const [verify, { isLoading: verifying }] = useVerifyOtpMutation()
  const [reset, { isLoading: resetting }] = useResetPasswordMutation()

  const sendCode = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await forgot({ email }).unwrap()
      setStep(2)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await verify({ email, code }).unwrap()
      setStep(3)
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.forgot.invalidCode')))
    }
  }

  const doReset = async (e) => {
    e.preventDefault()
    setError(null)
    if (passwords.p1 !== passwords.p2) {
      setError(t('auth.forgot.mismatch'))
      return
    }
    try {
      await reset({ email, code, newPassword: passwords.p1 }).unwrap()
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <AuthShell
      title={step === 1 ? t('auth.forgot.titleEmail') : step === 2 ? t('auth.forgot.titleOtp') : t('auth.forgot.titleNew')}
      subtitle={
        step === 1 ? t('auth.forgot.subtitleEmail')
          : step === 2 ? t('auth.forgot.subtitleOtp')
            : t('auth.forgot.subtitleNew')
      }
      footer={<Link to="/business/login" className="font-medium text-brand-700">{t('auth.forgot.backToLogin')}</Link>}
    >
      {error && <div className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}

      {step === 1 && (
        <form className="space-y-4" onSubmit={sendCode}>
          <Field label={t('auth.forgot.email')} required>
            <Input type="email" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={sending}>{sending ? t('auth.forgot.sending') : t('auth.forgot.sendCode')}</Button>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-5" onSubmit={verifyCode}>
          <OtpInput value={code} onChange={setCode} />
          <Button type="submit" className="w-full" disabled={verifying || code.length < 4}>
            {verifying ? t('auth.forgot.verifying') : t('auth.forgot.verify')}
          </Button>
          <p className="text-center text-sm text-muted">
            {t('auth.forgot.resendPrompt')}{' '}
            <button type="button" className="font-medium text-brand-700" onClick={() => forgot({ email })}>{t('auth.forgot.resend')}</button>
          </p>
        </form>
      )}

      {step === 3 && (
        <form className="space-y-4" onSubmit={doReset}>
          <Field label={t('auth.forgot.newPassword')} required>
            <Input type="password" placeholder="••••••••" value={passwords.p1} onChange={(e) => setPasswords((p) => ({ ...p, p1: e.target.value }))} />
          </Field>
          <Field label={t('auth.forgot.confirmPassword')} required>
            <Input type="password" placeholder="••••••••" value={passwords.p2} onChange={(e) => setPasswords((p) => ({ ...p, p2: e.target.value }))} />
          </Field>
          <Button type="submit" className="w-full" disabled={resetting}>{resetting ? t('auth.forgot.resetting') : t('auth.forgot.reset')}</Button>
        </form>
      )}

      <SuccessDialog
        open={done}
        onClose={() => navigate('/business/login')}
        title={t('auth.forgot.doneTitle')}
        message={t('auth.forgot.doneMessage')}
      />
    </AuthShell>
  )
}

function OtpInput({ value, onChange }) {
  const refs = useRef([])
  const digits = [0, 1, 2, 3]
  const setDigit = (i, d) => {
    const arr = value.padEnd(4, ' ').split('')
    arr[i] = d
    onChange(arr.join('').replace(/\s/g, ''))
    if (d && i < 3) refs.current[i + 1]?.focus()
  }
  return (
    <div className="flex justify-center gap-3">
      {digits.map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={value[i] ?? ''}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, ''))}
          className="h-14 w-14 rounded-xl border border-line bg-canvas text-center text-xl font-semibold focus:border-brand-400 focus:bg-white focus:outline-none"
        />
      ))}
    </div>
  )
}
