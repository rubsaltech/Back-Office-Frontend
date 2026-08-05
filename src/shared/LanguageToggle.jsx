import { useTranslation } from 'react-i18next'
import { cn } from '../lib/cn'
import { LANG_STORAGE_KEY } from '../i18n'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

export function LanguageToggle({ className }) {
  const { i18n } = useTranslation()
  const current = (i18n.language || 'en').startsWith('es') ? 'es' : 'en'

  const change = (code) => {
    i18n.changeLanguage(code)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code)
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div className={cn('flex items-center rounded-xl border border-line bg-white p-0.5', className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => change(l.code)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
            current === l.code ? 'bg-brand-700 text-white' : 'text-muted hover:text-ink',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
