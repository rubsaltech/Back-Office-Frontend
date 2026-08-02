import { useState, useEffect } from 'react'
import { Camera, Plus, X } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Textarea, Toggle } from '../../../../shared/ui'
import { cn } from '../../../../lib/cn'
import { categories } from '../../data/mock'

const VARIATIONS = ['Small', 'Medium', 'Large', 'Extra Large']

const empty = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  status: 'Active',
  price: '',
  qty: '',
  tax: '',
  discountOn: false,
  discountTitle: '',
  discountAmount: '',
  description: '',
  modifiersOn: true,
  variations: ['Small', 'Medium', 'Large'],
  styles: ['Moroccan'],
  specialInstructions: false,
}

export function ProductDrawer({ open, onClose, onSave, product }) {
  const [form, setForm] = useState(empty)
  const [styleInput, setStyleInput] = useState('')

  useEffect(() => {
    setForm(product ? { ...empty, ...product } : empty)
  }, [product, open])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const toggleVariation = (v) =>
    setForm((f) => ({
      ...f,
      variations: f.variations.includes(v)
        ? f.variations.filter((x) => x !== v)
        : [...f.variations, v],
    }))
  const addStyle = () => {
    const s = styleInput.trim()
    if (s && !form.styles.includes(s)) setForm((f) => ({ ...f, styles: [...f.styles, s] }))
    setStyleInput('')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      footer={
        <Button className="w-full" onClick={() => onSave?.(form)}>
          <Plus className="h-4 w-4" /> {product ? 'Save Changes' : 'Add Product'}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* image */}
        <button className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas text-muted">
          <Camera className="h-6 w-6" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white">
            <Plus className="h-4 w-4" />
          </span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Product Name" required>
            <Input placeholder="Enter product name" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="SKU Code" required>
            <Input placeholder="Enter code" value={form.sku} onChange={set('sku')} />
          </Field>
          <Field label="Barcode" required>
            <Input placeholder="Enter code" value={form.barcode} onChange={set('barcode')} />
          </Field>
          <Field label="Category" required>
            <Select value={form.category} onChange={set('category')}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status" required>
            <Select value={form.status} onChange={set('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </Field>
          <Field label="Price" required>
            <Input type="number" placeholder="€ Enter price" value={form.price} onChange={set('price')} />
          </Field>
          <Field label="Qty" required>
            <Input type="number" placeholder="Enter Qty" value={form.qty} onChange={set('qty')} />
          </Field>
          <Field label="Tax" required>
            <Input type="number" placeholder="€ Enter tax" value={form.tax} onChange={set('tax')} />
          </Field>
        </div>

        {/* discount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink"><span className="text-danger">*</span>Discount Title</span>
              <Toggle checked={form.discountOn} onChange={(v) => setForm((f) => ({ ...f, discountOn: v }))} />
            </div>
            <Input placeholder="Enter title" value={form.discountTitle} onChange={set('discountTitle')} disabled={!form.discountOn} />
          </div>
          <Field label="Discount Amount" required>
            <Input placeholder="€ Enter amount" value={form.discountAmount} onChange={set('discountAmount')} disabled={!form.discountOn} />
          </Field>
        </div>

        <Field label="Product Description" required>
          <Textarea placeholder="Write..." value={form.description} onChange={set('description')} />
        </Field>

        {/* Item Modifications */}
        <div className="border-t border-line pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-ink">Item Modifications</h4>
            <Toggle checked={form.modifiersOn} onChange={(v) => setForm((f) => ({ ...f, modifiersOn: v }))} />
          </div>

          {form.modifiersOn && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-ink"><span className="text-danger">*</span>Add Variations</p>
                <div className="flex flex-wrap gap-2">
                  {VARIATIONS.map((v) => {
                    const on = form.variations.includes(v)
                    return (
                      <button
                        key={v}
                        onClick={() => toggleVariation(v)}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm',
                          on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line text-muted',
                        )}
                      >
                        <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', on ? 'border-brand-700' : 'border-toggle-off')}>
                          {on && <span className="h-2 w-2 rounded-full bg-brand-700" />}
                        </span>
                        {v}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink"><span className="text-danger">*</span>Add Style</p>
                <div className="mb-2 flex flex-wrap gap-2">
                  {form.styles.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
                      {s}
                      <button onClick={() => setForm((f) => ({ ...f, styles: f.styles.filter((x) => x !== s) }))}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Enter style name" value={styleInput} onChange={(e) => setStyleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStyle()} />
                  <Button variant="secondary" onClick={addStyle}>Add</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink"><span className="text-danger">*</span>Special Instructions</span>
                <Toggle checked={form.specialInstructions} onChange={(v) => setForm((f) => ({ ...f, specialInstructions: v }))} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}
