import { useTranslation } from 'react-i18next'
import { Store, ChevronRight } from 'lucide-react'
import { RubsalLogo } from '../../../shared/Brand'

/** Full-screen "choose which store to manage" shown to employees with >1 store. */
export function StorePicker({ stores = [], onPick }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <div className="mb-6"><RubsalLogo /></div>
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">{t('storePicker.title')}</h1>
        <p className="mb-5 mt-1 text-sm text-muted">{t('storePicker.subtitle')}</p>
        <div className="space-y-2">
          {stores.map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Store className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{s.name}</span>
                  {s.address && <span className="block text-xs text-muted">{s.address}</span>}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
