import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Field, Input, Select } from '../../../../shared/ui'
import { cn } from '../../../../lib/cn'

/**
 * Shared editor for labels attached to a product or service.
 *
 * `labels`   — available label definitions ({ id, name, type, required, options }).
 * `attached` — current attachments ([{ labelId, values: [] }]).
 * `onChange` — receives the next attachments array.
 *
 * The value control adapts to the label type: a text box for INPUT, a dropdown
 * for SINGLE_SELECT, and a checkbox list for MULTI_SELECT.
 */
export function LabelAttachEditor({ labels = [], attached = [], onChange }) {
  const { t } = useTranslation()

  const byId = new Map(labels.map((l) => [String(l.id), l]))
  const usedIds = new Set(attached.map((a) => String(a.labelId)))
  const available = labels.filter((l) => !usedIds.has(String(l.id)))

  const add = (labelId) => {
    if (!labelId) return
    const def = byId.get(String(labelId))
    onChange([...attached, { labelId: Number(labelId), name: def?.name, type: def?.type, values: [] }])
  }
  const remove = (labelId) => onChange(attached.filter((a) => String(a.labelId) !== String(labelId)))
  const setValues = (labelId, values) =>
    onChange(attached.map((a) => (String(a.labelId) === String(labelId) ? { ...a, values } : a)))

  return (
    <div className="space-y-4">
      {labels.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          {t('labels.attach.noneAvailable')}
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <Field label={t('labels.attach.add')} className="flex-1">
              <Select value="" onChange={(e) => { add(e.target.value); e.target.value = '' }} disabled={available.length === 0}>
                <option value="">{t('labels.attach.select')}</option>
                {available.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} · {t(`labels.types.${l.type}`)}</option>
                ))}
              </Select>
            </Field>
          </div>

          {attached.length === 0 ? (
            <p className="text-sm text-muted">{t('labels.attach.none')}</p>
          ) : (
            <div className="space-y-3">
              {attached.map((a) => {
                // Prefer the live definition; fall back to the attachment's own
                // snapshot when the label was deleted (its values still show).
                const live = byId.get(String(a.labelId))
                const def = live || { name: a.name, type: a.type, options: [], deleted: true }
                return (
                  <div key={a.labelId} className="rounded-2xl border border-line bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        {def.required && <span className="text-danger">*</span>}
                        {def.name}
                        {def.type && <span className="ml-2 text-xs font-normal text-muted">{t(`labels.types.${def.type}`)}</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(a.labelId)}
                        className="text-danger hover:text-danger-strong"
                        title={t('labels.attach.remove')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {def.deleted ? (
                      <div className="flex flex-wrap gap-2">
                        {(a.values ?? []).map((v, i) => <span key={i} className="rounded-lg bg-canvas px-3 py-1.5 text-sm text-muted">{v}</span>)}
                      </div>
                    ) : (
                      <ValueControl def={def} values={a.values} onChange={(v) => setValues(a.labelId, v)} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ValueControl({ def, values = [], onChange }) {
  const { t } = useTranslation()

  if (def.type === 'INPUT') {
    return (
      <Input
        placeholder={t('labels.attach.valuePlaceholder')}
        value={values[0] ?? ''}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
      />
    )
  }

  if (def.type === 'SINGLE_SELECT') {
    return (
      <Select value={values[0] ?? ''} onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}>
        <option value="">{t('labels.attach.chooseOne')}</option>
        {(def.options ?? []).map((o) => <option key={o.id ?? o.value} value={o.value}>{o.value}</option>)}
      </Select>
    )
  }

  // MULTI_SELECT — checkbox list
  const toggle = (val) => {
    const has = values.includes(val)
    onChange(has ? values.filter((v) => v !== val) : [...values, val])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {(def.options ?? []).map((o) => {
        const active = values.includes(o.value)
        return (
          <button
            key={o.id ?? o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              active ? 'border-brand-700 bg-brand-700 text-white' : 'border-line text-ink hover:bg-canvas',
            )}
          >
            {o.value}
          </button>
        )
      })}
    </div>
  )
}
