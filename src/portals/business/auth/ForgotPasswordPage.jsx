import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { SuccessDialog } from '../../../shared/Overlay'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 email, 2 otp, 3 new password
  const [done, setDone] = useState(false)

  return (
    <AuthShell
      title={step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'New Password'}
      subtitle={
        step === 1
          ? 'Enter your email and we\'ll send a code'
          : step === 2
            ? 'We sent a 4-digit code to your email'
            : 'Choose a new password for your account'
      }
      footer={<Link to="/business/login" className="font-medium text-brand-700">Back to log in</Link>}
    >
      {step === 1 && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2) }}>
          <Field label="Email Address" required><Input type="email" placeholder="you@business.com" /></Field>
          <Button type="submit" className="w-full">Send Code</Button>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setStep(3) }}>
          <OtpInput />
          <Button type="submit" className="w-full">Verify</Button>
          <p className="text-center text-sm text-muted">Didn't get it? <button type="button" className="font-medium text-brand-700">Resend</button></p>
        </form>
      )}

      {step === 3 && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
          <Field label="New Password" required><Input type="password" placeholder="••••••••" /></Field>
          <Field label="Confirm New Password" required><Input type="password" placeholder="••••••••" /></Field>
          <Button type="submit" className="w-full">Reset Password</Button>
        </form>
      )}

      <SuccessDialog
        open={done}
        onClose={() => navigate('/business/login')}
        title="Password Reset"
        message="Your password has been updated. Please log in."
      />
    </AuthShell>
  )
}

function OtpInput() {
  const refs = useRef([])
  const [vals, setVals] = useState(['', '', '', ''])
  return (
    <div className="flex justify-center gap-3">
      {vals.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={v}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => {
            const next = [...vals]
            next[i] = e.target.value.replace(/\D/g, '')
            setVals(next)
            if (e.target.value && i < 3) refs.current[i + 1]?.focus()
          }}
          className="h-14 w-14 rounded-xl border border-line bg-canvas text-center text-xl font-semibold focus:border-brand-400 focus:bg-white focus:outline-none"
        />
      ))}
    </div>
  )
}
