import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Copy, Check, Plus, Trash2, Package, CirclePlus, ChevronRight } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Field, Input, Select, Textarea, Badge } from '../../../../shared/ui'
import { Modal } from '../../../../shared/Overlay'
import { Loading, Toast } from '../../../../shared/States'
import { money } from '../../../../lib/format'
import { apiErrorMessage } from '../../../../lib/apiError'
import { usePermissions } from '../../auth/permissions'
import { PartPickerModal } from './PartPickerModal'
import {
  useCreateServiceJobMutation, useLazyTrackServiceJobQuery, useAddServiceJobUpdateMutation,
  useGetServiceJobsQuery, useGetServicesQuery,
  useAddServiceJobProductMutation, useRemoveServiceJobProductMutation,
  useAddServiceJobChargeMutation, useRemoveServiceJobChargeMutation,
} from '../../../../store/api'

const STAGES = ['RECEIVED', 'DIAGNOSED', 'IN_PROGRESS', 'READY', 'DELIVERED']
const ALL_STATUSES = [...STAGES, 'CANCELLED']
const STATUS_TONE = { RECEIVED: 'info', DIAGNOSED: 'info', IN_PROGRESS: 'warning', READY: 'success', DELIVERED: 'neutral', CANCELLED: 'danger' }

export default function ServiceTrackingPage() {
  const { t } = useTranslation()
  const { has } = usePermissions()
  const canCreate = has('service.create')
  const [tab, setTab] = useState(canCreate ? 'create' : 'track')
  const [toast, setToast] = useState(null)

  return (
    <div>
      <PageHeader title={t('serviceTracking.title')} subtitle={t('serviceTracking.subtitle')}>
        <Tabs
          tabs={[
            ...(canCreate ? [{ value: 'create', label: t('serviceTracking.tabs.create') }] : []),
            { value: 'track', label: t('serviceTracking.tabs.track') },
          ]}
          value={tab} onChange={setTab}
        />
      </PageHeader>
      {tab === 'create' && canCreate
        ? <CreateTab onToast={setToast} />
        : <TrackTab onToast={setToast} canCreate={canCreate} />}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

const emptyForm = { customerName: '', customerPhone: '', device: '', serviceId: '', note: '' }

function CreateTab({ onToast }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  const [create, { isLoading }] = useCreateServiceJobMutation()
  const { data: servicesData, isLoading: servicesLoading } = useGetServicesQuery({ size: 200 })
  const services = (servicesData?.content ?? []).filter((s) => s.status !== 'INACTIVE')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const selected = services.find((s) => String(s.id) === String(form.serviceId))

  const submit = async (e) => {
    e.preventDefault()
    try {
      const job = await create({ ...form, serviceId: Number(form.serviceId) }).unwrap()
      setCreated(job)
      setForm(emptyForm)
    } catch (err) { onToast({ type: 'error', message: apiErrorMessage(err) }) }
  }
  const copy = () => {
    try { navigator.clipboard?.writeText(created.token) } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success"><Check className="h-7 w-7" /></span>
        <h3 className="text-lg font-semibold text-ink">{t('serviceTracking.create.successTitle')}</h3>
        <p className="mt-1 text-sm text-muted">{t('serviceTracking.create.successHint')}</p>
        <div className="my-5 rounded-2xl border border-line bg-canvas p-5">
          <p className="text-xs uppercase tracking-wide text-muted">{t('serviceTracking.create.tokenLabel')}</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-brand-700">{created.token}</p>
          <p className="mt-2 text-sm text-ink">{created.serviceType} · {money(created.serviceCharge)}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={copy}><Copy className="h-4 w-4" /> {copied ? t('serviceTracking.create.copied') : t('serviceTracking.create.copyToken')}</Button>
          <Button onClick={() => setCreated(null)}><Plus className="h-4 w-4" /> {t('serviceTracking.create.newJob')}</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-lg p-6">
      <form className="space-y-4" onSubmit={submit}>
        <Field label={t('serviceTracking.create.service')} required>
          <Select value={form.serviceId} onChange={set('serviceId')} disabled={servicesLoading}>
            <option value="">{servicesLoading ? t('common.loading') : t('serviceTracking.create.selectService')}</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>)}
          </Select>
        </Field>
        {services.length === 0 && !servicesLoading && (
          <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning">{t('serviceTracking.create.noServices')}</p>
        )}
        {selected && (
          <p className="text-sm text-muted">{t('serviceTracking.create.baseCharge')}: <span className="font-semibold text-ink">{money(selected.price)}</span></p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('serviceTracking.create.customerName')}><Input value={form.customerName} onChange={set('customerName')} /></Field>
          <Field label={t('serviceTracking.create.customerPhone')}><Input value={form.customerPhone} onChange={set('customerPhone')} /></Field>
        </div>
        <Field label={t('serviceTracking.create.device')}><Input placeholder="e.g. iPhone 12" value={form.device} onChange={set('device')} /></Field>
        <Field label={t('serviceTracking.create.note')}><Textarea placeholder={t('serviceTracking.create.notePlaceholder')} value={form.note} onChange={set('note')} /></Field>
        <Button type="submit" className="w-full" disabled={isLoading || !form.serviceId}>
          {isLoading ? t('serviceTracking.create.submitting') : t('serviceTracking.create.submit')}
        </Button>
      </form>
    </Card>
  )
}

function TrackTab({ onToast, canCreate }) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const [trigger, { isFetching }] = useLazyTrackServiceJobQuery()
  const { data: openData } = useGetServiceJobsQuery()
  const running = openData?.content ?? []

  const load = async (tok) => {
    if (!tok.trim()) return
    setError(null); setToken(tok)
    try { setJob(await trigger(tok.trim()).unwrap()) }
    catch (err) { setJob(null); setError(apiErrorMessage(err, t('serviceTracking.track.notFound'))) }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Running jobs */}
      <div className="space-y-3">
        <Card className="p-4">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); load(token) }}>
            <div className="min-w-0 flex-1"><Input placeholder={t('serviceTracking.track.placeholder')} value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} /></div>
            <Button type="submit" disabled={isFetching || !token.trim()}><Search className="h-4 w-4" /></Button>
          </form>
          {error && <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('serviceTracking.track.running')}</p>
          {running.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">{t('serviceTracking.track.noRunning')}</p>
          ) : (
            <ul className="space-y-1.5">
              {running.map((j) => (
                <li key={j.id}>
                  <button
                    onClick={() => load(j.token)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${job?.id === j.id ? 'border-brand-400 bg-brand-50' : 'border-line hover:bg-canvas'}`}
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-sm font-semibold text-brand-700">{j.token}</span>
                      <span className="block truncate text-xs text-muted">{j.serviceType}{j.customerName ? ` · ${j.customerName}` : ''}</span>
                    </span>
                    <Badge tone={STATUS_TONE[j.status]}>{t(`serviceTracking.status.${j.status}`)}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Detail */}
      <div>
        {isFetching ? <Loading /> : job ? (
          <JobView job={job} onJob={setJob} onToast={onToast} canCreate={canCreate} />
        ) : (
          <Card className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center text-muted">
            <ChevronRight className="h-8 w-8 text-brand-200" />
            <p className="text-sm">{t('serviceTracking.track.selectHint')}</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function JobView({ job, onJob, onToast, canCreate }) {
  const { t } = useTranslation()
  const [addStatus, setAddStatus] = useState('')
  const [addNote, setAddNote] = useState('')
  const [picker, setPicker] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [addUpdate, { isLoading: updating }] = useAddServiceJobUpdateMutation()
  const [addProduct, { isLoading: addingPart }] = useAddServiceJobProductMutation()
  const [removeProduct] = useRemoveServiceJobProductMutation()
  const [addCharge, { isLoading: addingCharge }] = useAddServiceJobChargeMutation()
  const [removeCharge] = useRemoveServiceJobChargeMutation()
  const stageIdx = STAGES.indexOf(job.status)
  const cancelled = job.status === 'CANCELLED'
  const billed = job.billed
  const editable = canCreate && !cancelled && !billed

  const record = async () => {
    if (!addStatus) return
    try {
      const updated = await addUpdate({ id: job.id, status: addStatus, note: addNote || null }).unwrap()
      onJob(updated); setAddStatus(''); setAddNote('')
      onToast({ type: 'success', message: t('serviceTracking.job.updated') })
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }
  const onPickPart = async ({ variantId, quantity }) => {
    setPicker(false)
    try {
      const updated = await addProduct({ id: job.id, variantId, quantity }).unwrap()
      onJob(updated)
      onToast({ type: 'success', message: t('serviceTracking.parts.added') })
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }
  const removePart = async (lineId) => {
    try {
      const updated = await removeProduct({ id: job.id, lineId }).unwrap()
      onJob(updated)
      onToast({ type: 'success', message: t('serviceTracking.parts.removed') })
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }
  const onAddCharge = async ({ title, amount }) => {
    setChargeOpen(false)
    try {
      const updated = await addCharge({ id: job.id, title, amount }).unwrap()
      onJob(updated)
      onToast({ type: 'success', message: t('serviceTracking.charges.added') })
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }
  const removeExtra = async (chargeId) => {
    try {
      const updated = await removeCharge({ id: job.id, chargeId }).unwrap()
      onJob(updated)
      onToast({ type: 'success', message: t('serviceTracking.charges.removed') })
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="font-mono text-2xl font-bold tracking-[0.25em] text-brand-700">{job.token}</p>
          <p className="mt-1 text-sm text-ink">{job.serviceType}{job.device ? ` · ${job.device}` : ''}</p>
          {(job.customerName || job.customerPhone) && <p className="text-xs text-muted">{[job.customerName, job.customerPhone].filter(Boolean).join(' · ')}</p>}
        </div>
        <Badge tone={STATUS_TONE[job.status]}>{t(`serviceTracking.status.${job.status}`)}</Badge>
      </div>

      {billed && (
        <div className="my-4 rounded-xl bg-success-bg px-4 py-3 text-sm text-success">
          {t('serviceTracking.job.billed', { number: job.orderId })}
        </div>
      )}

      {cancelled ? (
        <div className="my-4 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{t('serviceTracking.job.cancelled')}</div>
      ) : !billed && (
        <div className="my-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>{t('serviceTracking.job.currentStage')}</span>
            <span>{t('serviceTracking.job.stageOf', { n: stageIdx + 1, total: STAGES.length })}</span>
          </div>
          <div className="flex items-start gap-1">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${i <= stageIdx ? 'bg-brand-600' : 'bg-line'}`} />
                <p className={`mt-1 text-center text-[10px] ${i === stageIdx ? 'font-semibold text-brand-700' : 'text-muted'}`}>{t(`serviceTracking.status.${s}`)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parts / charges */}
      <div className="mb-5 rounded-xl border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="text-sm font-medium text-ink">{t('serviceTracking.job.charges')}</p>
          {editable && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setChargeOpen(true)} disabled={addingCharge}>
                <CirclePlus className="h-4 w-4" /> {t('serviceTracking.job.addCharge')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPicker(true)} disabled={addingPart}>
                <Package className="h-4 w-4" /> {t('serviceTracking.job.addPart')}
              </Button>
            </div>
          )}
        </div>
        <div className="divide-y divide-line/60 text-sm">
          <Row label={t('serviceTracking.job.serviceCharge')} sub={job.serviceType} value={money(job.serviceCharge)} />
          {(job.products ?? []).map((p) => (
            <Row
              key={`p-${p.id}`}
              label={p.productName + (p.variantName ? ` — ${p.variantName}` : '')}
              sub={`${p.quantity} × ${money(p.unitPrice)}`}
              value={money(p.lineTotal)}
              onRemove={editable ? () => removePart(p.id) : null}
            />
          ))}
          {(job.extraCharges ?? []).map((c) => (
            <Row
              key={`c-${c.id}`}
              label={c.title}
              sub={t('serviceTracking.job.extraCharge')}
              value={money(c.amount)}
              onRemove={editable ? () => removeExtra(c.id) : null}
            />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-brand-50/60 px-4 py-3">
          <span className="text-sm font-semibold text-ink">{t('serviceTracking.job.grandTotal')}</span>
          <span className="text-base font-bold text-brand-700">{money(job.grandTotal)}</span>
        </div>
      </div>
      {!billed && !cancelled && (
        <p className="-mt-3 mb-5 text-xs text-muted">{t('serviceTracking.job.billHint')}</p>
      )}

      {/* Timeline */}
      <div className="mb-5">
        <p className="mb-3 text-sm font-medium text-ink">{t('serviceTracking.job.timeline')}</p>
        <ol className="space-y-4 border-l border-line pl-5">
          {job.updates.map((u) => (
            <li key={u.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[u.status]}>{t(`serviceTracking.status.${u.status}`)}</Badge>
                <span className="text-xs text-muted">{new Date(u.createdAt).toLocaleString()}</span>
                {u.performedBy && <span className="text-xs text-muted">· {u.performedBy}</span>}
              </div>
              {u.note && <p className="mt-1 text-sm text-ink">{u.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      {/* Add update */}
      {editable && (
        <div className="rounded-xl border border-line p-4">
          <p className="mb-3 text-sm font-medium text-ink">{t('serviceTracking.job.addUpdate')}</p>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <Field label={t('serviceTracking.job.newStatus')}>
              <Select value={addStatus} onChange={(e) => setAddStatus(e.target.value)}>
                <option value="">{t('serviceTracking.job.selectStatus')}</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{t(`serviceTracking.status.${s}`)}</option>)}
              </Select>
            </Field>
            <Field label={t('serviceTracking.job.noteOptional')}><Input value={addNote} onChange={(e) => setAddNote(e.target.value)} /></Field>
            <Button onClick={record} disabled={updating || !addStatus}>{updating ? t('serviceTracking.job.recording') : t('serviceTracking.job.record')}</Button>
          </div>
        </div>
      )}

      <PartPickerModal open={picker} onClose={() => setPicker(false)} onPick={onPickPart} />
      <AddChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} onAdd={onAddCharge} busy={addingCharge} />
    </Card>
  )
}

function AddChargeModal({ open, onClose, onAdd, busy }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const valid = title.trim() && Number(amount) > 0

  const submit = () => {
    if (!valid) return
    onAdd({ title: title.trim(), amount: Number(amount) })
    setTitle(''); setAmount('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('serviceTracking.charges.title')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={busy || !valid}>{t('serviceTracking.charges.add')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('serviceTracking.charges.titleLabel')} required>
          <Input placeholder={t('serviceTracking.charges.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t('serviceTracking.charges.amount')} required>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function Row({ label, sub, value, onRemove }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{label}</p>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </div>
      <span className="shrink-0 font-medium text-ink">{value}</span>
      {onRemove && (
        <button onClick={onRemove} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-danger-bg text-danger" title="Remove">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
