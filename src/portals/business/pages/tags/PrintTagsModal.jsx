import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { Modal } from '../../../../shared/Overlay'
import { Button, Field, Input, Select } from '../../../../shared/ui'
import { printTags, barcodeSvg, tagSpecs } from './tags-print'

const variantLabel = (v) => (v?.isDefault ? '' : (Object.values(v?.attributes ?? {}).filter(Boolean).join(' / ') || v?.variantName || ''))

export function PrintTagsModal({ open, product, onClose }) {
  const { t } = useTranslation()
  const variants = product?.variants ?? []
  const [variantId, setVariantId] = useState(null)
  const [qty, setQty] = useState('1')

  useEffect(() => {
    if (open && variants.length) {
      const def = variants.find((v) => v.isDefault) ?? variants[0]
      setVariantId(def?.id ?? null)
      setQty('1')
    }
  }, [open, product]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return null
  const variant = variants.find((v) => v.id === variantId) ?? variants[0]
  const value = variant?.barcode || variant?.sku || ''
  const svg = value ? barcodeSvg(value, { height: 36, fontSize: 12 }) : ''
  const n = Math.max(1, Number(qty) || 1)

  return (
    <Modal
      open={open} onClose={onClose} title={t('tags.printFor', { name: product.name })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => printTags({ product, variant, quantity: n })} disabled={!value}>
            <Printer className="h-4 w-4" /> {t('tags.print')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {variants.length > 1 && (
          <Field label={t('tags.selectVariant')}>
            <Select value={variantId ?? ''} onChange={(e) => setVariantId(Number(e.target.value))}>
              {variants.map((v) => <option key={v.id} value={v.id}>{variantLabel(v) || t('inventory.simple')} · {v.sku}</option>)}
            </Select>
          </Field>
        )}
        <Field label={t('tags.quantity')}>
          <Input type="number" min="1" max="500" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">{t('tags.preview')}</p>
          {value ? (
            <div
              className="mx-auto overflow-hidden rounded-md border border-line bg-white text-left text-black"
              style={{ width: '50mm', height: '30mm', padding: '1.5mm 3mm' }}
            >
              <p style={{ fontSize: '11px', lineHeight: 1.15, marginBottom: '1mm' }}>{product.name}</p>
              {tagSpecs(variant).length > 0 && (
                <p style={{ fontSize: '9px', lineHeight: 1.3, wordBreak: 'break-word' }}>
                  {tagSpecs(variant).map(([k, v]) => `${k}: ${v}`).join(' - ')}
                </p>
              )}
              <div style={{ marginTop: '1mm', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
          ) : (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{t('tags.noCode')}</p>
          )}
          <p className="mt-2 text-center text-xs text-muted">{t('tags.willPrint', { count: n })}</p>
        </div>
      </div>
    </Modal>
  )
}
