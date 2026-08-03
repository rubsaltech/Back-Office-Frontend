import { useState } from 'react'
import { Plus, Upload, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Badge, Avatar, Field, Input } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { Modal, ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { money, number } from '../../../../lib/format'
import { ProductDrawer } from './ProductDrawer'
import { CategoryModal, CsvUploadModal } from './CategoryModal'
import { apiErrorMessage } from '../../../../lib/apiError'
import {
  useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useImportProductsMutation, useGetInventoryQuery, useAdjustInventoryMutation,
  useGetCategoriesQuery, useGetAllCategoriesQuery, useCreateCategoryMutation,
  useUpdateCategoryMutation, useDeleteCategoryMutation,
} from '../../../../store/api'

const tone = (s) => (s === 'ACTIVE' ? 'success' : 'neutral')
const SIZE = 10

export default function InventoryPage() {
  const [tab, setTab] = useState('products')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0) // 0-based for the API
  const [toast, setToast] = useState(null)

  const [productDrawer, setProductDrawer] = useState({ open: false, product: null })
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null })
  const [adjust, setAdjust] = useState(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const params = { query: query || undefined, page, size: SIZE }
  const productsQ = useGetProductsQuery(params, { skip: tab !== 'products' })
  const inventoryQ = useGetInventoryQuery(params, { skip: tab !== 'inventory' })
  const categoriesQ = useGetCategoriesQuery(params, { skip: tab !== 'categories' })
  const { data: allCategories = [] } = useGetAllCategoriesQuery()

  const [createProduct, cpS] = useCreateProductMutation()
  const [updateProduct, upS] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [importProducts] = useImportProductsMutation()
  const [adjustInventory, adjS] = useAdjustInventoryMutation()
  const [createCategory] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })
  const changeTab = (t) => { setTab(t); setPage(0); setQuery('') }
  const onSearch = (v) => { setQuery(v); setPage(0) }

  const active = tab === 'products' ? productsQ : tab === 'inventory' ? inventoryQ : categoriesQ

  const rowActions = (onEdit, onDelete) => (
    <span className="flex items-center gap-3">
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      {onDelete && <button onClick={onDelete} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>}
    </span>
  )

  const productColumns = [
    { key: 'name', header: 'Product', render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} size={32} /><span className="font-medium">{r.name}</span></span> },
    { key: 'sku', header: 'SKU', render: (r) => <span className="text-muted">{r.sku}</span> },
    { key: 'category', header: 'Category', render: (r) => r.categoryName || '—' },
    { key: 'price', header: 'Price', render: (r) => money(r.price) },
    { key: 'qty', header: 'Qty', render: (r) => r.availableQty },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => rowActions(() => setProductDrawer({ open: true, product: r }), () => setConfirm({ type: 'product', row: r })) },
  ]
  const inventoryColumns = [
    { key: 'name', header: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'availableQty', header: 'Available Qty' },
    { key: 'price', header: 'Price', render: (r) => money(r.price) },
    { key: 'quantitySold', header: 'Quantity Sold' },
    { key: 'totalQty', header: 'Total Qty' },
    { key: 'actions', header: 'Actions', render: (r) => rowActions(() => setAdjust({ productId: r.productId, availableQty: r.availableQty, totalQty: r.totalQty, name: r.name })) },
  ]
  const categoryColumns = [
    { key: 'name', header: 'Category', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'products', header: 'Products', render: (r) => number(r.productCount) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (r) => rowActions(() => setCategoryModal({ open: true, category: r }), () => setConfirm({ type: 'category', row: r })) },
  ]

  const saveProduct = async (payload) => {
    try {
      if (productDrawer.product) await updateProduct({ id: productDrawer.product.id, ...payload }).unwrap()
      else await createProduct(payload).unwrap()
      ok(productDrawer.product ? 'Product updated' : 'Product added')
      setProductDrawer({ open: false, product: null })
    } catch (e) { fail(e) }
  }
  const saveCategory = async (form) => {
    try {
      if (categoryModal.category) await updateCategory({ id: categoryModal.category.id, ...form }).unwrap()
      else await createCategory(form).unwrap()
      ok(categoryModal.category ? 'Category updated' : 'Category created')
      setCategoryModal({ open: false, category: null })
    } catch (e) { fail(e) }
  }
  const doDelete = async () => {
    try {
      if (confirm.type === 'product') { await deleteProduct(confirm.row.id).unwrap(); ok('Product deleted') }
      else { await deleteCategory(confirm.row.id).unwrap(); ok('Category deleted') }
    } catch (e) { fail(e) }
  }
  const saveAdjust = async () => {
    try {
      await adjustInventory({ productId: adjust.productId, availableQty: Number(adjust.availableQty), totalQty: Number(adjust.totalQty) }).unwrap()
      ok('Stock updated'); setAdjust(null)
    } catch (e) { fail(e) }
  }
  const doImport = async (file) => {
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await importProducts(fd).unwrap()
      ok(`Imported ${res.imported}, skipped ${res.skipped}`); setCsvOpen(false)
    } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title="Inventory Management">
        <Tabs
          tabs={[{ value: 'products', label: 'Products' }, { value: 'inventory', label: 'Inventory' }, { value: 'categories', label: 'Categories' }]}
          value={tab} onChange={changeTab}
        />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={onSearch} placeholder="Search..." className="w-full sm:w-72" />
          <div className="flex gap-3">
            {tab === 'products' && <Button variant="secondary" onClick={() => setCsvOpen(true)}><Upload className="h-4 w-4" /> Upload CSV</Button>}
            {tab === 'products' && <Button onClick={() => setProductDrawer({ open: true, product: null })}><Plus className="h-4 w-4" /> Add Product</Button>}
            {tab === 'categories' && <Button onClick={() => setCategoryModal({ open: true, category: null })}><Plus className="h-4 w-4" /> Create Category</Button>}
          </div>
        </div>

        {active.isLoading ? <Loading /> : active.isError ? <ErrorState error={active.error} /> : (
          <>
            {tab === 'products' && <DataTable columns={productColumns} rows={productsQ.data?.content ?? []} rowKey={(r) => r.id} empty="No products yet." />}
            {tab === 'inventory' && <DataTable columns={inventoryColumns} rows={inventoryQ.data?.content ?? []} rowKey={(r) => r.productId} empty="No inventory yet." />}
            {tab === 'categories' && <DataTable columns={categoryColumns} rows={categoriesQ.data?.content ?? []} rowKey={(r) => r.id} empty="No categories yet." />}
            {(active.data?.totalPages ?? 0) > 1 && (
              <Pagination page={page + 1} pageCount={active.data.totalPages} onChange={(p) => setPage(p - 1)} />
            )}
          </>
        )}
      </Card>

      <ProductDrawer
        open={productDrawer.open} product={productDrawer.product} categories={allCategories}
        saving={cpS.isLoading || upS.isLoading}
        onClose={() => setProductDrawer({ open: false, product: null })} onSave={saveProduct}
      />
      <CategoryModal
        open={categoryModal.open} category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, category: null })} onSave={saveCategory}
      />
      <CsvUploadModal open={csvOpen} onClose={() => setCsvOpen(false)} onDone={doImport} />

      <Modal
        open={!!adjust} onClose={() => setAdjust(null)} title={`Adjust Stock — ${adjust?.name ?? ''}`}
        footer={<><Button variant="secondary" onClick={() => setAdjust(null)}>Cancel</Button><Button onClick={saveAdjust} disabled={adjS.isLoading}>Save</Button></>}
      >
        {adjust && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Available Qty"><Input type="number" value={adjust.availableQty} onChange={(e) => setAdjust((a) => ({ ...a, availableQty: e.target.value }))} /></Field>
            <Field label="Total Qty"><Input type="number" value={adjust.totalQty} onChange={(e) => setAdjust((a) => ({ ...a, totalQty: e.target.value }))} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={confirm?.type === 'product' ? 'Delete Product' : 'Delete Category'}
        message="Are you sure you want to delete this item? This cannot be undone."
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
