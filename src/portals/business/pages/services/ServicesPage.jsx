import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Badge, Avatar } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { money, number } from '../../../../lib/format'
import { apiErrorMessage } from '../../../../lib/apiError'
import { ServiceDrawer } from './ServiceDrawer'
import {
  useGetServicesQuery, useCreateServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation,
  useGetProductsQuery,
} from '../../../../store/api'

const SIZE = 10

export default function ServicesPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0) // 0-based for the API
  const [drawer, setDrawer] = useState({ open: false, service: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const { data, isLoading, isError, error } = useGetServicesQuery({ query: query || undefined, page, size: SIZE })
  // Products to link inside the drawer (single large page — same approach as roles/employees lookups).
  const { data: productsPage } = useGetProductsQuery({ size: 200 })
  const products = productsPage?.content ?? []

  const [createService, cS] = useCreateServiceMutation()
  const [updateService, uS] = useUpdateServiceMutation()
  const [deleteService] = useDeleteServiceMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  const columns = [
    { key: 'name', header: t('services.name'), render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} size={32} /><span className="font-medium">{r.name}</span></span> },
    { key: 'price', header: t('common.price'), render: (r) => money(r.price) },
    { key: 'products', header: t('services.linkedProducts'), render: (r) => (r.products?.length ? <Badge tone="info">{number(r.products.length)}</Badge> : '—') },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        <button onClick={() => setDrawer({ open: true, service: r })} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setConfirm(r)} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>
      </span>
    ) },
  ]

  const save = async (payload) => {
    try {
      if (drawer.service) await updateService({ id: drawer.service.id, ...payload }).unwrap()
      else await createService(payload).unwrap()
      ok(drawer.service ? t('toasts.serviceUpdated') : t('toasts.serviceCreated'))
      setDrawer({ open: false, service: null })
    } catch (e) { fail(e) }
  }
  const doDelete = async () => {
    try { await deleteService(confirm.id).unwrap(); ok(t('toasts.serviceDeleted')) } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title={t('services.title')} subtitle={data ? t('services.subtitle', { count: data.totalElements }) : ''}>
        <Button onClick={() => setDrawer({ open: true, service: null })}><Plus className="h-4 w-4" /> {t('services.add')}</Button>
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder={t('services.searchPlaceholder')} className="w-full sm:w-72" />
        </div>
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : (
          <>
            <DataTable columns={columns} rows={data?.content ?? []} rowKey={(r) => r.id} empty={t('services.empty')} />
            {(data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={data.totalPages} onChange={(p) => setPage(p - 1)} />}
          </>
        )}
      </Card>

      <ServiceDrawer
        open={drawer.open} service={drawer.service} products={products}
        saving={cS.isLoading || uS.isLoading}
        onClose={() => setDrawer({ open: false, service: null })} onSave={save}
      />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={t('services.deleteTitle')} message={t('services.deleteMsg')} />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
