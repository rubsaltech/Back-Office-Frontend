import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Plus, Trash2 } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea, Toggle, Badge } from '../../../../shared/ui'
import { useGetAllLabelsQuery } from '../../../../store/api'

// Value control for a specification: a dropdown when the chosen label defines
// options (single/multi-select), a free-text box otherwise.
function SpecValue({ label, value, placeholder, onChange }) {
  const opts = label?.options ?? []
  const asSelect = label && (label.type === 'SINGLE_SELECT' || label.type === 'MULTI_SELECT') && opts.length > 0
  if (asSelect) {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder ?? '—'}</option>
        {opts.map((o) => <option key={o.id ?? o.value} value={o.value}>{o.value}</option>)}
      </Select>
    )
  }
  return <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
}

const emptySpec = () => ({ key: '', value: '' })

const empty = {
  name: '', quantity: '', categoryId: '', status: 'ACTIVE', description: '',
  // specifications (key from labels, value typed) — shared base for all variants
  specs: [emptySpec()],
  hasVariants: false,
  // simple product (single default variant)
  defaultVariantId: null,
  sku: '', barcode: '', price: '', purchasedPrice: '', tax: '', discountTitle: '', discountAmount: '',
  // variant product
  variants: [], // { id, isNew, onHand, attrs:{key→value overrides}, sku, barcode, price, purchasedPrice, tax, discountTitle, discountAmount, quantity }
}

// Effective value for a spec key in a variant box: its override, else the base value.
const specVal = (box, spec) => (box.attrs?.[spec.key] ?? spec.value) || ''
const variantName = (box, baseSpecs) => baseSpecs.map((s) => specVal(box, s)).filter(Boolean).join(' / ')
const specsToAttrs = (specs) => Object.fromEntries(specs.filter((s) => s.key && s.value).map((s) => [s.key, s.value]))

function newBox(baseSpecs) {
  return {
    id: null, isNew: true, onHand: null, attrs: {},
    sku: '', barcode: '', price: '', purchasedPrice: '', tax: '', discountTitle: '', discountAmount: '', quantity: '',
    _keys: baseSpecs.map((s) => s.key), // just to seed; values resolve via specVal
  }
}

function fromProduct(p) {
  const variants = p.variants ?? []
  const def = variants.find((v) => v.isDefault) ?? variants[0] ?? {}
  // Base spec keys = union of all variant attribute keys; base value = default variant's.
  const keys = []
  variants.forEach((v) => Object.keys(v.attributes || {}).forEach((k) => { if (!keys.includes(k)) keys.push(k) })
  )
  const specs = keys.length
    ? keys.map((k) => ({ key: k, value: (def.attributes || {})[k] ?? '' }))
    : [emptySpec()]

  const base = {
    ...empty,
    name: p.name ?? '',
    categoryId: p.categoryId ?? '',
    status: p.status ?? 'ACTIVE',
    description: p.description ?? '',
    hasVariants: Boolean(p.hasVariants),
    specs,
  }

  if (p.hasVariants) {
    return {
      ...base,
      quantity: String(variants.reduce((s, v) => s + (v.onHand || 0), 0)),
      variants: variants.map((v) => ({
        id: v.id, isNew: false, onHand: v.onHand,
        attrs: { ...(v.attributes || {}) },
        sku: v.sku ?? '', barcode: v.barcode ?? '',
        price: v.price ?? '', purchasedPrice: v.purchasedPrice ?? '',
        tax: v.taxAmount ?? '', discountTitle: v.discountTitle ?? '', discountAmount: v.discountAmount ?? '',
        quantity: String(v.onHand ?? ''),
      })),
    }
  }
  return {
    ...base,
    defaultVariantId: def.id ?? null,
    quantity: String(def.onHand ?? ''),
    sku: def.sku ?? '', barcode: def.barcode ?? '',
    price: def.price ?? '', purchasedPrice: def.purchasedPrice ?? '',
    tax: def.taxAmount ?? '', discountTitle: def.discountTitle ?? '', discountAmount: def.discountAmount ?? '',
  }
}

