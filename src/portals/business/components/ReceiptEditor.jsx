import { useMemo, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, Upload, Image as ImageIcon, Receipt, FileText } from 'lucide-react'
import { Button, Field, Input, Textarea, Toggle } from '../../../shared/ui'
import { cn } from '../../../lib/cn'
import { buildReceiptHtml } from '../pages/pos/print'
import { useUploadFileMutation } from '../../../store/api'

// Section toggles offered per template (all default ON).
const TOGGLES = {
  thermal: ['address', 'phone', 'dateTime', 'customer', 'table', 'servedBy', 'itemsCount', 'tax', 'discount', 'youSaved', 'amountInWords'],
  full: ['address', 'phone', 'email', 'dateTime', 'tax', 'discount'],
}

const SAMPLE = {
  orderNumber: 1001, type: 'COUNTER', createdAt: new Date().toISOString(),
  customerName: 'John Smith', customerPhone: '0300-1234567', handlerName: 'Jane', tableName: 'T4',
  items: [
    { productName: 'Sample Product A', quantity: 1, unitPrice: 900, originalUnitPrice: 1000, lineTotal: 900 },
    { productName: 'Sample Product B', quantity: 2, unitPrice: 250, originalUnitPrice: 250, lineTotal: 500 },
  ],
  payments: [{ method: 'CASH', amount: 1400 }],
  subtotal: 1400, taxTotal: 0, discountTotal: 100, total: 1400,
}

// Uploads come back as a relative "/uploads/..." path. The receipt prints in a
// separate window and runs on a different host in prod (Netlify) than the file
// server (Render), so the logo URL must be absolute to the backend origin.
function absoluteUploadUrl(url) {
  if (!url || /^https?:\/\//.test(url)) return url
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const origin = apiBase ? apiBase.replace(/\/api\/v1\/?$/, '') : window.location.origin
  return origin + url
}

const blankTpl = () => ({ storeName: '', logoUrl: '', headerLines: [], footerThankYou: '', terms: '', footerLines: [], show: {} })

export function emptyReceiptConfig() {
  return { thermal: blankTpl(), full: blankTpl() }
}

/** `value` = { thermal:{...}, full:{...} }; `ctx` = store name/address/phone for the preview. */
export function ReceiptEditor({ value, onChange, ctx = {} }) {
  const { t } = useTranslation()
  const [tpl, setTpl] = useState('thermal')
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation()
  const fileRef = useRef(null)

  const cfg = value?.[tpl] ?? blankTpl()
  const setCfg = (patch) => onChange({ ...value, [tpl]: { ...cfg, ...patch } })
  const setShow = (key, on) => setCfg({ show: { ...(cfg.show || {}), [key]: on } })

  const setLine = (field, i, v) => setCfg({ [field]: cfg[field].map((x, idx) => (idx === i ? v : x)) })
  const addLine = (field) => setCfg({ [field]: [...(cfg[field] || []), ''] })
  const removeLine = (field, i) => setCfg({ [field]: cfg[field].filter((_, idx) => idx !== i) })

  const previewFormat = tpl === 'full' ? 'full' : 'thermal'
  const previewHtml = useMemo(
    () => buildReceiptHtml(SAMPLE, previewFormat, { ...ctx, config: value }),
    [value, ctx, previewFormat],
  )

  const onPickLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await uploadFile(fd).unwrap()
      if (res?.url) setCfg({ logoUrl: absoluteUploadUrl(res.url) })
    } catch { /* ignore upload error */ }
    e.target.value = ''
  }

  const LineList = ({ field, label, addLabel }) => (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{label}</p>
        <Button variant="secondary" size="sm" onClick={() => addLine(field)}><Plus className="h-3.5 w-3.5" /> {addLabel}</Button>
      </div>
      <div className="space-y-2">
        {(cfg[field] || []).map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="h-9" value={v} onChange={(e) => setLine(field, i, e.target.value)} />
            <button type="button" onClick={() => removeLine(field, i)} className="text-muted hover:text-danger"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* template picker */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[
          { id: 'thermal', label: t('receipt.thermal'), icon: Receipt, hint: t('receipt.thermalHint') },
          { id: 'full', label: t('receipt.full'), icon: FileText, hint: t('receipt.fullHint') },
        ].map(({ id, label, icon: Icon, hint }) => (
          <button
            key={id}
            onClick={() => setTpl(id)}
            className={cn('flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
              tpl === id ? 'border-brand-500 bg-brand-50' : 'border-line hover:bg-canvas')}
          >
            <Icon className={cn('mt-0.5 h-5 w-5', tpl === id ? 'text-brand-700' : 'text-muted')} />
            <span><span className="block text-sm font-medium text-ink">{label}</span><span className="block text-xs text-muted">{hint}</span></span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(300px,380px)]">
        {/* ---- fields ---- */}
        <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
          <Field label={t('receipt.storeName')} hint={t('receipt.storeNameHint')}>
            <Input placeholder={ctx.storeName || ''} value={cfg.storeName} onChange={(e) => setCfg({ storeName: e.target.value })} />
          </Field>

          <div>
            <p className="mb-1 text-sm font-medium text-ink">{t('receipt.logo')}</p>
            <div className="flex items-center gap-3">
              {cfg.logoUrl
                ? <img src={cfg.logoUrl} alt="" className="h-14 w-14 rounded-lg border border-line object-contain" />
                : <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-line text-muted"><ImageIcon className="h-5 w-5" /></span>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-3.5 w-3.5" /> {uploading ? t('receipt.uploading') : t('receipt.uploadLogo')}
              </Button>
              {cfg.logoUrl && <button type="button" onClick={() => setCfg({ logoUrl: '' })} className="text-sm text-danger hover:text-danger-strong">{t('receipt.removeLogo')}</button>}
            </div>
          </div>

          <LineList field="headerLines" label={t('receipt.headerLines')} addLabel={t('receipt.addLine')} />

          <div>
            <p className="mb-2 text-sm font-medium text-ink">{t('receipt.sections')}</p>
            <div className="space-y-2 rounded-xl border border-line p-3">
              {TOGGLES[tpl].map((key) => (
                <label key={key} className="flex items-center justify-between text-sm text-ink">
                  {t(`receipt.toggles.${key}`)}
                  <Toggle checked={cfg.show?.[key] !== false} onChange={(on) => setShow(key, on)} />
                </label>
              ))}
            </div>
          </div>

          <Field label={t('receipt.terms')}>
            <Textarea rows={3} value={cfg.terms} onChange={(e) => setCfg({ terms: e.target.value })} />
          </Field>
          <Field label={t('receipt.thankYou')}>
            <Input value={cfg.footerThankYou} onChange={(e) => setCfg({ footerThankYou: e.target.value })} />
          </Field>
          <LineList field="footerLines" label={t('receipt.footerLines')} addLabel={t('receipt.addLine')} />
        </div>

        {/* ---- live preview ---- */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('receipt.preview')}</p>
          <div className="flex max-h-[62vh] justify-center overflow-auto rounded-xl border border-line bg-canvas p-3">
            <iframe
              title="receipt-preview"
              srcDoc={previewHtml}
              className="border-0 bg-white shadow-sm"
              style={{ width: tpl === 'full' ? 640 : 300, height: 560 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
