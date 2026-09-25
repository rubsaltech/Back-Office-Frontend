import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Percent, DollarSign } from 'lucide-react'
import { PosModal } from './PosOverlay'
import { Button, Field, Input } from '../../../../shared/ui'
import { cn } from '../../../../lib/cn'

export function DiscountModal({ open, onClose, onApply, current }) {
  const { t } = useTranslation()
  const [type, setType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) {
      setType(current?.type || 'PERCENTAGE')
      setValue(current?.value != null ? String(current.value) : '')
    }
  }, [open, current])

  const options = [
    { value: 'PERCENTAGE', label: t('pos.discount.percentage'), icon: Percent },
    { value: 'AMOUNT', label: t('pos.discount.amount'), icon: DollarSign },
  ]

  return (
    <PosModal
      open={open}
      onClose={onClose}
      title={t('pos.discount.title')}
      size="md"
      footer={
        <div className="flex items-center gap-3">
          <Button onClick={() => onApply({ type, value: Number(value) || 0 })}>{t('pos.discount.add')}</Button>
          {current && (
            <Button variant="ghost" onClick={() => onApply(null)}>{t('pos.discount.remove')}</Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-ink"><span className="text-danger">*</span>{t('pos.discount.type')}</p>
          <div className="grid grid-cols-2 gap-3">
            {options.map(({ value: v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={cn('flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
                  type === v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line text-ink hover:bg-canvas')}
              >
                <Icon className="h-4 w-4" /> {label}
                <span className={cn('ml-1 flex h-4 w-4 items-center justify-center rounded-full border',
                  type === v ? 'border-brand-600 bg-brand-600' : 'border-toggle-off')}>
                  {type === v && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            ))}
          </div>
        </div>
        <Field label={t('pos.discount.enter')} required>
          <Input
            type="number" min="0" step="0.01"
            placeholder={type === 'PERCENTAGE' ? t('pos.discount.placeholderPct') : t('pos.discount.placeholderAmt')}
            value={value} onChange={(e) => setValue(e.target.value)}
          />
        </Field>
      </div>
    </PosModal>
  )
}
