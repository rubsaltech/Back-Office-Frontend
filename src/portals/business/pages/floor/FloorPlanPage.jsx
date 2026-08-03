import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Badge, Field, Input, Select } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { Modal, ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { apiErrorMessage } from '../../../../lib/apiError'
import {
  useGetFloorsQuery, useCreateFloorMutation, useUpdateFloorMutation, useDeleteFloorMutation,
  useGetTablesQuery, useCreateTableMutation, useUpdateTableMutation, useDeleteTableMutation,
} from '../../../../store/api'

const SIZE = 20
const tableTone = (s) => (s === 'FREE' ? 'success' : s === 'OCCUPIED' ? 'warning' : 'info')

export default function FloorPlanPage() {
  const [tab, setTab] = useState('floors')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState(null)
  const [floorModal, setFloorModal] = useState({ open: false, item: null })
  const [tableModal, setTableModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState(null)

  const floorsQ = useGetFloorsQuery()
  const tablesQ = useGetTablesQuery({ query: query || undefined, page, size: SIZE }, { skip: tab !== 'tables' })
  const floors = floorsQ.data ?? []

  const [createFloor] = useCreateFloorMutation()
  const [updateFloor] = useUpdateFloorMutation()
  const [deleteFloor] = useDeleteFloorMutation()
  const [createTable] = useCreateTableMutation()
  const [updateTable] = useUpdateTableMutation()
  const [deleteTable] = useDeleteTableMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })

  const actions = (onEdit, onDelete) => (
    <span className="flex items-center gap-3">
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>
    </span>
  )

  const floorColumns = [
    { key: 'name', header: 'Floor Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'tableCount', header: 'Total Tables' },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setFloorModal({ open: true, item: r }), () => setConfirm({ kind: 'floor', row: r })) },
  ]
  const tableColumns = [
    { key: 'name', header: 'Table', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'floorName', header: 'Floor', render: (r) => r.floorName || '—' },
    { key: 'seats', header: 'Seats' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={tableTone(r.status)}>{r.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setTableModal({ open: true, item: r }), () => setConfirm({ kind: 'table', row: r })) },
  ]

  const doDelete = async () => {
    try {
      if (confirm.kind === 'floor') { await deleteFloor(confirm.row.id).unwrap(); ok('Floor deleted') }
      else { await deleteTable(confirm.row.id).unwrap(); ok('Table deleted') }
    } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title="Floor Plan">
        <Tabs tabs={[{ value: 'floors', label: 'Floors' }, { value: 'tables', label: 'Tables' }]} value={tab} onChange={(t) => { setTab(t); setPage(0) }} />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0) }} placeholder="Search..." className="w-full sm:w-72" />
          {tab === 'floors'
            ? <Button onClick={() => setFloorModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create Floor</Button>
            : <Button onClick={() => setTableModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create Table</Button>}
        </div>

        {tab === 'floors' ? (
          floorsQ.isLoading ? <Loading /> : floorsQ.isError ? <ErrorState error={floorsQ.error} /> :
            <DataTable columns={floorColumns} rows={floors} rowKey={(r) => r.id} empty="No floors yet." />
        ) : (
          tablesQ.isLoading ? <Loading /> : tablesQ.isError ? <ErrorState error={tablesQ.error} /> : (
            <>
              <DataTable columns={tableColumns} rows={tablesQ.data?.content ?? []} rowKey={(r) => r.id} empty="No tables yet." />
              {(tablesQ.data?.totalPages ?? 0) > 1 && <Pagination page={page + 1} pageCount={tablesQ.data.totalPages} onChange={(p) => setPage(p - 1)} />}
            </>
          )
        )}
      </Card>

      <FloorModal state={floorModal} onClose={() => setFloorModal({ open: false, item: null })}
        onSave={async (body) => {
          try {
            if (floorModal.item) await updateFloor({ id: floorModal.item.id, ...body }).unwrap()
            else await createFloor(body).unwrap()
            ok(floorModal.item ? 'Floor updated' : 'Floor created'); setFloorModal({ open: false, item: null })
          } catch (e) { fail(e) }
        }} />
      <TableModal state={tableModal} floors={floors} onClose={() => setTableModal({ open: false, item: null })}
        onSave={async (body) => {
          try {
            if (tableModal.item) await updateTable({ id: tableModal.item.id, ...body }).unwrap()
            else await createTable(body).unwrap()
            ok(tableModal.item ? 'Table updated' : 'Table created'); setTableModal({ open: false, item: null })
          } catch (e) { fail(e) }
        }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={confirm?.kind === 'floor' ? 'Delete Floor' : 'Delete Table'} message="Are you sure? This cannot be undone." />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function FloorModal({ state, onClose, onSave }) {
  const [name, setName] = useState('')
  useEffect(() => { if (state.open) setName(state.item?.name || '') }, [state.open, state.item])
  return (
    <Modal open={state.open} onClose={onClose} title={state.item ? 'Edit Floor' : 'Create Floor'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave({ name })}>{state.item ? 'Save' : 'Create'}</Button></>}>
      <Field label="Floor Name" required><Input placeholder="e.g. Ground Floor" value={name} onChange={(e) => setName(e.target.value)} /></Field>
    </Modal>
  )
}

function TableModal({ state, floors, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', floorId: '', seats: '', status: 'FREE' })
  useEffect(() => {
    if (state.open) {
      setForm(state.item
        ? { name: state.item.name, floorId: state.item.floorId ?? '', seats: state.item.seats ?? '', status: state.item.status ?? 'FREE' }
        : { name: '', floorId: floors[0]?.id ?? '', seats: '', status: 'FREE' })
    }
  }, [state.open, state.item, floors])
  const submit = () => onSave({
    name: form.name, floorId: form.floorId ? Number(form.floorId) : null,
    seats: Number(form.seats) || 0, status: form.status,
  })
  return (
    <Modal open={state.open} onClose={onClose} title={state.item ? 'Edit Table' : 'Create Table'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{state.item ? 'Save' : 'Create'}</Button></>}>
      <div className="space-y-4">
        <Field label="Table Name" required><Input placeholder="e.g. T1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Floor">
          <Select value={form.floorId} onChange={(e) => setForm((f) => ({ ...f, floorId: e.target.value }))}>
            <option value="">No floor</option>
            {floors.map((fl) => <option key={fl.id} value={fl.id}>{fl.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Seats" required><Input type="number" placeholder="e.g. 4" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="FREE">Free</option>
              <option value="CHECKED_IN">Checked-in</option>
              <option value="OCCUPIED">Occupied</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
