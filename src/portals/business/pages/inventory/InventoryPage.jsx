import { useState } from 'react'
import { Plus, Upload, Pencil, Trash2, Eye } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Badge, Avatar } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { ConfirmDialog, SuccessDialog } from '../../../../shared/Overlay'
import { money, number } from '../../../../lib/format'
import { products as seedProducts, inventoryItems, categories as seedCategories } from '../../data/mock'
import { ProductDrawer } from './ProductDrawer'
import { CategoryModal, CsvUploadModal } from './CategoryModal'

const statusTone = (s) => (s === 'Active' ? 'success' : 'neutral')

export default function InventoryPage() {
  const [tab, setTab] = useState('products')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [products, setProducts] = useState(seedProducts)
  const [categories, setCategories] = useState(seedCategories)

  const [productDrawer, setProductDrawer] = useState({ open: false, product: null })
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null })
  const [csvOpen, setCsvOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [success, setSuccess] = useState(null)

  const notify = (message) => setSuccess({ open: true, message })

  const RowActions = ({ onView, onEdit, onDelete }) => (
    <span className="flex items-center gap-3">
      {onView && <button onClick={onView} className="text-success hover:opacity-70"><Eye className="h-4 w-4" /></button>}
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="text-danger hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
    </span>
  )

  const productColumns = [
    {
      key: 'name',
      header: 'Product',
      render: (r) => (
        <span className="flex items-center gap-3">
          <Avatar name={r.name} size={32} />
          <span className="font-medium">{r.name}</span>
        </span>
      ),
    },
    { key: 'sku', header: 'SKU', render: (r) => <span className="text-muted">{r.sku}</span> },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price', render: (r) => money(r.price) },
    { key: 'qty', header: 'Qty' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <RowActions
          onEdit={() => setProductDrawer({ open: true, product: r })}
          onDelete={() => setConfirm({ type: 'product', row: r })}
        />
      ),
    },
  ]

  const inventoryColumns = [
    { key: 'name', header: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'available', header: 'Available Qty' },
    { key: 'price', header: 'Price', render: (r) => money(r.price) },
    { key: 'sold', header: 'Quantity Sold' },
    { key: 'total', header: 'Total Qty' },
  ]

  const categoryColumns = [
    { key: 'name', header: 'Category', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'products', header: 'Products', render: (r) => number(r.products) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <RowActions
          onEdit={() => setCategoryModal({ open: true, category: r })}
          onDelete={() => setConfirm({ type: 'category', row: r })}
        />
      ),
    },
  ]

  const filtered = (rows) =>
    rows.filter((r) => (r.name ?? '').toLowerCase().includes(query.toLowerCase()))

  const doDelete = () => {
    if (confirm.type === 'product') {
      setProducts((p) => p.filter((x) => x.id !== confirm.row.id))
      notify('Product deleted successfully')
    } else {
      setCategories((c) => c.filter((x) => x.id !== confirm.row.id))
      notify('Category deleted successfully')
    }
  }

  const saveProduct = (form) => {
    if (productDrawer.product) {
      setProducts((p) => p.map((x) => (x.id === productDrawer.product.id ? { ...x, ...form } : x)))
      notify('Product updated successfully')
    } else {
      setProducts((p) => [{ ...form, id: Date.now() }, ...p])
      notify('Product added successfully')
    }
    setProductDrawer({ open: false, product: null })
  }

  const saveCategory = (form) => {
    if (categoryModal.category) {
      setCategories((c) => c.map((x) => (x.id === categoryModal.category.id ? { ...x, ...form } : x)))
      notify('Category updated successfully')
    } else {
      setCategories((c) => [{ ...form, id: Date.now(), products: 0 }, ...c])
      notify('Category created successfully')
    }
    setCategoryModal({ open: false, category: null })
  }

  return (
    <div>
      <PageHeader title="Inventory Management">
        <Tabs
          tabs={[
            { value: 'products', label: 'Products' },
            { value: 'inventory', label: 'Inventory' },
            { value: 'categories', label: 'Categories' },
          ]}
          value={tab}
          onChange={(t) => {
            setTab(t)
            setPage(1)
          }}
        />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search..." className="w-72" />
          <div className="flex gap-3">
            {tab !== 'inventory' && (
              <Button variant="secondary" onClick={() => setCsvOpen(true)}>
                <Upload className="h-4 w-4" /> Upload CSV
              </Button>
            )}
            {tab === 'products' && (
              <Button onClick={() => setProductDrawer({ open: true, product: null })}>
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            )}
            {tab === 'categories' && (
              <Button onClick={() => setCategoryModal({ open: true, category: null })}>
                <Plus className="h-4 w-4" /> Create Category
              </Button>
            )}
          </div>
        </div>

        {tab === 'products' && <DataTable columns={productColumns} rows={filtered(products)} rowKey={(r) => r.id} />}
        {tab === 'inventory' && <DataTable columns={inventoryColumns} rows={filtered(inventoryItems)} rowKey={(r) => r.id} />}
        {tab === 'categories' && <DataTable columns={categoryColumns} rows={filtered(categories)} rowKey={(r) => r.id} />}

        <Pagination page={page} pageCount={5} onChange={setPage} />
      </Card>

      <ProductDrawer
        open={productDrawer.open}
        product={productDrawer.product}
        onClose={() => setProductDrawer({ open: false, product: null })}
        onSave={saveProduct}
      />
      <CategoryModal
        open={categoryModal.open}
        category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSave={saveCategory}
      />
      <CsvUploadModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onDone={() => {
          setCsvOpen(false)
          notify('File uploaded — products added')
        }}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title={confirm?.type === 'product' ? 'Delete Product' : 'Delete Category'}
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
      <SuccessDialog open={!!success?.open} onClose={() => setSuccess(null)} message={success?.message} />
    </div>
  )
}
