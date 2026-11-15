import { useTranslation } from 'react-i18next'
import { PosModal } from './PosOverlay'
import { money } from '../../../../lib/format'

const attrText = (v) => Object.values(v.attributes ?? {}).filter(Boolean).join(' / ') || v.variantName

/** Choose which variant of a product to add to the cart. Out-of-stock variants are blocked. */
export function VariantPickerModal({ open, product, onClose, onPick }) {
  const { t } = useTranslation()
  if (!product) return null
  const variants = product.variants ?? []

  return (
    <PosModal open={open} onClose={onClose} title={product.name} size="sm">
      <div className="space-y-2">
        {variants.map((v) => {
          const out = v.onHand <= 0
          return (
            <button
              key={v.id}
              disabled={out}
              onClick={() => onPick(v)}
              className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left transition enabled:hover:border-brand-400 enabled:hover:bg-brand-50/60 disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{attrText(v)}</span>
                <span className="text-xs text-muted">
                  {out ? t('inventory.stock.out') : t('pos.builder.inStock', { n: v.onHand })}
                </span>
              </span>
              <span className="font-semibold text-ink">{money(v.price)}</span>
            </button>
          )
        })}
      </div>
    </PosModal>
  )
}
