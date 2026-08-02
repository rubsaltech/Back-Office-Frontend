import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { Button, Field, Input } from '../../../shared/ui'
import { SuccessDialog } from '../../../shared/Overlay'

export default function SignupPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  return (
    <AuthShell
      title="Create your business"
      subtitle="Set up your RUBSAL POS account"
      footer={<>Already have an account? <Link to="/business/login" className="font-medium text-brand-700">Log in</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
        <div className="text-sm font-semibold text-muted">Business Info</div>
        <Field label="Business Name" required><Input placeholder="Enter business name" /></Field>
        <Field label="Business Email" required><Input type="email" placeholder="Enter email address" /></Field>
        <Field label="Business Address" required><Input placeholder="Enter address" /></Field>

        <div className="pt-2 text-sm font-semibold text-muted">Owner Profile</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner Name" required><Input placeholder="Full name" /></Field>
          <Field label="Owner Phone" required><Input placeholder="+92 ..." /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" required><Input type="password" placeholder="Create password" /></Field>
          <Field label="Confirm" required><Input type="password" placeholder="Confirm" /></Field>
        </div>

        <Button type="submit" className="w-full">Create Business</Button>
      </form>

      <SuccessDialog
        open={done}
        onClose={() => navigate('/business/login')}
        title="Account Created"
        message="Your business account is ready. Please log in."
      />
    </AuthShell>
  )
}
