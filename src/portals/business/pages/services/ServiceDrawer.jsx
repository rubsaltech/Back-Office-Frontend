import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea } from '../../../../shared/ui'

const empty = { name: '', description: '', price: '', status: 'ACTIVE', products: [] }

function fromService(s) {
  return {
    name: s.name ?? '',
    description: s.description ?? '',
    price: s.price ?? '',
    status: s.status ?? 'ACTIVE',
    products: (s.products ?? []).map((p) => ({
      productId: p.productId != null ? String(p.productId) : '',
      quantity: p.quantity ?? 1,
    })),
  }
}

export function ServiceDrawer({ open, onClose, onSave, saving, service, products = [] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)

  useEffect(() => { setForm(service ? fromService(service) : empty) }, [service, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const addLine = () => setForm((f) => ({ ...f, products: [...f.products, { productId: '', quantity: 1 }] }))
  const removeLine = (i) => setForm((f) => ({ ...f, products: f.products.filter((_, idx) => idx !== i) }))
  const setLine = (i, k, v) => setForm((f) => ({
    ...f,
    products: f.products.map((line, idx) => (idx === i ? { ...line, [k]: v } : line)),
  }))

  const submit = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price === '' ? 0 : Number(form.price),
      status: form.status,
      products: form.products
        .filter((line) => line.productId)
        .map((line, i) => ({
          productId: Number(line.productId),
          quantity: Number(line.quantity) > 0 ? Number(line.quantity) : 1,
          sortOrder: i,
        })),
    }
    onSave?.(payload)
  }

  return (
    <Drawer
      open={open} onClose={onClose}
      title={service ? t('services.form.editTitle') : t('services.form.addTitle')}
      footer={
        <Button className="w-full" onClick={submit} disabled={saving || !form.name.trim()}>
          {saving ? t('services.form.saving') : service ? t('services.form.save') : t('services.form.create')}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label={t('services.form.name')} required>
          <Input placeholder={t('services.form.namePlaceholder')} value={form.name} onChange={set('name')} />
        </Field>

        <Field label={t('services.form.description')}>
          <Textarea rows={3} value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('services.form.price')}>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
          </Field>
          <Field label={t('services.form.status')}>
            <Select value={form.status} onChange={set('status')}>
              <option value="ACTIVE">{t('common.active')}</option>
              <option value="INACTIVE">{t('common.inactive')}</option>
            </Select>
          </Field>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">{t('services.form.products')}</p>
            <Button variant="secondary" size="sm" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" /> {t('services.form.addProduct')}
            </Button>
          </div>
          <p className="mb-3 text-xs text-muted">{t('services.form.productsHint')}</p>

          {form.products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              {t('services.form.noProducts')}
            </p>
          ) : (
            <div className="space-y-3">
              {form.products.map((line, i) => (
                <div key={i} className="flex items-end gap-2">
                  <Field label={t('services.form.product')} className="flex-1">
                    <Select value={line.productId} onChange={(e) => setLine(i, 'productId', e.target.value)}>
                      <option value="">{t('services.form.selectProduct')}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </Field>
                  <Field label={t('services.form.quantity')} className="w-20">
                    <Input type="number" min="1" value={line.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} />
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-danger hover:bg-canvas"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}
