import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useSignupStartMutation, useSignupVerifyMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { apiErrorMessage } from '../../../lib/apiError'

const empty = { name: '', email: '', password: '', confirm: '' }

export default function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [step, setStep] = useState(1) // 1 = details, 2 = verify email
  const [form, setForm] = useState(empty)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)

  const [signupStart, { isLoading: starting }] = useSignupStartMutation()
  const [signupVerify, { isLoading: verifying }] = useSignupVerifyMutation()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Step 1 → send the verification code (does NOT create the account yet).
  const sendCode = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) {
      setError(t('auth.signup.mismatch'))
      return
    }
    try {
      await signupStart({ name: form.name, email: form.email, password: form.password }).unwrap()
      setCode('')
      setStep(2)
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.signup.failed')))
    }
  }

  // Step 2 → verify the code, create the account, and log in.
  const verifyCode = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const data = await signupVerify({ email: form.email, code }).unwrap()
      dispatch(setCredentials(data))
      navigate('/business', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.signup.invalidCode')))
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

  return (
    <AuthShell
      title={step === 1 ? t('auth.signup.title') : t('auth.signup.verifyTitle')}
      subtitle={step === 1 ? t('auth.signup.subtitle') : t('auth.signup.verifySubtitle', { email: form.email })}
      footer={<>{t('auth.signup.haveAccount')} <Link to="/business/login" className="font-medium text-brand-700">{t('auth.signup.login')}</Link></>}
    >
      {error && <div className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}

      {step === 1 ? (
        <form className="space-y-4" onSubmit={sendCode}>
          <Field label={t('auth.signup.name')} required><Input placeholder={t('auth.signup.namePlaceholder')} value={form.name} onChange={set('name')} /></Field>
          <Field label={t('auth.signup.email')} required><Input type="email" placeholder={t('auth.signup.emailPlaceholder')} value={form.email} onChange={set('email')} /></Field>
          <Field label={t('auth.signup.password')} required><Input type="password" placeholder={t('auth.signup.passwordPlaceholder')} value={form.password} onChange={set('password')} /></Field>
          <Field label={t('auth.signup.confirm')} required><Input type="password" placeholder={t('auth.signup.confirmPlaceholder')} value={form.confirm} onChange={set('confirm')} /></Field>

          <Button type="submit" className="w-full" disabled={starting}>
            {starting ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </Button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={verifyCode}>
          <OtpInput value={code} onChange={setCode} />
          <Button type="submit" className="w-full" disabled={verifying || code.length < 4}>
            {verifying ? t('auth.signup.verifying') : t('auth.signup.verify')}
          </Button>
          <p className="text-center text-sm text-muted">
            {t('auth.signup.resendPrompt')}{' '}
            <button type="button" className="font-medium text-brand-700" onClick={resend} disabled={starting}>{t('auth.signup.resend')}</button>
          </p>
          <p className="text-center text-sm">
            <button type="button" className="font-medium text-muted hover:text-ink" onClick={() => { setStep(1); setError(null) }}>{t('auth.signup.changeDetails')}</button>
          </p>
        </form>
      )}
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
