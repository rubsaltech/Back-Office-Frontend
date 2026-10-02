import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Plus } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea, Toggle } from '../../../../shared/ui'
import { LabelAttachEditor } from '../labels/LabelAttachEditor'
import { useGetAllLabelsQuery } from '../../../../store/api'

const empty = {
  name: '', sku: '', barcode: '', categoryId: '', status: 'ACTIVE',
  price: '', tax: '', qty: '', discountOn: false, discountTitle: '', discountAmount: '',
  description: '', labels: [],
}

function labelsFromItem(item) {
  return (item.labels ?? []).map((l) => ({ labelId: l.labelId, name: l.name, type: l.type, values: l.values ?? [] }))
}

function fromProduct(p) {
  return {
    ...empty,
    name: p.name ?? '',
    sku: p.sku ?? '',
    barcode: p.barcode ?? '',
    categoryId: p.categoryId ?? '',
    status: p.status ?? 'ACTIVE',
    price: p.price ?? '',
    tax: p.taxAmount ?? '',
    qty: p.availableQty ?? '',
    discountOn: Boolean(p.discountTitle),
    discountTitle: p.discountTitle ?? '',
    discountAmount: p.discountAmount ?? '',
    description: p.description ?? '',
    labels: labelsFromItem(p),
  }
}

function toPayload(form) {
  return {
    name: form.name,
    sku: form.sku,
    barcode: form.barcode || null,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    status: form.status,
    price: Number(form.price) || 0,
    taxAmount: Number(form.tax) || 0,
    discountTitle: form.discountOn ? form.discountTitle : null,
    discountAmount: form.discountOn ? Number(form.discountAmount) || 0 : 0,
    description: form.description || null,
    availableQty: Number(form.qty) || 0,
    totalQty: Number(form.qty) || 0,
    labels: (form.labels ?? [])
      .filter((a) => a.labelId)
      .map((a) => ({ labelId: Number(a.labelId), name: a.name, type: a.type, values: a.values ?? [] })),
  }
}

export function ProductDrawer({ open, onClose, onSave, saving, product, categories = [] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const { data: allLabels = [] } = useGetAllLabelsQuery()

  useEffect(() => {
    setForm(product ? fromProduct(product) : empty)
  }, [product, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={product ? t('inventory.product_form.editTitle') : t('inventory.product_form.addTitle')}
      footer={
        <Button className="w-full" onClick={() => onSave?.(toPayload(form))} disabled={saving}>
          <Plus className="h-4 w-4" /> {saving ? t('common.saving') : product ? t('inventory.product_form.save') : t('inventory.addProduct')}
        </Button>
      }
    >
      <div className="space-y-5">
        <button className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas text-muted">
          <Camera className="h-6 w-6" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white">
            <Plus className="h-4 w-4" />
          </span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('inventory.product_form.name')} required><Input placeholder={t('inventory.product_form.name')} value={form.name} onChange={set('name')} /></Field>
          <Field label={t('inventory.product_form.sku')} required><Input placeholder={t('inventory.product_form.sku')} value={form.sku} onChange={set('sku')} /></Field>
          <Field label={t('inventory.product_form.barcode')}><Input placeholder={t('inventory.product_form.barcode')} value={form.barcode} onChange={set('barcode')} /></Field>
          <Field label={t('inventory.product_form.category')}>
            <Select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">{t('inventory.product_form.selectCategory')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label={t('inventory.product_form.status')} required>
            <Select value={form.status} onChange={set('status')}>
              <option value="ACTIVE">{t('common.active')}</option>
              <option value="INACTIVE">{t('common.inactive')}</option>
            </Select>
          </Field>
          <Field label={t('inventory.product_form.price')} required><Input type="number" step="0.01" placeholder={t('inventory.product_form.price')} value={form.price} onChange={set('price')} /></Field>
          <Field label={t('inventory.product_form.qty')} required><Input type="number" placeholder={t('inventory.product_form.qty')} value={form.qty} onChange={set('qty')} /></Field>
          <Field label={t('inventory.product_form.tax')}><Input type="number" step="0.01" placeholder={t('inventory.product_form.tax')} value={form.tax} onChange={set('tax')} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{t('inventory.product_form.discountTitle')}</span>
              <Toggle checked={form.discountOn} onChange={(v) => setForm((f) => ({ ...f, discountOn: v }))} />
            </div>
            <Input placeholder={t('inventory.product_form.discountTitle')} value={form.discountTitle} onChange={set('discountTitle')} disabled={!form.discountOn} />
          </div>
          <Field label={t('inventory.product_form.discountAmount')}>
            <Input type="number" step="0.01" placeholder={t('inventory.product_form.discountAmount')} value={form.discountAmount} onChange={set('discountAmount')} disabled={!form.discountOn} />
          </Field>
        </div>

        <Field label={t('inventory.product_form.description')}><Textarea placeholder="…" value={form.description} onChange={set('description')} /></Field>

        {/* ---------------- Labels ---------------- */}
        <div className="border-t border-line pt-5">
          <div className="mb-3">
            <h4 className="text-lg font-semibold text-ink">{t('labels.attach.title')}</h4>
            <p className="text-xs text-muted">{t('labels.attach.subtitle')}</p>
          </div>
          <LabelAttachEditor
            labels={allLabels}
            attached={form.labels}
            onChange={(labels) => setForm((f) => ({ ...f, labels }))}
          />
        </div>
      </div>
    </Drawer>
  )
}
