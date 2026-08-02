import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Badge, Field, Input, Select } from '../../../../shared/ui'
import { DataTable, SearchInput } from '../../../../shared/DataTable'
import { Modal, ConfirmDialog, SuccessDialog } from '../../../../shared/Overlay'
import { floors as seedFloors, tables as seedTables } from '../../data/mock'

export default function FloorPlanPage() {
  const [tab, setTab] = useState('floors')
  const [query, setQuery] = useState('')
  const [floors, setFloors] = useState(seedFloors)
  const [tables, setTables] = useState(seedTables)
  const [floorModal, setFloorModal] = useState({ open: false, item: null })
  const [tableModal, setTableModal] = useState({ open: false, item: null })
  const [confirm, setConfirm] = useState(null)
  const [success, setSuccess] = useState(null)

  const actions = (onEdit, onDelete) => (
    <span className="flex items-center gap-3">
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="text-danger hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
    </span>
  )

  const floorColumns = [
    { key: 'name', header: 'Floor Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'tables', header: 'Total Tables' },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setFloorModal({ open: true, item: r }), () => setConfirm({ kind: 'floor', row: r })) },
  ]
  const tableColumns = [
    { key: 'name', header: 'Table', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'floor', header: 'Floor' },
    { key: 'seats', header: 'Seats' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Free' ? 'success' : 'warning'}>{r.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => actions(() => setTableModal({ open: true, item: r }), () => setConfirm({ kind: 'table', row: r })) },
  ]

  const floorRows = floors.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
  const tableRows = tables.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))

  const doDelete = () => {
    if (confirm.kind === 'floor') {
      setFloors((f) => f.filter((x) => x.id !== confirm.row.id))
      setSuccess('Floor deleted successfully')
    } else {
      setTables((t) => t.filter((x) => x.id !== confirm.row.id))
      setSuccess('Table deleted successfully')
    }
  }

  return (
    <div>
      <PageHeader title="Floor Plan">
        <Tabs
          tabs={[{ value: 'floors', label: 'Floors' }, { value: 'tables', label: 'Tables' }]}
          value={tab}
          onChange={setTab}
        />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search..." className="w-full sm:w-72" />
          {tab === 'floors' ? (
            <Button onClick={() => setFloorModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create Floor</Button>
          ) : (
            <Button onClick={() => setTableModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Create Table</Button>
          )}
        </div>

        {tab === 'floors'
          ? <DataTable columns={floorColumns} rows={floorRows} rowKey={(r) => r.id} />
          : <DataTable columns={tableColumns} rows={tableRows} rowKey={(r) => r.id} />}
      </Card>

      <FloorModal
        state={floorModal}
        onClose={() => setFloorModal({ open: false, item: null })}
        onSave={(form) => {
          if (floorModal.item) {
            setFloors((f) => f.map((x) => (x.id === floorModal.item.id ? { ...x, ...form, tables: Number(form.tables) } : x)))
            setSuccess('Floor updated successfully')
          } else {
            setFloors((f) => [{ ...form, id: Date.now(), tables: Number(form.tables) || 0 }, ...f])
            setSuccess('Floor created successfully')
          }
          setFloorModal({ open: false, item: null })
        }}
      />
      <TableModal
        state={tableModal}
        floors={floors}
        onClose={() => setTableModal({ open: false, item: null })}
        onSave={(form) => {
          if (tableModal.item) {
            setTables((t) => t.map((x) => (x.id === tableModal.item.id ? { ...x, ...form, seats: Number(form.seats) } : x)))
            setSuccess('Table updated successfully')
          } else {
            setTables((t) => [{ ...form, id: Date.now(), seats: Number(form.seats) || 0, status: 'Free' }, ...t])
            setSuccess('Table created successfully')
          }
          setTableModal({ open: false, item: null })
        }}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title={confirm?.kind === 'floor' ? 'Delete Floor' : 'Delete Table'}
        message="Are you sure you want to delete this? This action cannot be undone."
      />
      <SuccessDialog open={!!success} onClose={() => setSuccess(null)} message={success} />
    </div>
  )
}

function FloorModal({ state, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', tables: '' })
  useEffect(() => {
    if (state.open) setForm(state.item ? { name: state.item.name, tables: state.item.tables } : { name: '', tables: '' })
  }, [state.open, state.item])
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.item ? 'Edit Floor' : 'Create Floor'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{state.item ? 'Save' : 'Create'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Floor Name" required>
          <Input placeholder="e.g. Ground Floor" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Total Tables" required>
          <Input type="number" placeholder="Number of tables" value={form.tables} onChange={(e) => setForm((f) => ({ ...f, tables: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  )
}

function TableModal({ state, floors, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', floor: '', seats: '' })
  useEffect(() => {
    if (state.open) setForm(state.item ? { name: state.item.name, floor: state.item.floor, seats: state.item.seats } : { name: '', floor: floors[0]?.name ?? '', seats: '' })
  }, [state.open, state.item, floors])
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.item ? 'Edit Table' : 'Create Table'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>{state.item ? 'Save' : 'Create'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Table Name" required>
          <Input placeholder="e.g. T1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Floor" required>
          <Select value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}>
            {floors.map((fl) => <option key={fl.id}>{fl.name}</option>)}
          </Select>
        </Field>
        <Field label="Total Seats" required>
          <Input type="number" placeholder="Number of seats" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} />
        </Field>
      </div>
    </Modal>
  )
}
