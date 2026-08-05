import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
    { key: 'name', header: t('inventory.product'), render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} size={32} /><span className="font-medium">{r.name}</span></span> },
    { key: 'sku', header: t('inventory.sku'), render: (r) => <span className="text-muted">{r.sku}</span> },
    { key: 'category', header: t('inventory.category'), render: (r) => r.categoryName || '—' },
    { key: 'price', header: t('common.price'), render: (r) => money(r.price) },
    { key: 'qty', header: t('inventory.qty'), render: (r) => r.availableQty },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={tone(r.status)}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => rowActions(() => setProductDrawer({ open: true, product: r }), () => setConfirm({ type: 'product', row: r })) },
  ]
  const inventoryColumns = [
    { key: 'name', header: t('inventory.product'), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'availableQty', header: t('inventory.availableQty') },
    { key: 'price', header: t('common.price'), render: (r) => money(r.price) },
    { key: 'quantitySold', header: t('inventory.quantitySold') },
    { key: 'totalQty', header: t('inventory.totalQty') },
    { key: 'actions', header: t('common.actions'), render: (r) => rowActions(() => setAdjust({ productId: r.productId, availableQty: r.availableQty, totalQty: r.totalQty, name: r.name })) },
  ]
  const categoryColumns = [
    { key: 'name', header: t('inventory.category'), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'products', header: t('inventory.products'), render: (r) => number(r.productCount) },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={tone(r.status)}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => rowActions(() => setCategoryModal({ open: true, category: r }), () => setConfirm({ type: 'category', row: r })) },
  ]

  const saveProduct = async (payload) => {
    try {
      if (productDrawer.product) await updateProduct({ id: productDrawer.product.id, ...payload }).unwrap()
      else await createProduct(payload).unwrap()
      ok(productDrawer.product ? t('toasts.productUpdated') : t('toasts.productAdded'))
      setProductDrawer({ open: false, product: null })
    } catch (e) { fail(e) }
  }
  const saveCategory = async (form) => {
    try {
      if (categoryModal.category) await updateCategory({ id: categoryModal.category.id, ...form }).unwrap()
      else await createCategory(form).unwrap()
      ok(categoryModal.category ? t('toasts.categoryUpdated') : t('toasts.categoryCreated'))
      setCategoryModal({ open: false, category: null })
    } catch (e) { fail(e) }
  }
  const doDelete = async () => {
    try {
      if (confirm.type === 'product') { await deleteProduct(confirm.row.id).unwrap(); ok(t('toasts.productDeleted')) }
      else { await deleteCategory(confirm.row.id).unwrap(); ok(t('toasts.categoryDeleted')) }
    } catch (e) { fail(e) }
  }
  const saveAdjust = async () => {
    try {
      await adjustInventory({ productId: adjust.productId, availableQty: Number(adjust.availableQty), totalQty: Number(adjust.totalQty) }).unwrap()
      ok(t('toasts.stockUpdated')); setAdjust(null)
    } catch (e) { fail(e) }
  }
  const doImport = async (file) => {
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await importProducts(fd).unwrap()
      ok(t('toasts.imported', { imported: res.imported, skipped: res.skipped })); setCsvOpen(false)
    } catch (e) { fail(e) }
  }

  return (
    <div>
      <PageHeader title={t('inventory.title')}>
        <Tabs
          tabs={[{ value: 'products', label: t('inventory.tabs.products') }, { value: 'inventory', label: t('inventory.tabs.inventory') }, { value: 'categories', label: t('inventory.tabs.categories') }]}
          value={tab} onChange={changeTab}
        />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={onSearch} placeholder={t('common.search')} className="w-full sm:w-72" />
          <div className="flex gap-3">
            {tab === 'products' && <Button variant="secondary" onClick={() => setCsvOpen(true)}><Upload className="h-4 w-4" /> {t('inventory.uploadCsv')}</Button>}
            {tab === 'products' && <Button onClick={() => setProductDrawer({ open: true, product: null })}><Plus className="h-4 w-4" /> {t('inventory.addProduct')}</Button>}
            {tab === 'categories' && <Button onClick={() => setCategoryModal({ open: true, category: null })}><Plus className="h-4 w-4" /> {t('inventory.createCategory')}</Button>}
          </div>
        </div>

        {active.isLoading ? <Loading /> : active.isError ? <ErrorState error={active.error} /> : (
          <>
            {tab === 'products' && <DataTable columns={productColumns} rows={productsQ.data?.content ?? []} rowKey={(r) => r.id} empty={t('inventory.emptyProducts')} />}
            {tab === 'inventory' && <DataTable columns={inventoryColumns} rows={inventoryQ.data?.content ?? []} rowKey={(r) => r.productId} empty={t('inventory.emptyInventory')} />}
            {tab === 'categories' && <DataTable columns={categoryColumns} rows={categoriesQ.data?.content ?? []} rowKey={(r) => r.id} empty={t('inventory.emptyCategories')} />}
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
        open={!!adjust} onClose={() => setAdjust(null)} title={`${t('inventory.adjustTitle')} — ${adjust?.name ?? ''}`}
        footer={<><Button variant="secondary" onClick={() => setAdjust(null)}>{t('common.cancel')}</Button><Button onClick={saveAdjust} disabled={adjS.isLoading}>{t('common.save')}</Button></>}
      >
        {adjust && (
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('inventory.availableQty')}><Input type="number" value={adjust.availableQty} onChange={(e) => setAdjust((a) => ({ ...a, availableQty: e.target.value }))} /></Field>
            <Field label={t('inventory.totalQty')}><Input type="number" value={adjust.totalQty} onChange={(e) => setAdjust((a) => ({ ...a, totalQty: e.target.value }))} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={confirm?.type === 'product' ? t('inventory.deleteProductTitle') : t('inventory.deleteCategoryTitle')}
        message={t('inventory.deleteItemMsg')}
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
