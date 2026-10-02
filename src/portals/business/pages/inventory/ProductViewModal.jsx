import { useTranslation } from 'react-i18next'
import { Modal } from '../../../../shared/Overlay'
import { Button, Badge, Avatar } from '../../../../shared/ui'
import { money } from '../../../../lib/format'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  )
}

export function ProductViewModal({ open, product, onClose, onEdit }) {
  const { t } = useTranslation()
  const p = product

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('inventory.viewTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
          {onEdit && <Button onClick={() => onEdit(p)}>{t('common.edit')}</Button>}
        </>
      }
    >
      {p && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={p.name} src={p.imageUrl} size={48} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{p.name}</p>
              <Badge tone={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {t(`common.${p.status === 'ACTIVE' ? 'active' : 'inactive'}`)}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-line rounded-xl border border-line px-4">
            <Row label={t('inventory.sku')}>{p.sku || '—'}</Row>
            <Row label={t('inventory.product_form.barcode')}>{p.barcode || '—'}</Row>
            <Row label={t('inventory.category')}>{p.categoryName || '—'}</Row>
            <Row label={t('common.price')}>{money(p.price)}</Row>
            <Row label={t('inventory.product_form.tax')}>{money(p.taxAmount)}</Row>
            {p.discountTitle && (
              <Row label={p.discountTitle}>−{money(p.discountAmount)}</Row>
            )}
            <Row label={t('inventory.availableQty')}>{p.availableQty}</Row>
            <Row label={t('inventory.quantitySold')}>{p.quantitySold}</Row>
            <Row label={t('inventory.totalQty')}>{p.totalQty}</Row>
          </div>

          {p.description && (
            <div>
              <p className="mb-1 text-sm font-medium text-ink">{t('inventory.product_form.description')}</p>
              <p className="whitespace-pre-line text-sm text-muted">{p.description}</p>
            </div>
          )}

          {p.labels?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">{t('labels.attach.title')}</p>
              <div className="space-y-2">
                {p.labels.map((l) => (
                  <div key={l.id ?? l.labelId} className="rounded-xl border border-line px-4 py-2.5 text-sm">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-ink">{l.name}</span>
                      <span className="text-xs text-muted">{t(`labels.types.${l.type}`)}</span>
                    </div>
                    {l.values?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {l.values.map((v, i) => (
                          <span key={i} className="rounded-lg bg-canvas px-2.5 py-1 text-xs text-ink">{v}</span>
                        ))}
                      </div>
                    ) : <span className="text-xs text-muted">—</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
