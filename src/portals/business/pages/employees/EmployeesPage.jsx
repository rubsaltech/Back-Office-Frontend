import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../../../../shared/Page'
import { Card, Button, Badge, Avatar } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { ConfirmDialog, SuccessDialog } from '../../../../shared/Overlay'
import { money } from '../../../../lib/format'
import { employees as seed } from '../../data/mock'
import { EmployeeDrawer } from './EmployeeDrawer'

export default function EmployeesPage() {
  const [rows, setRows] = useState(seed)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState({ open: false, employee: null })
  const [confirm, setConfirm] = useState(null)
  const [success, setSuccess] = useState(null)

  const columns = [
    { key: 'id', header: 'Employee ID', render: (r) => <span className="text-muted">{r.id}</span> },
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.name} size={30} /> <span className="font-medium">{r.name}</span>
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (r) => <span className="text-muted">{r.email}</span> },
    { key: 'role', header: 'Role', render: (r) => <Badge tone="info">{r.role}</Badge> },
    { key: 'store', header: 'Store' },
    { key: 'sales', header: 'Sales', render: (r) => money(r.sales) },
    { key: 'tips', header: 'Tips', render: (r) => money(r.tips) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <span className="flex items-center gap-3">
          <button onClick={() => setDrawer({ open: true, employee: r })} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setConfirm(r)} className="text-danger hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
        </span>
      ),
    },
  ]

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))

  const save = (form) => {
    if (drawer.employee) {
      setRows((rs) => rs.map((x) => (x.id === drawer.employee.id ? { ...x, ...form } : x)))
      setSuccess('Employee updated successfully')
    } else {
      setRows((rs) => [{ ...form, id: `2531${Math.floor(Math.random() * 9000)}`, sales: 0, tips: 0 }, ...rs])
      setSuccess('Employee created successfully')
    }
    setDrawer({ open: false, employee: null })
  }

  return (
    <div>
      <PageHeader title="Employee Management" subtitle={`You have ${rows.length} employees in this store`}>
        <Button onClick={() => setDrawer({ open: true, employee: null })}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5">
          <SearchInput value={query} onChange={setQuery} placeholder="Search employees..." className="w-72" />
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} />
        <Pagination page={page} pageCount={3} onChange={setPage} />
      </Card>

      <EmployeeDrawer
        open={drawer.open}
        employee={drawer.employee}
        onClose={() => setDrawer({ open: false, employee: null })}
        onSave={save}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setRows((rs) => rs.filter((x) => x.id !== confirm.id))
          setSuccess('Employee deleted successfully')
        }}
        title="Delete Employee"
        message="Are you sure you want to remove this employee?"
      />
      <SuccessDialog open={!!success} onClose={() => setSuccess(null)} message={success} />
    </div>
  )
}
