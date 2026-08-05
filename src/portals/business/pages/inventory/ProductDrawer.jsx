import { useState, useEffect } from 'react'
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
  const [form, setForm] = useState(empty)

  useEffect(() => {
    setForm(product ? fromProduct(product) : { ...empty, groups: [groupFromTemplate(CUSTOMIZATION_TEMPLATES[0])] })
  }, [product, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  // ---- customization group helpers ----
  const addTemplate = (tpl) => setForm((f) => ({ ...f, groups: [...f.groups, groupFromTemplate(tpl)] }))
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
      title={product ? 'Edit Product' : 'Add New Product'}
      footer={
        <Button className="w-full" onClick={() => onSave?.(toPayload(form))} disabled={saving}>
          <Plus className="h-4 w-4" /> {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
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
          <Field label="Product Name" required><Input placeholder="Enter product name" value={form.name} onChange={set('name')} /></Field>
          <Field label="SKU Code" required><Input placeholder="Enter code" value={form.sku} onChange={set('sku')} /></Field>
          <Field label="Barcode"><Input placeholder="Enter code" value={form.barcode} onChange={set('barcode')} /></Field>
          <Field label="Category">
            <Select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Status" required>
            <Select value={form.status} onChange={set('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
          <Field label="Price" required><Input type="number" step="0.01" placeholder="Enter price" value={form.price} onChange={set('price')} /></Field>
          <Field label="Qty" required><Input type="number" placeholder="Enter Qty" value={form.qty} onChange={set('qty')} /></Field>
          <Field label="Tax"><Input type="number" step="0.01" placeholder="Enter tax" value={form.tax} onChange={set('tax')} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Discount Title</span>
              <Toggle checked={form.discountOn} onChange={(v) => setForm((f) => ({ ...f, discountOn: v }))} />
            </div>
            <Input placeholder="Enter title" value={form.discountTitle} onChange={set('discountTitle')} disabled={!form.discountOn} />
          </div>
          <Field label="Discount Amount">
            <Input type="number" step="0.01" placeholder="Enter amount" value={form.discountAmount} onChange={set('discountAmount')} disabled={!form.discountOn} />
          </Field>
        </div>

        <Field label="Product Description"><Textarea placeholder="Write..." value={form.description} onChange={set('description')} /></Field>

        {/* ---------------- Customizations ---------------- */}
        <div className="border-t border-line pt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-ink">Customizations</h4>
              <p className="text-xs text-muted">Add options like size, add-ons or style — each with its own price.</p>
            </div>
            <Toggle checked={form.modifiersOn} onChange={(v) => setForm((f) => ({ ...f, modifiersOn: v }))} />
          </div>

          {form.modifiersOn && (
            <div className="space-y-4">
              {/* predefined templates */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Add a predefined customization</p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMIZATION_TEMPLATES.map((tpl) => {
                    const used = usedNames.includes(tpl.name.toLowerCase())
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
                        <Plus className="h-3.5 w-3.5" /> {tpl.name}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={addCustom}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Custom customization
                  </button>
                </div>
              </div>

              {form.groups.length === 0 && (
                <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-muted">
                  No customizations yet. Pick a predefined one above or create your own.
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
  const single = group.selection === 'single'
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-[140px] flex-1 bg-white"
          placeholder="Customization name (e.g. Size)"
          value={group.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <Select
          className="h-9 w-32 bg-white text-sm"
          value={group.selection}
          onChange={(e) => onPatch({ selection: e.target.value })}
        >
          <option value="single">Pick one</option>
          <option value="multiple">Pick many</option>
        </Select>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
          Required
          <Toggle checked={group.required} onChange={(v) => onPatch({ required: v })} />
        </label>
        <button type="button" onClick={onRemove} className="ml-auto text-danger hover:text-danger-strong" title="Remove customization">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {group.options.map((o) => (
          <div key={o.uid} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetDefault(o.uid)}
              title="Set as default"
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
              placeholder="Option name (e.g. Small)"
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
              title="Remove option"
              disabled={group.options.length <= 1}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={onAddOption}>
          <Plus className="h-4 w-4" /> Add option
        </Button>
      </div>
    </div>
  )
}
