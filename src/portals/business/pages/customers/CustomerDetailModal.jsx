import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Modal } from '../../../../shared/Overlay'
import { Badge } from '../../../../shared/ui'
import { Loading, ErrorState } from '../../../../shared/States'
import { money } from '../../../../lib/format'
import { useGetCustomerQuery } from '../../../../store/api'

export function CustomerDetailModal({ customerId, open, onClose }) {
  const { t } = useTranslation()
  const { data: c, isLoading, isError, error } = useGetCustomerQuery(customerId, { skip: !open || !customerId })

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  const balance = Number(c?.balance ?? 0)
  const balanceTone = balance > 0 ? 'danger' : balance < 0 ? 'success' : 'neutral'
  const balanceLabel = balance > 0 ? t('customers.detail.owes') : balance < 0 ? t('customers.detail.inCredit') : t('customers.detail.settled')

  return (
    <Modal open={open} onClose={onClose} title={c?.name || t('customers.detail.title')} size="lg">
      {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : c ? (
        <div className="space-y-5">
          {/* Contact */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            {c.email && <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {c.email}</span>}
            {c.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {c.phone}</span>}
            {(c.address || c.city || c.country) && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {[c.address, c.city, c.country].filter(Boolean).join(', ')}</span>
            )}
          </div>

          {/* Credit / debit summary */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label={t('customers.detail.totalCredit')} value={money(c.totalCredit)} tone="success" />
            <Stat label={t('customers.detail.totalDebit')} value={money(c.totalDebit)} tone="danger" />
            <Stat label={t('customers.detail.balance')} value={money(Math.abs(balance))} tone={balanceTone} hint={balanceLabel} />
          </div>

          {/* Ledger */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{t('customers.detail.ledger')}</p>
            {(c.transactions ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                {t('customers.detail.noTransactions')}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-2.5 font-medium">{t('customers.detail.date')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('customers.detail.type')}</th>
                      <th className="px-4 py-2.5 font-medium">{t('customers.detail.noteCol')}</th>
                      <th className="px-4 py-2.5 text-right font-medium">{t('customers.detail.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-2.5 text-muted">{fmt(tx.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={tx.type === 'CREDIT' ? 'success' : 'danger'}>{t(`customers.txn.${tx.type}`)}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-ink">{tx.note || '—'}</td>
                        <td className={`px-4 py-2.5 text-right font-medium ${tx.type === 'CREDIT' ? 'text-success' : 'text-danger'}`}>
                          {tx.type === 'CREDIT' ? '−' : '+'}{money(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function Stat({ label, value, tone, hint }) {
  const tones = { success: 'text-success', danger: 'text-danger', neutral: 'text-ink' }
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tones[tone] || 'text-ink'}`}>{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
