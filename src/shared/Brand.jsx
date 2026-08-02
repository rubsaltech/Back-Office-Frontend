import { cn } from '../lib/cn'

/** RUBSAL wordmark + hexagon monogram, recreated in SVG to match the design. */
export function RubsalLogo({ className, compact = false }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <path
          d="M17 1.5l12.99 7.5v15L17 31.5 4.01 24V9L17 1.5z"
          fill="#131f78"
        />
        <path
          d="M12 11h7.5a3.5 3.5 0 010 7H14l6 5h-4l-6-5v-2h9.5a1.5 1.5 0 000-3H12v-2z"
          fill="#fff"
        />
      </svg>
      {!compact && (
        <div className="leading-none">
          <span className="text-lg font-extrabold tracking-tight text-brand-900">
            RUB<span className="text-brand-500">SAL</span>
          </span>
          <span className="block text-[9px] font-medium tracking-[0.3em] text-muted">
            TECHNOLOGIES
          </span>
        </div>
      )}
    </div>
  )
}
