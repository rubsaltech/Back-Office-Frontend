import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Badge, Avatar } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { money } from '../../../../lib/format'
import { apiErrorMessage } from '../../../../lib/apiError'
import { usePermissions } from '../../auth/permissions'
import { CustomerDrawer } from './CustomerDrawer'
import { CustomerDetailModal } from './CustomerDetailModal'
import {
  useGetCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation,
} from '../../../../store/api'

const SIZE = 10

export default function CustomersPage() {
  const { t } = useTranslation()
  const { has } = usePermissions()
  const canEdit = has('customer.edit')
  const canDelete = has('customer.delete')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [drawer, setDrawer] = useState({ open: false, customer: null })
  const [detailId, setDetailId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const { data, isLoading, isError, error } = useGetCustomersQuery({ query: query || undefined, page, size: SIZE })
  const [createCustomer, cC] = useCreateCustomerMutation()
  const [updateCustomer, uC] = useUpdateCustomerMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  // Balance: positive = customer owes (debit), negative = in credit.
  const balanceCell = (r) => {
    const b = Number(r.balance || 0)
    if (b === 0) return <span className="text-muted">—</span>
    return <span className={b > 0 ? 'font-medium text-danger' : 'font-medium text-success'}>
      {b > 0 ? t('customers.owes', { amount: money(b) }) : t('customers.credit', { amount: money(Math.abs(b)) })}
    </span>
  }

  const columns = [
    { key: 'name', header: t('customers.name'), render: (r) => (
      <button onClick={() => setDetailId(r.id)} className="flex items-center gap-3 text-left hover:underline">
        <Avatar name={r.name} size={32} /><span className="font-medium text-ink">{r.name}</span>
      </button>
    ) },
    { key: 'phone', header: t('customers.phone'), render: (r) => r.phone || '—' },
    { key: 'email', header: t('customers.email'), render: (r) => r.email || '—' },
    { key: 'balance', header: t('customers.balance'), render: balanceCell },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        {canEdit && <button onClick={() => setDrawer({ open: true, customer: r })} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>}
        {canDelete && <button onClick={() => setConfirm(r)} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>}
      </span>
    ) },
  ]

  const save = async (payload) => {
    try {
      if (drawer.customer) await updateCustomer({ id: drawer.customer.id, ...payload }).unwrap()
      else await createCustomer(payload).unwrap()
      ok(drawer.customer ? t('customers.toasts.updated') : t('customers.toasts.created'))
      setDrawer({ open: false, customer: null })
    } catch (e) { fail(e) }
  }
  const doDelete = async () => {
    try { await deleteCustomer(confirm.id).unwrap(); ok(t('customers.toasts.deleted')) } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title={t('customers.title')} subtitle={data ? t('customers.subtitle', { count: data.totalElements }) : ''}>
        {has('customer.create') && <Button onClick={() => setDrawer({ open: true, customer: null })}><Plus className="h-4 w-4" /> {t('customers.add')}</Button>}
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder={t('customers.searchPlaceholder')} className="w-full sm:w-72" />
        </div>
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : (
          <>
            <DataTable columns={columns} rows={data?.content ?? []} rowKey={(r) => r.id} empty={t('customers.empty')} />
            {(data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={data.totalPages} onChange={(p) => setPage(p - 1)} />}
          </>
        )}
      </Card>

      <CustomerDrawer
        open={drawer.open} customer={drawer.customer}
        saving={cC.isLoading || uC.isLoading}
        onClose={() => setDrawer({ open: false, customer: null })} onSave={save}
      />
      <CustomerDetailModal customerId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={t('customers.deleteTitle')} message={t('customers.deleteMsg')} />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