function toPayload(form, isEdit) {
  const baseSpecs = form.specs.filter((s) => s.key)
  const hasVariants = form.hasVariants
  const productSku = hasVariants ? (form.variants[0]?.sku || form.name) : form.sku

  const common = {
    name: form.name,
    sku: productSku,
    barcode: hasVariants ? null : (form.barcode || null),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    status: form.status,
    taxAmount: 0, discountTitle: null, discountAmount: 0, // product-level deprecated; per-variant now
    description: form.description || null,
    hasVariants,
    labels: [],
  }

  if (!hasVariants) {
    return {
      ...common,
      variants: [{
        id: isEdit ? form.defaultVariantId : null,
        variantName: variantName({ attrs: {} }, baseSpecs) || 'Default',
        isDefault: true,
        attributes: specsToAttrs(baseSpecs),
        sku: form.sku,
        barcode: form.barcode || null,
        price: Number(form.price) || 0,
        purchasedPrice: Number(form.purchasedPrice) || 0,
        taxAmount: Number(form.tax) || 0,
        discountTitle: form.discountTitle || null,
        discountAmount: Number(form.discountAmount) || 0,
        trackingType: 'NONE',
        ...(isEdit ? {} : { openingQty: Number(form.quantity) || 0 }),
        status: form.status,
      }],
    }
  }

  return {
    ...common,
    variants: form.variants.map((box, i) => {
      const attributes = {}
      baseSpecs.forEach((s) => { const v = specVal(box, s); if (v) attributes[s.key] = v })
      return {
        id: box.id ?? null,
        variantName: variantName(box, baseSpecs) || `Variant ${i + 1}`,
        isDefault: i === 0,
        attributes,
        sku: box.sku,
        barcode: box.barcode || null,
        price: Number(box.price) || 0,
        purchasedPrice: Number(box.purchasedPrice) || 0,
        taxAmount: Number(box.tax) || 0,
        discountTitle: box.discountTitle || null,
        discountAmount: Number(box.discountAmount) || 0,
        trackingType: 'NONE',
        ...(box.isNew ? { openingQty: Number(box.quantity) || 0 } : {}),
        status: form.status,
      }
    }),
  }
}

