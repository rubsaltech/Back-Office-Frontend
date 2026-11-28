import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, CreditCard, Truck, Search, UserPlus, UserRound, X } from 'lucide-react'
import { PosModal } from './PosOverlay'
import { Button, Field, Input, Select } from '../../../../shared/ui'
import { money } from '../../../../lib/format'
import { cn } from '../../../../lib/cn'
import { apiErrorMessage } from '../../../../lib/apiError'
import { useGetCustomersQuery, useCreateCustomerMutation } from '../../../../store/api'

/**
 * Final checkout step for a sale or a service bill: attach a customer
 * (optional — walk-ins are fine), choose payment, and enter the amount received.
 * The balance (total − received) is computed; if any, it goes on the attached
 * customer's ledger — so a balance requires a customer. Confirms with
 * { customerId, customerName, customerPhone, amountReceived, payment }.
 */
export function CheckoutModal({ open, total, devices = [], allowCod, onClose, onConfirm, onToast, busy }) {
  const { t } = useTranslation()
  const [method, setMethod] = useState('CASH')
  const [deviceId, setDeviceId] = useState('')
  const [received, setReceived] = useState('')
  const [customer, setCustomer] = useState(null) // { id, name, phone }
  const [mode, setMode] = useState('none') // none | search | new
  const [q, setQ] = useState('')
  const [newC, setNewC] = useState({ name: '', phone: '' })
  const [creating, setCreating] = useState(false)
  const [createCustomer] = useCreateCustomerMutation()

  useEffect(() => {
    if (open) {
      setMethod('CASH')
      setDeviceId(devices[0]?.id != null ? String(devices[0].id) : '')
      setReceived(String(total ?? 0))
      setCustomer(null); setMode('none'); setQ(''); setNewC({ name: '', phone: '' })
    }
  }, [open, total]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: custData, isFetching } = useGetCustomersQuery({ query: q || undefined, size: 8 }, { skip: !open || mode !== 'search' })
  const results = custData?.content ?? []

  const totalN = Number(total) || 0
  const recv = Math.max(0, Math.min(totalN, Number(received) || 0))
  const balance = totalN - recv
  const hasBalance = balance > 0.001
  const needsCustomer = hasBalance && !customer
  const cardOk = method !== 'CARD' || !!deviceId
  const canConfirm = cardOk && !needsCustomer

  const methods = [
    { value: 'CASH', label: t('pos.payment.cash'), icon: DollarSign },
    { value: 'CARD', label: t('pos.payment.card'), icon: CreditCard },
    ...(allowCod ? [{ value: 'COD', label: t('pos.payment.cod'), icon: Truck }] : []),
  ]

  const pick = (c) => { setCustomer({ id: c.id, name: c.name, phone: c.phone }); setMode('none') }
  const createAndPick = async () => {
    if (!newC.name.trim()) return
    setCreating(true)
    try {
      const c = await createCustomer({ name: newC.name.trim(), phone: newC.phone.trim() || null }).unwrap()
      setCustomer({ id: c.id, name: c.name, phone: c.phone }); setMode('none'); setNewC({ name: '', phone: '' })
    } catch (e) { onToast?.({ type: 'error', message: apiErrorMessage(e) }) }
    finally { setCreating(false) }
  }

  const confirm = () => onConfirm({
    customerId: customer?.id ?? null,
    customerName: customer?.name ?? null,
    customerPhone: customer?.phone ?? null,
    amountReceived: recv,
    payment: { method, deviceId: method === 'CARD' && deviceId ? Number(deviceId) : null },
  })

  return (
    <PosModal
      open={open} onClose={onClose} title={t('pos.checkout.title')} size="md"
      footer={<div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={confirm} disabled={busy || !canConfirm}>{busy ? t('common.saving') : t('pos.checkout.confirm')}</Button>
      </div>}
    >
      <div className="space-y-5">
        {/* Customer */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink">{t('pos.checkout.customer')} <span className="font-normal text-muted">· {t('pos.checkout.optional')}</span></p>
          {customer ? (
            <div className="flex items-center justify-between rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm"><UserRound className="h-4 w-4 text-brand-600" /><span className="font-medium text-ink">{customer.name}</span>{customer.phone && <span className="text-muted">· {customer.phone}</span>}</span>
              <button onClick={() => setCustomer(null)} className="text-muted hover:text-danger"><X className="h-4 w-4" /></button>
            </div>
          ) : mode === 'search' ? (
            <div className="rounded-xl border border-line p-3">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('pos.checkout.searchCustomer')}
                  className="h-10 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none" />
              </div>
              <div className="max-h-44 space-y-1 overflow-y-auto">
                {isFetching ? <p className="py-3 text-center text-sm text-muted">…</p>
                  : results.length === 0 ? <p className="py-3 text-center text-sm text-muted">{t('pos.checkout.noCustomers')}</p>
                  : results.map((c) => (
                    <button key={c.id} onClick={() => pick(c)} className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-brand-400 hover:bg-brand-50/60">
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="text-xs text-muted">{c.phone || ''}</span>
                    </button>
                  ))}
              </div>
              <button onClick={() => setMode('none')} className="mt-2 text-xs text-muted hover:text-ink">{t('common.cancel')}</button>
            </div>
          ) : mode === 'new' ? (
            <div className="space-y-2 rounded-xl border border-line p-3">
              <Field label={t('customers.form.name')} required><Input autoFocus value={newC.name} onChange={(e) => setNewC((n) => ({ ...n, name: e.target.value }))} /></Field>
              <Field label={t('customers.form.phone')}><Input value={newC.phone} onChange={(e) => setNewC((n) => ({ ...n, phone: e.target.value }))} /></Field>
              <div className="flex gap-2">
                <Button size="sm" onClick={createAndPick} disabled={creating || !newC.name.trim()}>{creating ? t('common.saving') : t('pos.checkout.addCustomer')}</Button>
                <Button size="sm" variant="secondary" onClick={() => setMode('none')}>{t('common.cancel')}</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setMode('search'); setQ('') }}><Search className="h-4 w-4" /> {t('pos.checkout.selectCustomer')}</Button>
              <Button variant="secondary" size="sm" onClick={() => setMode('new')}><UserPlus className="h-4 w-4" /> {t('pos.checkout.newCustomer')}</Button>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink">{t('pos.payment.method')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {methods.map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setMethod(value)}
                className={cn('flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
                  method === value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line text-ink hover:bg-canvas')}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {method === 'CARD' && (
            <div className="mt-3">
              <Field label={t('pos.payment.deviceSerial')} required>
                {devices.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">{t('pos.payment.noDevices')}</p>
                ) : (
                  <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                    <option value="">{t('pos.payment.selectDevice')}</option>
                    {devices.map((d) => <option key={d.id} value={d.id}>{d.serialNumber}{d.label ? ` — ${d.label}` : ''}</option>)}
                  </Select>
                )}
              </Field>
            </div>
          )}
        </div>

        {/* Amount received + balance */}
        <div className="rounded-xl bg-brand-50/60 p-4">
          <div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted">{t('pos.checkout.total')}</span><span className="font-semibold text-ink">{money(totalN)}</span></div>
          <Field label={t('pos.checkout.received')}>
            <Input type="number" min="0" step="0.01" value={received} onChange={(e) => setReceived(e.target.value)} />
          </Field>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">{t('pos.checkout.balance')}</span>
            <span className={hasBalance ? 'font-bold text-danger' : 'font-bold text-success'}>{money(balance)}</span>
          </div>
          {needsCustomer && <p className="mt-2 text-xs text-danger">{t('pos.checkout.balanceNeedsCustomer')}</p>}
          {hasBalance && customer && <p className="mt-2 text-xs text-muted">{t('pos.checkout.balanceToLedger', { name: customer.name })}</p>}
        </div>
      </div>
    </PosModal>
  )
}
