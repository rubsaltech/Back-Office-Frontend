import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Plus, X, Trash2 } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea, Toggle } from '../../../../shared/ui'
import { cn } from '../../../../lib/cn'
import { CUSTOMIZATION_TEMPLATES } from '../../data/customizations'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const blankOption = () => ({ uid: uid(), name: '', price: 0, isDefault: false })
const blankGroup = () => ({ uid: uid(), name: '', selection: 'single', required: false, options: [blankOption()] })

function groupFromTemplate(tpl) {
  return {
    uid: uid(),
    name: tpl.name,
    selection: tpl.selection,
    required: tpl.required,
    options: tpl.options.map((o) => ({ uid: uid(), name: o.name, price: o.price, isDefault: false })),
  }
}

const empty = {
  name: '', sku: '', barcode: '', categoryId: '', status: 'ACTIVE',
  price: '', tax: '', qty: '', discountOn: false, discountTitle: '', discountAmount: '',
  description: '', modifiersOn: true, groups: [groupFromTemplate(CUSTOMIZATION_TEMPLATES[0])],
}

function fromProduct(p) {
  const groups = (p.modifierGroups ?? []).map((g) => ({
    uid: uid(),
    name: g.name,
    selection: g.maxSelect > 1 ? 'multiple' : 'single',
    required: g.required,
    options: (g.options ?? []).map((o) => ({ uid: uid(), name: o.name, price: o.priceDelta, isDefault: o.isDefault })),
  }))
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
    modifiersOn: groups.length > 0,
    groups: groups.length > 0 ? groups : [blankGroup()],
  }
}

function toPayload(form) {
  const modifierGroups = form.modifiersOn
    ? form.groups
        .filter((g) => g.name.trim() && g.options.some((o) => o.name.trim()))
        .map((g, gi) => {
          const options = g.options.filter((o) => o.name.trim())
          return {
            name: g.name.trim(),
            required: g.required,
            minSelect: g.required ? 1 : 0,
            maxSelect: g.selection === 'single' ? 1 : Math.max(1, options.length),
            sortOrder: gi,
            options: options.map((o, oi) => ({
              name: o.name.trim(),
              priceDelta: Number(o.price) || 0,
              isDefault: !!o.isDefault,
              sortOrder: oi,
            })),
          }
        })
    : []
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
    modifierGroups,
  }
}

