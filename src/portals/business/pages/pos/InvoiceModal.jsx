import { useTranslation } from 'react-i18next'
import { Printer } from 'lucide-react'
import { money } from '../../../../lib/format'
import { Button } from '../../../../shared/ui'
import { Loading, ErrorState } from '../../../../shared/States'
import { PosModal } from './PosOverlay'
import { useGetOrderQuery } from '../../../../store/api'

export function InvoiceModal({ orderId, open, onClose }) {
  const { t } = useTranslation()
  const { data: order, isLoading, isError, error } = useGetOrderQuery(orderId, { skip: !open || !orderId })

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  return (
    <PosModal open={open} onClose={onClose} size="lg"
      title={<span className="flex items-center gap-3">{t('pos.invoice.title')} <span className="text-muted">|</span> <span className="text-brand-700">{t('pos.invoice.order')} #{order?.orderNumber ?? ''}</span></span>}
    >
      {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : order ? (
        <div>
          <div className="flex flex-wrap justify-between gap-4 border-b border-line pb-4 text-sm">
            <div className="text-muted">
              <p className="font-medium text-ink">{order.customerName || order.handlerName || '—'}</p>
              {order.customerAddress && <p>{order.customerAddress}</p>}
              {order.customerPhone && <p>{order.customerPhone}</p>}
            </div>
            <div className="text-right text-muted">
              {order.tableName && <p><span className="font-medium text-ink">{t('pos.invoice.tableDetails')}:</span> {order.tableName}</p>}
              <p><span className="font-medium text-ink">{t('pos.invoice.guests')}:</span> {order.guestCount}</p>
              <p><span className="font-medium text-ink">{t('pos.invoice.orderDate')}:</span> {fmtDate(order.createdAt)}</p>
            </div>
          </div>

          <div className="py-4">
            <h4 className="text-lg font-semibold text-ink">{t('pos.invoice.summary')}</h4>
            <p className="mb-3 text-sm text-muted">{t('pos.invoice.cannotDelete')}</p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">{t('pos.invoice.item')}</th>
                    <th className="px-4 py-3 font-medium">{t('pos.invoice.quantity')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('pos.invoice.totals')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('pos.invoice.tax')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{it.productName}</p>
                        {it.modifiers.length > 0 && <p className="text-xs text-muted">{it.modifiers.map((m) => m.name).join(', ')}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted">{it.quantity}</td>
                      <td className="px-4 py-3 text-right">{money(it.lineTotal)}</td>
                      <td className="px-4 py-3 text-right">{money(it.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">{t('pos.invoice.paymentInfo')}</h4>
              {order.payments.length ? order.payments.map((p, i) => (
                <div key={i} className="mt-2 text-sm text-muted">
                  <p><span className="text-ink">{t('pos.invoice.type')}:</span> {p.method}</p>
                  <p><span className="text-ink">{t('pos.invoice.amount')}:</span> {money(p.amount)}</p>
                  <p><span className="text-ink">{t('pos.invoice.statusLabel')}:</span> <span className="font-medium text-success">{p.status}</span></p>
                </div>
              )) : <p className="mt-2 text-sm text-muted">{t('pos.invoice.noPayment')}</p>}
            </div>
            <div className="rounded-xl bg-brand-50/70 p-4 text-sm">
              <div className="flex justify-between text-muted"><span>{t('pos.invoice.subtotal')}:</span><span>{money(order.subtotal)}</span></div>
              <div className="flex justify-between text-muted"><span>{t('pos.invoice.taxLabel')}:</span><span>{money(order.taxTotal)}</span></div>
              {order.discountTotal > 0 && <div className="flex justify-between text-success"><span>{t('pos.builder.discount')}:</span><span>−{money(order.discountTotal)}</span></div>}
              <div className="mt-2 flex justify-between text-lg font-bold text-ink"><span>{t('pos.invoice.total')}:</span><span>{money(order.total)}</span></div>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> {t('pos.invoice.print')}</Button>
          </div>
        </div>
      ) : null}
    </PosModal>
  )
}
