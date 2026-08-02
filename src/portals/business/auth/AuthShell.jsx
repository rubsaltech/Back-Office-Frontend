import { RubsalLogo } from '../../../shared/Brand'

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <RubsalLogo />
        </div>
        <div className="rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  )
}
