import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { useLoginMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { apiErrorMessage } from '../../../lib/apiError'

export default function LoginPage() {
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
      setError(apiErrorMessage(err, 'Invalid email or password'))
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your business account"
      footer={<>Don't have an account? <Link to="/business/signup" className="font-medium text-brand-700">Sign up</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && <div className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</div>}
        <Field label="Email Address" required>
          <Input type="email" placeholder="you@business.com" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>
        <Field label="Password" required>
          <Input type="password" placeholder="••••••••" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </Field>
        <div className="flex justify-end">
          <Link to="/business/forgot-password" className="text-sm font-medium text-brand-700">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log In'}
        </Button>
      </form>
    </AuthShell>
  )
}
