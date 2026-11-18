import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Plus, Trash2, Wand2 } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea, Toggle, Badge } from '../../../../shared/ui'
import { LabelAttachEditor } from '../labels/LabelAttachEditor'
import { useGetAllLabelsQuery } from '../../../../store/api'

const emptyOption = () => ({ name: '', values: '' })

const empty = {
  name: '', sku: '', barcode: '', categoryId: '', status: 'ACTIVE',
  tax: '', discountOn: false, discountTitle: '', discountAmount: '', description: '',
  hasVariants: false,
  // simple-mode (maps to the single default variant)
  defaultVariantId: null,
  price: '', purchasedPrice: '', qty: '', onHand: null, lowStockThreshold: '', serial: false,
  // variant-mode
  options: [emptyOption()],
  variants: [],
  labels: [],
}

const variantLabel = (attrs) => Object.values(attrs || {}).filter(Boolean).join(' / ') || 'Default'
const attrsKey = (attrs) => Object.entries(attrs || {}).map(([k, v]) => `${k}=${v}`).join('|')

function labelsFromItem(item) {
  return (item.labels ?? []).map((l) => ({ labelId: l.labelId, name: l.name, type: l.type, values: l.values ?? [] }))
}

function fromProduct(p) {
  const variants = p.variants ?? []
  const def = variants.find((v) => v.isDefault) ?? variants[0] ?? {}
  const base = {
    ...empty,
    name: p.name ?? '',
    sku: p.sku ?? '',
    barcode: p.barcode ?? '',
    categoryId: p.categoryId ?? '',
    status: p.status ?? 'ACTIVE',
    tax: p.taxAmount ?? '',
    discountOn: Boolean(p.discountTitle),
    discountTitle: p.discountTitle ?? '',
    discountAmount: p.discountAmount ?? '',
    description: p.description ?? '',
    hasVariants: Boolean(p.hasVariants),
    labels: labelsFromItem(p),
  }
  if (p.hasVariants) {
    // Rebuild the options builder from the union of variant attribute keys/values.
    const optionMap = {}
    variants.forEach((v) => Object.entries(v.attributes || {}).forEach(([k, val]) => {
      optionMap[k] = optionMap[k] || new Set()
      if (val) optionMap[k].add(val)
    }))
    const options = Object.keys(optionMap).map((name) => ({ name, values: [...optionMap[name]].join(', ') }))
    return {
      ...base,
      options: options.length ? options : [emptyOption()],
      variants: variants.map((v) => ({
        id: v.id, isNew: false, attributes: v.attributes || {},
        variantName: v.variantName, sku: v.sku ?? '', barcode: v.barcode ?? '',
        price: v.price ?? '', purchasedPrice: v.purchasedPrice ?? '',
        onHand: v.onHand, openingQty: '', lowStockThreshold: v.lowStockThreshold ?? '',
        serial: v.trackingType === 'SERIAL',
      })),
    }
  }
  return {
    ...base,
    defaultVariantId: def.id ?? null,
    price: def.price ?? '',
    purchasedPrice: def.purchasedPrice ?? '',
    qty: def.onHand ?? '',
    onHand: def.onHand ?? null,
    lowStockThreshold: def.lowStockThreshold ?? '',
    serial: def.trackingType === 'SERIAL',
  }
}

