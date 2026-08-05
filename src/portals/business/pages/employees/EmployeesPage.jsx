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
import { EmployeeDrawer } from './EmployeeDrawer'
import {
  useGetEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation,
  useGetStoresQuery, useGetRolesQuery,
} from '../../../../store/api'

const SIZE = 10

export default function EmployeesPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [drawer, setDrawer] = useState({ open: false, employee: null })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const { data, isLoading, isError, error } = useGetEmployeesQuery({ query: query || undefined, page, size: SIZE })
  const { data: stores = [] } = useGetStoresQuery()
  const { data: rolesPage } = useGetRolesQuery({ size: 100 })
  const roles = rolesPage?.content ?? []

  const [createEmployee, cS] = useCreateEmployeeMutation()
  const [updateEmployee, uS] = useUpdateEmployeeMutation()
  const [deleteEmployee] = useDeleteEmployeeMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  const columns = [
    { key: 'id', header: t('employees.id'), render: (r) => <span className="text-muted">{r.id}</span> },
    { key: 'name', header: t('common.name'), render: (r) => <span className="flex items-center gap-2"><Avatar name={r.fullName} size={30} /> <span className="font-medium">{r.fullName}</span></span> },
    { key: 'email', header: t('common.email'), render: (r) => <span className="text-muted">{r.email}</span> },
    { key: 'role', header: t('employees.role'), render: (r) => r.roleName ? <Badge tone="info">{r.roleName}</Badge> : '—' },
    { key: 'store', header: t('employees.store'), render: (r) => r.storeName || '—' },
    { key: 'sales', header: t('employees.sales'), render: (r) => money(r.salesTotal) },
    { key: 'tips', header: t('employees.tips'), render: (r) => money(r.tipsTotal) },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        <button onClick={() => setDrawer({ open: true, employee: r })} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setConfirm(r)} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>
      </span>
    ) },
  ]

  const save = async (payload) => {
    try {
      if (drawer.employee) await updateEmployee({ id: drawer.employee.id, ...payload }).unwrap()
      else await createEmployee(payload).unwrap()
      ok(drawer.employee ? t('toasts.employeeUpdated') : t('toasts.employeeCreated'))
      setDrawer({ open: false, employee: null })
    } catch (e) { fail(e) }
  }
  const doDelete = async () => {
    try { await deleteEmployee(confirm.id).unwrap(); ok(t('toasts.employeeDeleted')) } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title={t('employees.title')} subtitle={data ? t('employees.subtitle', { count: data.totalElements }) : ''}>
        <Button onClick={() => setDrawer({ open: true, employee: null })}><Plus className="h-4 w-4" /> {t('employees.add')}</Button>
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder={t('employees.searchPlaceholder')} className="w-full sm:w-72" />
        </div>
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : (
          <>
            <DataTable columns={columns} rows={data?.content ?? []} rowKey={(r) => r.id} empty={t('employees.empty')} />
            {(data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={data.totalPages} onChange={(p) => setPage(p - 1)} />}
          </>
        )}
      </Card>

      <EmployeeDrawer
        open={drawer.open} employee={drawer.employee} stores={stores} roles={roles}
        saving={cS.isLoading || uS.isLoading}
        onClose={() => setDrawer({ open: false, employee: null })} onSave={save}
      />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={t('employees.deleteTitle')} message={t('employees.deleteMsg')} />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
