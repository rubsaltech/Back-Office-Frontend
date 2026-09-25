import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Loading, ErrorState } from '../../../../shared/States'
import { useGetFloorsQuery, useGetTablesQuery } from '../../../../store/api'

const STATUS_STYLE = {
  FREE: { dot: 'bg-success', bar: 'border-l-success', chip: 'text-success' },
  OCCUPIED: { dot: 'bg-warning', bar: 'border-l-warning', chip: 'text-warning' },
  CHECKED_IN: { dot: 'bg-info', bar: 'border-l-info', chip: 'text-info' },
}

export function FloorSelect({ onSelectTable }) {
  const { t } = useTranslation()
  const floorsQ = useGetFloorsQuery()
  const tablesQ = useGetTablesQuery({ size: 200 })
  const floors = floorsQ.data ?? []
  const [floorId, setFloorId] = useState(null)

  const activeFloor = floorId ?? floors[0]?.id ?? null
  const allTables = tablesQ.data?.content ?? []
  const tables = useMemo(
    () => allTables.filter((tb) => activeFloor == null || tb.floorId === activeFloor),
    [allTables, activeFloor],
  )

  const counts = useMemo(() => {
    const c = { FREE: 0, OCCUPIED: 0, CHECKED_IN: 0 }
    allTables.forEach((tb) => { c[tb.status] = (c[tb.status] || 0) + 1 })
    return c
  }, [allTables])
  const capacity = allTables.length
    ? Math.round(((allTables.length - counts.FREE) / allTables.length) * 100)
    : 0

  if (floorsQ.isLoading || tablesQ.isLoading) return <Loading label={t('common.loading')} />
  if (floorsQ.isError) return <ErrorState error={floorsQ.error} />
  if (floors.length === 0) {
    return <div className="flex h-full items-center justify-center p-10 text-center text-muted">{t('pos.floor.noFloors')}</div>
  }

  return (
    <div className="flex h-full flex-col">
      {/* Floor tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3 sm:px-6">
        {floors.map((f) => (
          <button
            key={f.id}
            onClick={() => setFloorId(f.id)}
            className={cn('rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              activeFloor === f.id ? 'bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-sm' : 'border border-line text-muted hover:text-ink')}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Tables grid */}
      <div className="flex-1 overflow-y-auto bg-brand-50/30 p-4 sm:p-6">
        <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted">{t('pos.floor.selectHint')}</p>
        {tables.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t('pos.floor.noTables')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {tables.map((tb) => {
              const s = STATUS_STYLE[tb.status] ?? STATUS_STYLE.FREE
              return (
                <button
                  key={tb.id}
                  onClick={() => onSelectTable(tb)}
                  className={cn('flex flex-col rounded-2xl border border-l-4 bg-white p-4 text-left shadow-sm transition hover:shadow-[var(--shadow-card)]', s.bar)}
                >
                  <span className="text-2xl font-bold text-ink">{tb.name}</span>
                  <span className={cn('mt-1 text-xs font-medium', s.chip)}>{t(`floor.statuses.${tb.status}`)}</span>
                  <span className="mt-3 flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3.5 w-3.5" /> {tb.seats} {t('pos.floor.seats')}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend + capacity */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-3 text-sm sm:px-6">
        <div className="flex items-center gap-4">
          <Legend colorClass="bg-success" label={t('pos.floor.free')} n={counts.FREE} />
          <Legend colorClass="bg-warning" label={t('pos.floor.reserved')} n={counts.OCCUPIED} />
          <Legend colorClass="bg-info" label={t('pos.floor.checkedIn')} n={counts.CHECKED_IN} />
        </div>
        <div className="flex min-w-[200px] flex-1 items-center gap-3 sm:max-w-xs">
          <span className="text-muted">{t('pos.floor.capacity')}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-success" style={{ width: `${capacity}%` }} />
          </div>
          <span className="font-medium text-ink">{capacity}%</span>
        </div>
      </div>
    </div>
  )
}

function Legend({ colorClass, label, n }) {
  return (
    <span className="flex items-center gap-2 text-muted">
      <span className={cn('h-3 w-3 rounded-full', colorClass)} /> {label} <span className="font-semibold text-ink">{n}</span>
    </span>
  )
}