function toPayload(form, isEdit) {
  const base = {
    name: form.name,
    sku: form.sku,
    barcode: form.barcode || null,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    status: form.status,
    taxAmount: Number(form.tax) || 0,
    discountTitle: form.discountOn ? form.discountTitle : null,
    discountAmount: form.discountOn ? Number(form.discountAmount) || 0 : 0,
    description: form.description || null,
    hasVariants: form.hasVariants,
    labels: (form.labels ?? [])
      .filter((a) => a.labelId)
      .map((a) => ({ labelId: Number(a.labelId), name: a.name, type: a.type, values: a.values ?? [] })),
  }

  if (!form.hasVariants) {
    return {
      ...base,
      hasVariants: false,
      variants: [{
        id: isEdit ? form.defaultVariantId : null,
        variantName: 'Default',
        isDefault: true,
        attributes: {},
        sku: form.sku,
        barcode: form.barcode || null,
        price: Number(form.price) || 0,
        purchasedPrice: Number(form.purchasedPrice) || 0,
        trackingType: form.serial ? 'SERIAL' : 'NONE',
        lowStockThreshold: form.lowStockThreshold === '' ? null : Number(form.lowStockThreshold) || 0,
        // opening stock only on create; stock is managed via Inventory thereafter
        ...(isEdit ? {} : { openingQty: Number(form.qty) || 0 }),
        status: form.status,
      }],
    }
  }

  return {
    ...base,
    variants: (form.variants ?? []).map((row, i) => ({
      id: row.id ?? null,
      variantName: row.variantName || variantLabel(row.attributes),
      isDefault: i === 0,
      attributes: row.attributes || {},
      sku: row.sku,
      barcode: row.barcode || null,
      price: Number(row.price) || 0,
      purchasedPrice: Number(row.purchasedPrice) || 0,
      trackingType: row.serial ? 'SERIAL' : 'NONE',
      lowStockThreshold: row.lowStockThreshold === '' ? null : Number(row.lowStockThreshold) || 0,
      ...(row.isNew ? { openingQty: Number(row.openingQty) || 0 } : {}),
      status: form.status,
    })),
  }
}

