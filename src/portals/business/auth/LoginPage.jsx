import { useNavigate, Link } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your business account"
      footer={<>Don't have an account? <Link to="/business/signup" className="font-medium text-brand-700">Sign up</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/business')
        }}
      >
        <Field label="Email Address" required>
          <Input type="email" placeholder="you@business.com" />
        </Field>
        <Field label="Password" required>
          <Input type="password" placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <Link to="/business/forgot-password" className="text-sm font-medium text-brand-700">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full">Log In</Button>
      </form>
    </AuthShell>
  )
}
