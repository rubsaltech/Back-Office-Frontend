import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'

/**
 * Lightweight presentational table.
 * columns: [{ key, header, render?(row), className?, align? }]
 */
export function DataTable({ columns, rows, rowKey = (r, i) => i, empty = 'No records found.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn('px-4 py-3 font-medium', c.align === 'right' && 'text-right', c.headClassName)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="border-b border-line/70 last:border-0 hover:bg-canvas/60"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn('px-4 py-3.5 text-ink', c.align === 'right' && 'text-right', c.className)}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm placeholder:text-muted focus:border-brand-400 focus:outline-none"
      />
    </div>
  )
}

export function Pagination({ page, pageCount, onChange }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4 text-sm text-muted">
      <button
        onClick={() => onChange?.(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-medium text-ink">{String(page).padStart(2, '0')}</span>
      <button
        onClick={() => onChange?.(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <span>out of {pageCount}</span>
    </div>
  )
}
