import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Ban } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { money } from '../../../../lib/format'
import { Badge } from '../../../../shared/ui'
import { DataTable, Pagination } from '../../../../shared/DataTable'
import { Loading, ErrorState } from '../../../../shared/States'
import { Select } from '../../../../shared/ui'
import { PosConfirm } from './PosOverlay'
import { useGetOrdersQuery, useVoidOrderMutation } from '../../../../store/api'
import { apiErrorMessage } from '../../../../lib/apiError'

const SIZE = 10
const STATUS_TONE = {
  CONFIRMED: 'info', READY_FOR_PICKUP: 'neutral', DELIVERED: 'info',
  COMPLETED: 'success', VOID: 'danger', CANCELLED: 'danger',
}
const STATUS_FILTERS = ['', 'CONFIRMED', 'READY_FOR_PICKUP', 'DELIVERED', 'COMPLETED', 'VOID']

export function OrdersList({ onView, onToast }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [confirm, setConfirm] = useState(null)

  const { data, isLoading, isError, error } = useGetOrdersQuery({ status: status || undefined, page, size: SIZE })
  const [voidOrder] = useVoidOrderMutation()

  const doVoid = async () => {
    try { await voidOrder(confirm.id).unwrap(); onToast?.({ type: 'success', message: t('pos.toasts.voided') }) }
    catch (e) { onToast?.({ type: 'error', message: apiErrorMessage(e) }) }
  }

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  const columns = [
    { key: 'orderNumber', header: t('pos.orders.id'), render: (r) => <span className="font-medium">{r.orderNumber}</span> },
    { key: 'tableName', header: t('pos.orders.table'), render: (r) => r.tableName || '—' },
    { key: 'handlerName', header: t('pos.orders.handler'), render: (r) => r.handlerName || '—' },
    { key: 'createdAt', header: t('pos.orders.date'), render: (r) => <span className="text-muted">{fmtDate(r.createdAt)}</span> },
    { key: 'subtotal', header: t('pos.orders.subtotal'), render: (r) => money(r.subtotal) },
    { key: 'total', header: t('pos.orders.total'), render: (r) => money(r.total) },
    { key: 'status', header: t('pos.orders.status'), render: (r) => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{t(`pos.statuses.${r.status}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        <button onClick={() => onView(r.id)} className="text-success hover:opacity-80" title={t('pos.orders.view')}><Eye className="h-4 w-4" /></button>
        {r.status !== 'VOID' && r.status !== 'COMPLETED' && (
          <button onClick={() => setConfirm(r)} className="text-danger hover:text-danger-strong" title={t('pos.orders.void')}><Ban className="h-4 w-4" /></button>
        )}
      </span>
    ) },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">{t('pos.orders.title')}</h2>
          <p className="mt-1 text-sm text-muted">{data ? t('pos.orders.subtitle', { count: data.totalElements }) : ''}</p>
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} className="h-11 w-48 bg-white">
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s ? t(`pos.statuses.${s}`) : t('pos.orders.all')}</option>)}
        </Select>
      </div>

      {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : (
        <div className="rounded-2xl border border-line bg-white p-2">
          <DataTable columns={columns} rows={data?.content ?? []} rowKey={(r) => r.id} empty={t('pos.orders.empty')} />
          {(data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={data.totalPages} onChange={(p) => setPage(p - 1)} />}
        </div>
      )}

      <PosConfirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doVoid}
        title={t('pos.orders.voidTitle')} message={t('pos.orders.voidMsg')} confirmLabel={t('pos.orders.void')} />
    </div>
  )
}
