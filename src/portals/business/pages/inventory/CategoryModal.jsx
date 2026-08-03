import { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { Modal } from '../../../../shared/Overlay'
import { Button, Field, Input, Select } from '../../../../shared/ui'

export function CategoryModal({ open, onClose, onSave, category }) {
  const [form, setForm] = useState({ name: '', status: 'ACTIVE' })

  useEffect(() => {
    setForm(category ? { name: category.name, status: category.status } : { name: '', status: 'ACTIVE' })
  }, [category, open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave?.(form)}>{category ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <button className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas text-muted">
          <Camera className="h-6 w-6" />
        </button>
        <Field label="Category Name" required>
          <Input placeholder="Enter category name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Status" required>
          <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

export function CsvUploadModal({ open, onClose, onDone }) {
  const [file, setFile] = useState(null)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload CSV File"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onDone?.(file)} disabled={!file}>Upload</Button>
        </>
      }
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-canvas py-12 text-center">
        <span className="text-sm font-medium text-ink">Click to browse or drag a .csv file here</span>
        <span className="text-xs text-muted">{file ? file.name : 'Products will be added to the selected store'}</span>
        <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
    </Modal>
  )
}
