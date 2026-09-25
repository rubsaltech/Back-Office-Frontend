import { useTranslation } from 'react-i18next'
import { UtensilsCrossed, Bike, Truck } from 'lucide-react'
import { PosModal } from './PosOverlay'

const TYPES = [
  { value: 'DINE_IN', labelKey: 'pos.chooseType.dineIn', icon: UtensilsCrossed },
  { value: 'TAKEAWAY', labelKey: 'pos.chooseType.takeAway', icon: Bike },
  { value: 'DELIVERY', labelKey: 'pos.chooseType.delivery', icon: Truck },
]

export function ChooseTypeModal({ open, onClose, onPick }) {
  const { t } = useTranslation()
  return (
    <PosModal open={open} onClose={onClose} title={t('pos.chooseType.title')} size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TYPES.map(({ value, labelKey, icon: Icon }, i) => (
          <button
            key={value}
            onClick={() => onPick(value)}
            className={cnCard(i)}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Icon className="h-7 w-7 text-ink" />
            </span>
            <span className="text-base font-semibold uppercase tracking-wide text-ink">{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </PosModal>
  )
}

// Delivery spans full width on the second row (like the design).
function cnCard(i) {
  const base =
    'flex h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-gradient-to-br from-success-bg/50 via-white to-brand-50/60 transition hover:border-brand-300 hover:shadow-[var(--shadow-card)]'
  return i === 2 ? `${base} sm:col-span-2 h-40` : base
}
