import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ Button */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800',
    secondary: 'bg-white text-ink border border-line hover:bg-canvas',
    ghost: 'text-muted hover:bg-canvas',
    danger: 'bg-danger-bg text-danger hover:bg-red-200',
    accent: 'bg-accent-500 text-white hover:bg-accent-600',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- Card */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('bg-surface rounded-2xl border border-line shadow-[var(--shadow-card)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------- Badge */
const badgeTones = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-canvas text-muted',
}
export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------ Field / Input */
export function Field({ label, required, hint, error, className, children }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-ink">
          {required && <span className="text-danger">*</span>}
          {label}
        </span>
      )}
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  )
}

const controlBase =
  'w-full rounded-xl border border-line bg-canvas px-3.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-brand-400 focus:bg-white transition-colors'

export function Input({ className, ...props }) {
  return <input className={cn(controlBase, 'h-11', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }) {
  return <textarea rows={rows} className={cn(controlBase, 'py-2.5 resize-none', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(controlBase, 'h-11 appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  )
}

/* ------------------------------------------------------------------ Toggle */
export function Toggle({ checked, onChange, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors',
        checked ? 'bg-brand-700' : 'bg-slate-300',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ Avatar */
export function Avatar({ name = '', src, size = 36, className }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-700',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials || '?'}
    </span>
  )
}
