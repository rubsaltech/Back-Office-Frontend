import { useTranslation } from 'react-i18next'
import { PosModal } from './PosOverlay'
import { modeMeta } from './verticals'
import { cn } from '../../../../lib/cn'

export function ChooseTypeModal({ open, onClose, onPick, modes = [] }) {
  const { t } = useTranslation()
  const odd = modes.length % 2 === 1
  return (
    <PosModal open={open} onClose={onClose} title={t('pos.chooseType.title')} size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modes.map((mode, i) => {
          const Icon = modeMeta(mode).icon
          const full = odd && i === modes.length - 1
          return (
            <button
              key={mode}
              onClick={() => onPick(mode)}
              className={cn(
                'flex h-44 flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-gradient-to-br from-success-bg/50 via-white to-brand-50/60 transition hover:border-brand-300 hover:shadow-[var(--shadow-card)]',
                full && 'sm:col-span-2 h-36',
              )}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Icon className="h-7 w-7 text-ink" />
              </span>
              <span className="text-base font-semibold uppercase tracking-wide text-ink">{t(`pos.modes.${mode}`)}</span>
            </button>
          )
        })}
      </div>
    </PosModal>
  )
}
