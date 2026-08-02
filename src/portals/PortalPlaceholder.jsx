import { Link } from 'react-router-dom'
import { RubsalLogo } from '../shared/Brand'
import { Button } from '../shared/ui'

export function PortalPlaceholder({ name }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-canvas text-center">
      <RubsalLogo />
      <div>
        <h1 className="text-2xl font-bold text-ink">{name}</h1>
        <p className="mt-2 text-sm text-muted">This portal is coming next. The Business Portal is ready.</p>
      </div>
      <Link to="/business">
        <Button>Go to Business Portal</Button>
      </Link>
    </div>
  )
}
