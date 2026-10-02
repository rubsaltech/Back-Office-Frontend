import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Badge } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { number } from '../../../../lib/format'
import { apiErrorMessage } from '../../../../lib/apiError'
import { LabelDrawer } from './LabelDrawer'
import {
  useGetLabelsQuery, useCreateLabelMutation, useUpdateLabelMutation, useDeleteLabelMutation,
} from '../../../../store/api'

const SIZE = 10
const typeTone = { INPUT: 'info', SINGLE_SELECT: 'success', MULTI_SELECT: 'warning' }

export default function LabelsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0) // 0-based for the API
  const [drawer, setDrawer] = useState({ open: false, label: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const { data, isLoading, isError, error } = useGetLabelsQuery({ query: query || undefined, page, size: SIZE })

  const [createLabel, cL] = useCreateLabelMutation()
  const [updateLabel, uL] = useUpdateLabelMutation()
  const [deleteLabel] = useDeleteLabelMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  const columns = [
    { key: 'name', header: t('labels.name'), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'type', header: t('labels.type'), render: (r) => <Badge tone={typeTone[r.type] || 'neutral'}>{t(`labels.types.${r.type}`)}</Badge> },
    { key: 'options', header: t('labels.options'), render: (r) => (r.type === 'INPUT' ? '—' : <Badge tone="info">{number(r.options?.length ?? 0)}</Badge>) },
    { key: 'required', header: t('labels.required'), render: (r) => (r.required ? <Badge tone="warning">{t('labels.required')}</Badge> : '—') },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        <button onClick={() => setDrawer({ open: true, label: r })} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setConfirm(r)} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>
      </span>
    ) },
  ]

  const save = async (payload) => {
    try {
      if (drawer.label) await updateLabel({ id: drawer.label.id, ...payload }).unwrap()
      else await createLabel(payload).unwrap()
      ok(drawer.label ? t('toasts.labelUpdated') : t('toasts.labelCreated'))
      setDrawer({ open: false, label: null })
    } catch (e) { fail(e) }
  }
  const doDelete = async () => {
    try { await deleteLabel(confirm.id).unwrap(); ok(t('toasts.labelDeleted')) } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title={t('labels.title')} subtitle={data ? t('labels.subtitle', { count: data.totalElements }) : ''}>
        <Button onClick={() => setDrawer({ open: true, label: null })}><Plus className="h-4 w-4" /> {t('labels.add')}</Button>
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder={t('labels.searchPlaceholder')} className="w-full sm:w-72" />
        </div>
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : (
          <>
            <DataTable columns={columns} rows={data?.content ?? []} rowKey={(r) => r.id} empty={t('labels.empty')} />
            {(data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={data.totalPages} onChange={(p) => setPage(p - 1)} />}
          </>
        )}
      </Card>

      <LabelDrawer
        open={drawer.open} label={drawer.label}
        saving={cL.isLoading || uL.isLoading}
        onClose={() => setDrawer({ open: false, label: null })} onSave={save}
      />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={t('labels.deleteTitle')} message={t('labels.deleteMsg')} />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
