import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { Drawer } from '../../../../shared/Overlay'
import { Button, Field, Input, Select, Toggle } from '../../../../shared/ui'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const blankOption = () => ({ uid: uid(), value: '' })
const SELECT_TYPES = ['SINGLE_SELECT', 'MULTI_SELECT']

const empty = { name: '', type: 'INPUT', required: false, status: 'ACTIVE', options: [blankOption()] }

function fromLabel(l) {
  return {
    name: l.name ?? '',
    type: l.type ?? 'INPUT',
    required: !!l.required,
    status: l.status ?? 'ACTIVE',
    options: (l.options ?? []).length
      ? l.options.map((o) => ({ uid: uid(), value: o.value }))
      : [blankOption()],
  }
}

export function LabelDrawer({ open, onClose, onSave, saving, label }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)

  useEffect(() => { setForm(label ? fromLabel(label) : { ...empty, options: [blankOption()] }) }, [label, open])

  const isSelect = SELECT_TYPES.includes(form.type)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, blankOption()] }))
  const removeOption = (id) => setForm((f) => ({ ...f, options: f.options.filter((o) => o.uid !== id) }))
  const setOption = (id, v) => setForm((f) => ({ ...f, options: f.options.map((o) => (o.uid === id ? { ...o, value: v } : o)) }))

  const cleanOptions = form.options.map((o) => o.value.trim()).filter(Boolean)
  const valid = form.name.trim() && (!isSelect || cleanOptions.length > 0)

  const submit = () => {
    const payload = {
      name: form.name.trim(),
      type: form.type,
      required: form.required,
      status: form.status,
      options: isSelect
        ? form.options.filter((o) => o.value.trim()).map((o, i) => ({ value: o.value.trim(), sortOrder: i }))
        : [],
    }
    onSave?.(payload)
  }

  return (
    <Drawer
      open={open} onClose={onClose}
      title={label ? t('labels.form.editTitle') : t('labels.form.addTitle')}
      footer={
        <Button className="w-full" onClick={submit} disabled={saving || !valid}>
          {saving ? t('labels.form.saving') : label ? t('labels.form.save') : t('labels.form.create')}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label={t('labels.form.name')} required>
          <Input placeholder={t('labels.form.namePlaceholder')} value={form.name} onChange={set('name')} />
        </Field>

        <Field label={t('labels.form.type')} required hint={t(`labels.typeHints.${form.type}`)}>
          <Select value={form.type} onChange={set('type')}>
            <option value="INPUT">{t('labels.types.INPUT')}</option>
            <option value="SINGLE_SELECT">{t('labels.types.SINGLE_SELECT')}</option>
            <option value="MULTI_SELECT">{t('labels.types.MULTI_SELECT')}</option>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{t('labels.form.required')}</span>
              <Toggle checked={form.required} onChange={(v) => setForm((f) => ({ ...f, required: v }))} />
            </div>
            <p className="text-xs text-muted">{t('labels.form.requiredHint')}</p>
          </div>
          <Field label={t('labels.form.status')}>
            <Select value={form.status} onChange={set('status')}>
              <option value="ACTIVE">{t('common.active')}</option>
              <option value="INACTIVE">{t('common.inactive')}</option>
            </Select>
          </Field>
        </div>

        {isSelect && (
          <div className="border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{t('labels.form.options')}</p>
              <Button variant="secondary" size="sm" onClick={addOption}>
                <Plus className="h-3.5 w-3.5" /> {t('labels.form.addOption')}
              </Button>
            </div>
            <div className="space-y-2">
              {form.options.map((o) => (
                <div key={o.uid} className="flex items-center gap-2">
                  <Input
                    className="h-10 flex-1"
                    placeholder={t('labels.form.optionPlaceholder')}
                    value={o.value}
                    onChange={(e) => setOption(o.uid, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(o.uid)}
                    className="text-muted hover:text-danger disabled:opacity-40"
                    title={t('common.delete')}
                    disabled={form.options.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {cleanOptions.length === 0 && (
                <p className="text-xs text-danger">{t('labels.form.noOptions')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