export function ProductDrawer({ open, onClose, onSave, saving, product, categories = [] }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)

  // Display name for a predefined template (falls back to the raw name).
  const tName = (name) => t(`inventory.customizations.templates.${name}`, name)

  useEffect(() => {
    setForm(product ? fromProduct(product) : { ...empty, groups: [groupFromTemplate(CUSTOMIZATION_TEMPLATES[0])] })
  }, [product, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  // ---- customization group helpers ----
  const addTemplate = (tpl) => {
    const group = groupFromTemplate(tpl)
    group.name = tName(tpl.name)
    setForm((f) => ({ ...f, groups: [...f.groups, group] }))
  }
  const addCustom = () => setForm((f) => ({ ...f, groups: [...f.groups, blankGroup()] }))
  const removeGroup = (gid) => setForm((f) => ({ ...f, groups: f.groups.filter((g) => g.uid !== gid) }))
  const patchGroup = (gid, patch) =>
    setForm((f) => ({ ...f, groups: f.groups.map((g) => (g.uid === gid ? { ...g, ...patch } : g)) }))
  const addOption = (gid) =>
    setForm((f) => ({ ...f, groups: f.groups.map((g) => (g.uid === gid ? { ...g, options: [...g.options, blankOption()] } : g)) }))
  const removeOption = (gid, oid) =>
    setForm((f) => ({ ...f, groups: f.groups.map((g) => (g.uid === gid ? { ...g, options: g.options.filter((o) => o.uid !== oid) } : g)) }))
  const patchOption = (gid, oid, patch) =>
    setForm((f) => ({
      ...f,
      groups: f.groups.map((g) =>
        g.uid === gid ? { ...g, options: g.options.map((o) => (o.uid === oid ? { ...o, ...patch } : o)) } : g,
      ),
    }))
  const setDefault = (gid, oid) =>
    setForm((f) => ({
      ...f,
      groups: f.groups.map((g) => {
        if (g.uid !== gid) return g
        if (g.selection === 'single') {
          return { ...g, options: g.options.map((o) => ({ ...o, isDefault: o.uid === oid })) }
        }
        return { ...g, options: g.options.map((o) => (o.uid === oid ? { ...o, isDefault: !o.isDefault } : o)) }
      }),
    }))

  const usedNames = form.groups.map((g) => g.name.toLowerCase())

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

        {/* ---------------- Customizations ---------------- */}
        <div className="border-t border-line pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-ink">{t('inventory.customizations.title')}</h4>
              <p className="text-xs text-muted">{t('inventory.customizations.subtitle')}</p>
            </div>
            <Toggle checked={form.modifiersOn} onChange={(v) => setForm((f) => ({ ...f, modifiersOn: v }))} />
          </div>

          {form.modifiersOn && (
            <div className="space-y-4">
              {/* predefined templates */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('inventory.customizations.addPredefined')}</p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMIZATION_TEMPLATES.map((tpl) => {
                    const used = usedNames.includes(tName(tpl.name).toLowerCase())
                    return (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => addTemplate(tpl)}
                        className={cn(
                          'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                          used ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-line text-ink hover:bg-canvas',
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" /> {tName(tpl.name)}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={addCustom}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('inventory.customizations.custom')}
                  </button>
                </div>
              </div>

              {form.groups.length === 0 && (
                <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-muted">
                  {t('inventory.customizations.empty')}
                </p>
              )}

              {form.groups.map((g) => (
                <GroupCard
                  key={g.uid}
                  group={g}
                  onPatch={(patch) => patchGroup(g.uid, patch)}
                  onRemove={() => removeGroup(g.uid)}
                  onAddOption={() => addOption(g.uid)}
                  onPatchOption={(oid, patch) => patchOption(g.uid, oid, patch)}
                  onRemoveOption={(oid) => removeOption(g.uid, oid)}
                  onSetDefault={(oid) => setDefault(g.uid, oid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}

function GroupCard({ group, onPatch, onRemove, onAddOption, onPatchOption, onRemoveOption, onSetDefault }) {
  const { t } = useTranslation()
  const single = group.selection === 'single'
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-[140px] flex-1 bg-white"
          placeholder={t('inventory.customizations.namePlaceholder')}
          value={group.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <Select
          className="h-9 w-32 bg-white text-sm"
          value={group.selection}
          onChange={(e) => onPatch({ selection: e.target.value })}
        >
          <option value="single">{t('inventory.customizations.pickOne')}</option>
          <option value="multiple">{t('inventory.customizations.pickMany')}</option>
        </Select>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
          {t('inventory.customizations.required')}
          <Toggle checked={group.required} onChange={(v) => onPatch({ required: v })} />
        </label>
        <button type="button" onClick={onRemove} className="ml-auto text-danger hover:text-danger-strong" title={t('inventory.customizations.removeGroup')}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {group.options.map((o) => (
          <div key={o.uid} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetDefault(o.uid)}
              title={t('inventory.customizations.setDefault')}
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center border',
                single ? 'rounded-full' : 'rounded',
                o.isDefault ? 'border-brand-700 bg-brand-700 text-white' : 'border-toggle-off',
              )}
            >
              {o.isDefault && (single ? <span className="h-2 w-2 rounded-full bg-white" /> : '✓')}
            </button>
            <Input
              className="h-9 flex-1 bg-white"
              placeholder={t('inventory.customizations.optionPlaceholder')}
              value={o.name}
              onChange={(e) => onPatchOption(o.uid, { name: e.target.value })}
            />
            <div className="relative w-28">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">+</span>
              <Input
                type="number"
                step="0.01"
                className="h-9 bg-white pl-6"
                placeholder="0.00"
                value={o.price}
                onChange={(e) => onPatchOption(o.uid, { price: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveOption(o.uid)}
              className="text-muted hover:text-danger"
              title={t('inventory.customizations.removeOption')}
              disabled={group.options.length <= 1}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={onAddOption}>
          <Plus className="h-4 w-4" /> {t('inventory.customizations.addOption')}
        </Button>
      </div>
    </div>
  )
}