export function ProductDrawer({ open, onClose, onSave, saving, product, categories = [] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const { data: allLabels = [] } = useGetAllLabelsQuery()
  const labelByName = useMemo(() => new Map(allLabels.map((l) => [l.name, l])), [allLabels])
  const isEdit = !!product

  useEffect(() => { setForm(product ? fromProduct(product) : empty) }, [product, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const setSpec = (i, k, v) => setForm((f) => ({ ...f, specs: f.specs.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) }))
  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, emptySpec()] }))
  const removeSpec = (i) => setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }))
  const setBox = (i, k, v) => setForm((f) => ({ ...f, variants: f.variants.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)) }))
  const setBoxAttr = (i, key, v) => setForm((f) => ({
    ...f, variants: f.variants.map((b, idx) => (idx === i ? { ...b, attrs: { ...b.attrs, [key]: v } } : b)),
  }))

  // "How many variants" → grow/shrink the list of boxes (new boxes seed from base specs).
  const setVariantCount = (n) => {
    const num = Math.max(0, Math.min(50, parseInt(n, 10) || 0))
    setForm((f) => {
      const baseSpecs = f.specs.filter((s) => s.key)
      const next = [...f.variants]
      while (next.length < num) next.push(newBox(baseSpecs))
      next.length = num
      return { ...f, variants: next }
    })
  }
  const removeBox = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))
  const addBox = () => setForm((f) => ({ ...f, variants: [...f.variants, newBox(f.specs.filter((s) => s.key))] }))

  const baseSpecs = form.specs.filter((s) => s.key)
  const totalQty = Number(form.quantity) || 0
  const allocated = form.variants.reduce((s, b) => s + (Number(b.quantity) || 0), 0)
  // On create, the variant quantities must sum to the total stock being added.
  const allocationOk = !form.hasVariants || isEdit || allocated === totalQty
  const skusOk = form.hasVariants ? form.variants.every((b) => b.sku.trim()) : form.sku.trim()
  const canSave = form.name.trim() && skusOk && allocationOk && (form.hasVariants ? form.variants.length > 0 : true)

  return (
    <Drawer
      open={open} onClose={onClose}
      width={form.hasVariants ? 'max-w-2xl' : 'max-w-xl'}
      title={product ? t('inventory.product_form.editTitle') : t('inventory.product_form.addTitle')}
      footer={
        <Button className="w-full" onClick={() => onSave?.(toPayload(form, isEdit))} disabled={saving || !canSave}>
          <Plus className="h-4 w-4" /> {saving ? t('common.saving') : product ? t('inventory.product_form.save') : t('inventory.addProduct')}
        </Button>
      }
    >
      <div className="space-y-5">
        <button className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas text-muted">
          <Camera className="h-6 w-6" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white"><Plus className="h-4 w-4" /></span>
        </button>

        {/* Name / quantity / category / status */}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('inventory.product_form.name')} required><Input placeholder={t('inventory.product_form.name')} value={form.name} onChange={set('name')} /></Field>
          <Field label={t('inventory.product_form.quantity')} required={!isEdit}
            hint={isEdit ? t('inventory.product_form.stockManagedHint') : (form.hasVariants ? t('inventory.product_form.quantityTotalHint') : undefined)}>
            <Input type="number" min="0" placeholder="0" value={form.quantity} onChange={set('quantity')} disabled={isEdit} />
          </Field>
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
        </div>

        {/* Specifications (key from labels + typed value) */}
        <div className="rounded-xl border border-line p-4">
          <p className="mb-1 text-sm font-medium text-ink">{t('inventory.product_form.specifications')}</p>
          <p className="mb-3 text-xs text-muted">{t('inventory.product_form.specificationsHint')}</p>
          {allLabels.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-muted">{t('inventory.product_form.noLabels')}</p>
          ) : (
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-36 shrink-0">
                    <Select value={s.key} onChange={(e) => setSpec(i, 'key', e.target.value)}>
                      <option value="">{t('inventory.product_form.selectLabel')}</option>
                      {allLabels.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1">
                    <SpecValue label={labelByName.get(s.key)} value={s.value} placeholder={t('inventory.product_form.value')} onChange={(v) => setSpec(i, 'value', v)} />
                  </div>
                  <button type="button" className="shrink-0 text-danger hover:opacity-80" onClick={() => removeSpec(i)}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addSpec}><Plus className="h-4 w-4" /> {t('inventory.product_form.addSpec')}</Button>
            </div>
          )}
        </div>

        {/* Has-variants toggle */}
        <div className="flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{t('inventory.product_form.hasVariants')}</p>
            <p className="text-xs text-muted">{t('inventory.product_form.hasVariantsHint')}</p>
          </div>
          <Toggle checked={form.hasVariants} onChange={(v) => setForm((f) => ({ ...f, hasVariants: v }))} />
        </div>

        {!form.hasVariants ? (
          /* Simple product */
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('inventory.sku')} required><Input value={form.sku} onChange={set('sku')} /></Field>
            <Field label={t('inventory.product_form.barcode')}><Input value={form.barcode} onChange={set('barcode')} /></Field>
            <Field label={t('inventory.product_form.price')} required><Input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={set('price')} /></Field>
            <Field label={t('inventory.product_form.purchasedPrice')}><Input type="number" step="0.01" placeholder="0.00" value={form.purchasedPrice} onChange={set('purchasedPrice')} /></Field>
            <Field label={t('inventory.product_form.tax')}><Input type="number" step="0.01" placeholder="0.00" value={form.tax} onChange={set('tax')} /></Field>
            <div />
            <Field label={t('inventory.product_form.discountTitle')}><Input value={form.discountTitle} onChange={set('discountTitle')} /></Field>
            <Field label={t('inventory.product_form.discountAmount')}><Input type="number" step="0.01" placeholder="0.00" value={form.discountAmount} onChange={set('discountAmount')} /></Field>
          </div>
        ) : (
          /* Variant product */
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <Field label={t('inventory.product_form.howManyVariants')} className="w-44">
                <Input type="number" min="0" max="50" value={form.variants.length ? String(form.variants.length) : ''} onChange={(e) => setVariantCount(e.target.value)} />
              </Field>
              {!isEdit && (
                <p className={`pb-2 text-sm ${allocationOk ? 'text-muted' : 'text-danger'}`}>
                  {t('inventory.product_form.allocated', { allocated, total: totalQty })}
                </p>
              )}
            </div>

            {form.variants.map((box, i) => (
              <div key={box.id ?? `new-${i}`} className="rounded-xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{variantName(box, baseSpecs) || `${t('inventory.variants')} ${i + 1}`}</span>
                  <div className="flex items-center gap-2">
                    {i === 0 && <Badge tone="info">{t('inventory.product_form.defaultVariant')}</Badge>}
                    <button type="button" className="text-danger hover:opacity-80" onClick={() => removeBox(i)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* editable specs for this variant */}
                {baseSpecs.length > 0 && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {baseSpecs.map((s) => (
                      <Field key={s.key} label={s.key}>
                        <SpecValue label={labelByName.get(s.key)} value={specVal(box, s)} onChange={(v) => setBoxAttr(i, s.key, v)} />
                      </Field>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Field label={t('inventory.sku')} required><Input value={box.sku} onChange={(e) => setBox(i, 'sku', e.target.value)} /></Field>
                  <Field label={t('inventory.product_form.barcode')}><Input value={box.barcode} onChange={(e) => setBox(i, 'barcode', e.target.value)} /></Field>
                  <Field label={t('inventory.product_form.price')}><Input type="number" step="0.01" value={box.price} onChange={(e) => setBox(i, 'price', e.target.value)} /></Field>
                  <Field label={t('inventory.product_form.purchasedPrice')}><Input type="number" step="0.01" value={box.purchasedPrice} onChange={(e) => setBox(i, 'purchasedPrice', e.target.value)} /></Field>
                  <Field label={t('inventory.product_form.tax')}><Input type="number" step="0.01" value={box.tax} onChange={(e) => setBox(i, 'tax', e.target.value)} /></Field>
                  {box.isNew
                    ? <Field label={t('inventory.product_form.quantity')}><Input type="number" min="0" value={box.quantity} onChange={(e) => setBox(i, 'quantity', e.target.value)} /></Field>
                    : <Field label={t('inventory.availableQty')} hint={t('inventory.product_form.stockManagedHint')}><Input value={box.onHand ?? 0} disabled /></Field>}
                  <Field label={t('inventory.product_form.discountTitle')}><Input value={box.discountTitle} onChange={(e) => setBox(i, 'discountTitle', e.target.value)} /></Field>
                  <Field label={t('inventory.product_form.discountAmount')}><Input type="number" step="0.01" value={box.discountAmount} onChange={(e) => setBox(i, 'discountAmount', e.target.value)} /></Field>
                </div>
              </div>
            ))}

            <Button variant="secondary" size="sm" onClick={addBox}><Plus className="h-4 w-4" /> {t('inventory.product_form.addVariant')}</Button>
          </div>
        )}

        <Field label={t('inventory.product_form.description')}><Textarea placeholder="…" value={form.description} onChange={set('description')} /></Field>
      </div>
    </Drawer>
  )
}
