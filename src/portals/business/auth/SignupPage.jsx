import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
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
      setError('Passwords do not match')
      return
    }
    try {
      const { confirm, ...payload } = form
      const data = await signup(payload).unwrap()
      dispatch(setCredentials(data))
      navigate('/business', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create account'))
    }
  }

  return (
    <AuthShell
      title="Create your business"
      subtitle="Set up your RUBSAL POS account"
      footer={<>Already have an account? <Link to="/business/login" className="font-medium text-brand-700">Log in</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && <div className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}
        <div className="text-sm font-semibold text-muted">Business Info</div>
        <Field label="Business Name" required><Input placeholder="Enter business name" value={form.businessName} onChange={set('businessName')} /></Field>
        <Field label="Business Email" required><Input type="email" placeholder="Enter email address" value={form.email} onChange={set('email')} /></Field>
        <Field label="Business Address"><Input placeholder="Enter address" value={form.address} onChange={set('address')} /></Field>

        <div className="pt-2 text-sm font-semibold text-muted">Owner Profile</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner Name" required><Input placeholder="Full name" value={form.ownerName} onChange={set('ownerName')} /></Field>
          <Field label="Owner Phone"><Input placeholder="+92 ..." value={form.ownerPhone} onChange={set('ownerPhone')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" required><Input type="password" placeholder="Create password" value={form.password} onChange={set('password')} /></Field>
          <Field label="Confirm" required><Input type="password" placeholder="Confirm" value={form.confirm} onChange={set('confirm')} /></Field>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create Business'}
        </Button>
      </form>
    </AuthShell>
  )
}
