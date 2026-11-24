import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Minus, Plus } from 'lucide-react'
import { Modal } from '../../../../shared/Overlay'
import { Button } from '../../../../shared/ui'
import { Loading } from '../../../../shared/States'
import { money, number } from '../../../../lib/format'
import { useGetInventoryQuery } from '../../../../store/api'

/**
 * Pick a stock variant (part) + quantity to consume in a service job. Reuses the
 * variant-centric inventory list. Serial-tracked variants aren't selectable yet.
 */
export function PartPickerModal({ open, onClose, onPick }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState(null) // the chosen inventory row
  const [qty, setQty] = useState(1)

  const { data, isLoading } = useGetInventoryQuery(
    { search: search.trim() || undefined, size: 100 },
    { skip: !open },
  )
  const rows = data?.content ?? []

  const choose = (r) => { setSel(r); setQty(1) }
  const confirm = () => {
    if (!sel) return
    onPick({ variantId: sel.variantId, quantity: qty, name: sel.productName + (!sel.isDefault && sel.variantName ? ` — ${sel.variantName}` : '') })
    setSel(null); setQty(1); setSearch('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('serviceTracking.parts.pickTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={confirm} disabled={!sel || qty < 1}>{t('serviceTracking.parts.add')}</Button>
        </>
      }
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('serviceTracking.parts.search')}
          className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm placeholder:text-muted focus:border-brand-400 focus:bg-white focus:outline-none"
        />
      </div>

      {isLoading ? <Loading /> : (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-line">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('serviceTracking.parts.empty')}</p>
          ) : rows.map((r) => {
            const serial = r.trackingType === 'SERIAL'
            const active = sel?.variantId === r.variantId
            return (
              <button
                key={r.variantId}
                disabled={serial}
                onClick={() => choose(r)}
                className={`flex w-full items-center justify-between gap-3 border-b border-line/60 px-4 py-3 text-left last:border-0 ${active ? 'bg-brand-50' : 'hover:bg-canvas'} ${serial ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {r.productName}{!r.isDefault && r.variantName ? <span className="text-muted"> — {r.variantName}</span> : null}
                  </p>
                  <p className="text-xs text-muted">
                    {money(r.price)} · {t('serviceTracking.parts.inStock', { n: number(r.onHand) })}
                    {serial ? ` · ${t('serviceTracking.parts.serialUnsupported')}` : ''}
                  </p>
                </div>
                {active && <span className="shrink-0 text-xs font-semibold text-brand-700">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      {sel && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
          <span className="text-sm font-medium text-ink">{t('serviceTracking.parts.quantity')}</span>
          <span className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-bg text-warning"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center text-base font-semibold text-ink">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(sel.onHand, q + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-bg text-success"><Plus className="h-4 w-4" /></button>
          </span>
        </div>
      )}
    </Modal>
  )
}
