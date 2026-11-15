import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { PosModal } from './PosOverlay'
import { Button } from '../../../../shared/ui'
import { Loading, ErrorState } from '../../../../shared/States'
import { useGetVariantUnitsQuery } from '../../../../store/api'

/**
 * Pick which serialized unit(s) (IMEI / serial) of a variant to sell. Only
 * in-stock units are offered, minus any already chosen for this variant in the
 * cart. Confirming returns [{ id, serial }] for the selected units.
 */
export function UnitPickerModal({ open, product, variant, excludeIds = [], onClose, onConfirm }) {
  const { t } = useTranslation()
  const { data: units = [], isLoading, isError, error } = useGetVariantUnitsQuery(variant?.id, { skip: !open || !variant })
  const [picked, setPicked] = useState([])

  useEffect(() => { if (open) setPicked([]) }, [open, variant])

  const available = useMemo(
    () => units.filter((u) => u.status === 'IN_STOCK' && !excludeIds.includes(u.id)),
    [units, excludeIds],
  )

  const toggle = (u) =>
    setPicked((p) => (p.find((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : [...p, { id: u.id, serial: u.serial }]))

  if (!variant) return null
  const title = product?.name + (variant.isDefault ? '' : ` · ${variant.variantName}`)

  return (
    <PosModal
      open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => onConfirm(picked)} disabled={picked.length === 0}>
            {t('pos.builder.addUnits', { count: picked.length })}
          </Button>
        </div>
      }
    >
      <p className="mb-2 text-sm text-muted">{t('pos.builder.selectUnits')}</p>
      {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : available.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t('inventory.stock.out')}</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {available.map((u) => {
            const on = !!picked.find((x) => x.id === u.id)
            return (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${on ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-300'}`}
              >
                <span className="truncate font-mono text-sm text-ink">{u.serial}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line text-transparent'}`}>
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </PosModal>
  )
}
