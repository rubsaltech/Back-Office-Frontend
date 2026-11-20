import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { PosModal } from './PosOverlay'
import { Button, Field, Input } from '../../../../shared/ui'

/**
 * Capture-at-sale values (e.g. IMEI1, IMEI2) for a product, one set per unit.
 * Required: every field of every unit must be filled before confirming.
 * Returns an array of {labelName: value} maps — one per unit.
 */
export function CaptureModal({ open, product, variant, labels = [], onClose, onConfirm }) {
  const { t } = useTranslation()
  const [units, setUnits] = useState([{}])

  useEffect(() => { if (open) setUnits([{}]) }, [open, product, variant])

  const setVal = (idx, label, v) => setUnits((u) => u.map((unit, i) => (i === idx ? { ...unit, [label]: v } : unit)))
  const addUnit = () => setUnits((u) => [...u, {}])
  const removeUnit = (idx) => setUnits((u) => (u.length > 1 ? u.filter((_, i) => i !== idx) : u))

  const complete = units.length > 0 && units.every((unit) => labels.every((l) => (unit[l] ?? '').trim()))
  if (!product) return null
  const title = product.name + (variant && !variant.isDefault ? ` · ${variant.variantName}` : '')

  return (
    <PosModal
      open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => onConfirm(units.map((u) => ({ ...u })))} disabled={!complete}>
            {t('pos.capture.add', { count: units.length })}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-muted">{t('pos.capture.hint')}</p>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {units.map((unit, idx) => (
          <div key={idx} className="rounded-xl border border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{t('pos.capture.unit', { n: idx + 1 })}</span>
              {units.length > 1 && (
                <button type="button" className="text-danger hover:opacity-80" onClick={() => removeUnit(idx)}><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
            <div className="space-y-2">
              {labels.map((l) => (
                <Field key={l} label={l}>
                  <Input autoFocus={idx === units.length - 1 && l === labels[0]} value={unit[l] ?? ''} placeholder={l} onChange={(e) => setVal(idx, l, e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mt-3" onClick={addUnit}><Plus className="h-4 w-4" /> {t('pos.capture.addUnit')}</Button>
    </PosModal>
  )
}
