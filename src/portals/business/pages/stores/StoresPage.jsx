import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Badge } from '../../../../shared/ui'
import { DataTable } from '../../../../shared/DataTable'
import { ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { apiErrorMessage } from '../../../../lib/apiError'
import { StoreModal } from '../../components/StoreModal'
import { setActiveStore, STORE_SCOPED_TAGS } from '../../../../store/storeSlice'
import { api, useGetStoresQuery, useDeleteStoreMutation } from '../../../../store/api'

export default function StoresPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data: stores = [], isLoading, isError, error } = useGetStoresQuery()
  const [deleteStore] = useDeleteStoreMutation()
  const [modal, setModal] = useState({ open: false, store: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  const columns = [
    { key: 'name', header: t('stores.name'), render: (r) => (
      <span className="flex items-center gap-2 font-medium">
        {r.name}
        {r.main && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">{t('stores.main')}</span>}
      </span>
    ) },
    { key: 'type', header: t('stores.type'), render: (r) => t(`storeTypes.${r.type}`, r.type) },
    { key: 'address', header: t('stores.address'), render: (r) => r.address || '—' },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        <button onClick={() => setModal({ open: true, store: r })} className="text-brand-600 hover:text-brand-800" title={t('common.edit')}><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setConfirm(r)} className="text-danger hover:text-danger-strong disabled:opacity-40" title={t('common.delete')} disabled={stores.length <= 1}><Trash2 className="h-4 w-4" /></button>
      </span>
    ) },
  ]

  const onSaved = (saved) => {
    setModal({ open: false, store: null })
    ok(t('stores.saved'))
    // A new store becomes the active one; re-scoping happens on tag invalidation.
    if (saved?.id) {
      dispatch(setActiveStore(saved.id))
      dispatch(api.util.invalidateTags(STORE_SCOPED_TAGS))
    }
  }

  const doDelete = async () => {
    try {
      await deleteStore(confirm.id).unwrap()
      ok(t('stores.deleted'))
      dispatch(api.util.invalidateTags(STORE_SCOPED_TAGS))
    } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title={t('stores.title')} subtitle={t('stores.subtitle', { count: stores.length })}>
        <Button onClick={() => setModal({ open: true, store: null })}><Plus className="h-4 w-4" /> {t('stores.addStore')}</Button>
      </PageHeader>

      <Card className="p-5">
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : (
          <DataTable columns={columns} rows={stores} rowKey={(r) => r.id} empty={t('stores.empty')} />
        )}
      </Card>

      <StoreModal open={modal.open} store={modal.store} onClose={() => setModal({ open: false, store: null })} onSaved={onSaved} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={t('stores.deleteTitle')} message={t('stores.deleteMsg')} />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