// Cartesian product of the option builder → variant rows (preserving ids of matching combos).
function generateVariants(options, existing) {
  const clean = options
    .map((o) => ({ name: o.name.trim(), values: o.values.split(',').map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length)
  if (!clean.length) return existing
  let combos = [{}]
  clean.forEach((o) => {
    const next = []
    combos.forEach((c) => o.values.forEach((val) => next.push({ ...c, [o.name]: val })))
    combos = next
  })
  const byKey = Object.fromEntries((existing ?? []).map((r) => [attrsKey(r.attributes), r]))
  return combos.map((attrs) => {
    const prior = byKey[attrsKey(attrs)]
    if (prior) return { ...prior, attributes: attrs, variantName: variantLabel(attrs) }
    return {
      id: null, isNew: true, attributes: attrs, variantName: variantLabel(attrs),
      sku: '', barcode: '', price: '', purchasedPrice: '', onHand: null, openingQty: '',
      lowStockThreshold: '', serial: false,
    }
  })
}

export function ProductDrawer({ open, onClose, onSave, saving, product, categories = [] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const { data: allLabels = [] } = useGetAllLabelsQuery()

  useEffect(() => {
    setForm(product ? fromProduct(product) : empty)
  }, [product, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const setOption = (i, k, v) => setForm((f) => ({
    ...f, options: f.options.map((o, idx) => (idx === i ? { ...o, [k]: v } : o)),
  }))
  const setVariant = (i, k, v) => setForm((f) => ({
    ...f, variants: f.variants.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)),
  }))
  const isEdit = !!product

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={form.hasVariants ? 'max-w-2xl' : 'max-w-xl'}
      title={product ? t('inventory.product_form.editTitle') : t('inventory.product_form.addTitle')}
      footer={
        <Button className="w-full" onClick={() => onSave?.(toPayload(form, isEdit))} disabled={saving}>
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
          <Field label={t('inventory.product_form.tax')}><Input type="number" step="0.01" placeholder={t('inventory.product_form.tax')} value={form.tax} onChange={set('tax')} /></Field>
          {!form.hasVariants && (
            <Field label={t('inventory.product_form.barcode')}><Input placeholder={t('inventory.product_form.barcode')} value={form.barcode} onChange={set('barcode')} /></Field>
          )}
        </div>

        {/* ---------------- Variants toggle ---------------- */}
        <div className="flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{t('inventory.product_form.hasVariants')}</p>
            <p className="text-xs text-muted">{t('inventory.product_form.hasVariantsHint')}</p>
          </div>
          <Toggle checked={form.hasVariants} onChange={(v) => setForm((f) => ({ ...f, hasVariants: v }))} />
        </div>

        {!form.hasVariants ? (
          /* ---------------- Simple product (single default variant) ---------------- */
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('inventory.product_form.price')} required><Input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={set('price')} /></Field>
            <Field label={t('inventory.product_form.purchasedPrice')}><Input type="number" step="0.01" placeholder="0.00" value={form.purchasedPrice} onChange={set('purchasedPrice')} /></Field>
            {isEdit ? (
              <Field label={t('inventory.availableQty')} hint={t('inventory.product_form.stockManagedHint')}>
                <Input value={form.onHand ?? 0} disabled />
              </Field>
            ) : form.serial ? (
              <Field label={t('inventory.product_form.qty')} hint={t('inventory.product_form.serialOpeningHint')}>
                <Input value="" placeholder="—" disabled />
              </Field>
            ) : (
              <Field label={t('inventory.product_form.qty')} required><Input type="number" placeholder="0" value={form.qty} onChange={set('qty')} /></Field>
            )}
            <Field label={t('inventory.product_form.lowStockThreshold')} hint={t('inventory.product_form.lowStockHint')}><Input type="number" placeholder="5" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} /></Field>
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-line px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-ink">{t('inventory.product_form.serialTracked')}</span>
                <p className="text-xs text-muted">{t('inventory.product_form.serialHint')}</p>
              </div>
              <Toggle checked={form.serial} onChange={(v) => setForm((f) => ({ ...f, serial: v }))} />
            </div>
          </div>
        ) : (
          /* ---------------- Variant builder ---------------- */
          <div className="space-y-4">
            <div className="rounded-xl border border-line p-4">
              <p className="mb-2 text-sm font-medium text-ink">{t('inventory.product_form.options')}</p>
              <div className="space-y-2">
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="w-40" placeholder={t('inventory.product_form.optionName')} value={o.name} onChange={(e) => setOption(i, 'name', e.target.value)} />
                    <Input className="flex-1" placeholder={t('inventory.product_form.optionValues')} value={o.values} onChange={(e) => setOption(i, 'values', e.target.value)} />
                    <button className="text-danger hover:opacity-80" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, options: [...f.options, emptyOption()] }))}><Plus className="h-4 w-4" /> {t('inventory.product_form.addOption')}</Button>
                <Button size="sm" onClick={() => setForm((f) => ({ ...f, variants: generateVariants(f.options, f.variants) }))}><Wand2 className="h-4 w-4" /> {t('inventory.product_form.generate')}</Button>
              </div>
            </div>

            {form.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">{t('inventory.product_form.variantsCount', { count: form.variants.length })}</p>
                {form.variants.map((row, i) => (
                  <div key={row.id ?? `new-${i}`} className="rounded-xl border border-line p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{variantLabel(row.attributes)}</span>
                      {i === 0 && <Badge tone="info">{t('inventory.product_form.defaultVariant')}</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label={t('inventory.sku')}><Input value={row.sku} onChange={(e) => setVariant(i, 'sku', e.target.value)} /></Field>
                      <Field label={t('common.price')}><Input type="number" step="0.01" value={row.price} onChange={(e) => setVariant(i, 'price', e.target.value)} /></Field>
                      {!row.isNew
                        ? <Field label={t('inventory.availableQty')} hint={t('inventory.product_form.stockManagedHint')}><Input value={row.onHand ?? 0} disabled /></Field>
                        : row.serial
                          ? <Field label={t('inventory.product_form.qty')} hint={t('inventory.product_form.serialOpeningHint')}><Input value="" placeholder="—" disabled /></Field>
                          : <Field label={t('inventory.product_form.qty')}><Input type="number" value={row.openingQty} onChange={(e) => setVariant(i, 'openingQty', e.target.value)} /></Field>}
                      <Field label={t('inventory.product_form.lowStockThreshold')}><Input type="number" value={row.lowStockThreshold} onChange={(e) => setVariant(i, 'lowStockThreshold', e.target.value)} /></Field>
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" checked={row.serial} onChange={(e) => setVariant(i, 'serial', e.target.checked)} />
                      {t('inventory.product_form.serialTracked')}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- Discount ---------------- */}
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
