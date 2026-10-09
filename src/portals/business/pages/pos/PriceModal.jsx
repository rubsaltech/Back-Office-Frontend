import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PosModal } from './PosOverlay'
import { Button, Field, Input } from '../../../../shared/ui'
import { money } from '../../../../lib/format'

/**
 * Change the price of ONE cart line at runtime (this piece only — it never
 * touches the product's catalog price). Returns the new price via onApply, or
 * null to reset to the original.
 */
export function PriceModal({ open, line, onClose, onApply }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open && line) {
      setValue(line.overridePrice != null ? String(line.overridePrice) : String(line.basePrice ?? ''))
    }
  }, [open, line])

  if (!line) return null

  const apply = () => {
    const n = Number(value)
    onApply(Number.isFinite(n) && n >= 0 ? n : null)
  }

  return (
    <PosModal open={open} onClose={onClose} title={t('pos.price.title')} size="sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-ink">{line.name}</p>
          <p className="text-xs text-muted">{t('pos.price.original')}: {money(line.basePrice)}</p>
        </div>
        <Field label={t('pos.price.newPrice')} required>
          <Input type="number" min="0" step="0.01" autoFocus value={value}
            onChange={(e) => setValue(e.target.value)} />
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <Button className="flex-1" onClick={apply}>{t('pos.price.apply')}</Button>
          {line.overridePrice != null && (
            <Button variant="ghost" onClick={() => onApply(null)}>{t('pos.price.reset')}</Button>
          )}
        </div>
      </div>
    </PosModal>
  )
}
