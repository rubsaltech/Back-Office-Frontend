import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Wrench } from 'lucide-react'
import { money } from '../../../../lib/format'
import { Button } from '../../../../shared/ui'
import { Loading } from '../../../../shared/States'
import { PosModal } from './PosOverlay'
import { PaymentModal } from './PaymentModal'
import { apiErrorMessage } from '../../../../lib/apiError'
import {
  useLazyTrackServiceJobQuery, useBillServiceJobMutation, useGetPaymentDevicesQuery,
} from '../../../../store/api'

/**
 * POS service billing: enter a job token → review the service charge + parts →
 * take payment → bills the job (creates the order, closes the job) and returns
 * the order to the caller so the invoice/receipt can be shown.
 */
export function ServiceBillModal({ open, onClose, onBilled, onToast }) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [trigger, { isFetching }] = useLazyTrackServiceJobQuery()
  const [bill, { isLoading: billing }] = useBillServiceJobMutation()
  const { data: devices = [] } = useGetPaymentDevicesQuery()

  useEffect(() => {
    if (open) { setToken(''); setJob(null); setError(null); setShowPayment(false) }
  }, [open])

  const find = async (e) => {
    e?.preventDefault()
    if (!token.trim()) return
    setError(null)
    try { setJob(await trigger(token.trim()).unwrap()) }
    catch (err) { setJob(null); setError(apiErrorMessage(err, t('serviceTracking.track.notFound'))) }
  }

  const doBill = async (payment) => {
    setShowPayment(false)
    try {
      const order = await bill({
        token: job.token,
        paymentMethod: payment?.method ?? null,
        deviceId: payment?.deviceId ?? null,
      }).unwrap()
      onBilled(order)
    } catch (err) { onToast?.({ type: 'error', message: apiErrorMessage(err) }) }
  }

  return (
    <>
      <PosModal open={open && !showPayment} onClose={onClose} size="md"
        title={<span className="flex items-center gap-2"><Wrench className="h-5 w-5 text-brand-600" /> {t('pos.service.title')}</span>}
      >
        <form className="flex gap-2" onSubmit={find}>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={token} onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder={t('pos.service.placeholder')}
              className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted focus:border-brand-400 focus:bg-white focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={isFetching || !token.trim()}>{t('pos.service.find')}</Button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}

        {isFetching ? <div className="py-6"><Loading /></div> : job && (
          <div className="mt-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-ink">{job.serviceType}{job.device ? ` · ${job.device}` : ''}</p>
              {(job.customerName || job.customerPhone) && <p className="text-xs text-muted">{[job.customerName, job.customerPhone].filter(Boolean).join(' · ')}</p>}
            </div>

            {job.billed ? (
              <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning">{t('pos.service.alreadyBilled', { number: job.orderId })}</p>
            ) : (
              <>
                <div className="rounded-xl border border-line text-sm">
                  <div className="flex items-center justify-between border-b border-line/60 px-4 py-2.5">
                    <span className="min-w-0"><span className="block truncate font-medium text-ink">{t('serviceTracking.job.serviceCharge')}</span><span className="block truncate text-xs text-muted">{job.serviceType}</span></span>
                    <span className="font-medium text-ink">{money(job.serviceCharge)}</span>
                  </div>
                  {(job.products ?? []).map((p) => (
                    <div key={`p-${p.id}`} className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 last:border-0">
                      <span className="min-w-0"><span className="block truncate font-medium text-ink">{p.productName}{p.variantName ? ` — ${p.variantName}` : ''}</span><span className="block text-xs text-muted">{p.quantity} × {money(p.unitPrice)}</span></span>
                      <span className="font-medium text-ink">{money(p.lineTotal)}</span>
                    </div>
                  ))}
                  {(job.extraCharges ?? []).map((c) => (
                    <div key={`c-${c.id}`} className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 last:border-0">
                      <span className="min-w-0 truncate font-medium text-ink">{c.title}</span>
                      <span className="font-medium text-ink">{money(c.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-brand-50/60 px-4 py-3">
                    <span className="font-semibold text-ink">{t('serviceTracking.job.grandTotal')}</span>
                    <span className="text-base font-bold text-brand-700">{money(job.grandTotal)}</span>
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={() => setShowPayment(true)} disabled={billing}>
                  {billing ? t('common.saving') : t('pos.service.billAndPrint')}
                </Button>
              </>
            )}
          </div>
        )}
      </PosModal>

      <PaymentModal
        open={open && showPayment}
        devices={devices}
        allowCod={false}
        onClose={() => setShowPayment(false)}
        onSelect={doBill}
      />
    </>
  )
}
