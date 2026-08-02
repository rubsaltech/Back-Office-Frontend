import { cn } from '../lib/cn'

export function PageHeader({ title, subtitle, children, className }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

/** Pill-style tab switcher (Products/Inventory/Categories, Roles/Permissions, etc.) */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-xl bg-canvas p-1', className)}>
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.value
        const label = typeof t === 'string' ? t : t.label
        return (
          <button
            key={key}
            onClick={() => onChange?.(key)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              value === key ? 'bg-brand-700 text-white shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
