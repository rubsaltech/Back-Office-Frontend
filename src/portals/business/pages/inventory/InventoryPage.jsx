import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Upload, Pencil, Trash2, Eye, PackagePlus, SlidersHorizontal, History, Barcode } from 'lucide-react'
import { PageHeader, Tabs } from '../../../../shared/Page'
import { Card, Button, Badge, Avatar, Field, Input, Select, Toggle } from '../../../../shared/ui'
import { DataTable, SearchInput, Pagination } from '../../../../shared/DataTable'
import { Modal, ConfirmDialog } from '../../../../shared/Overlay'
import { Loading, ErrorState, Toast } from '../../../../shared/States'
import { money, number } from '../../../../lib/format'
import { ProductDrawer } from './ProductDrawer'
import { ProductViewModal } from './ProductViewModal'
import { CategoryModal, CsvUploadModal } from './CategoryModal'
import { usePermissions } from '../../auth/permissions'
import { apiErrorMessage } from '../../../../lib/apiError'
import {
  useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useImportProductsMutation, useGetInventoryQuery, useReceiveStockMutation, useAdjustStockMutation,
  useGetStockMovementsQuery, useGetVariantUnitsQuery, useGetVariantCaptureLabelsQuery, useRetireUnitMutation,
  useGetCategoriesQuery, useGetAllCategoriesQuery, useCreateCategoryMutation,
  useUpdateCategoryMutation, useDeleteCategoryMutation,
} from '../../../../store/api'

const tone = (s) => (s === 'ACTIVE' ? 'success' : 'neutral')
const SIZE = 10

// Stock status from on-hand vs the variant's reorder point.
function stockStatus(r) {
  const threshold = r.lowStockThreshold ?? 0
  if (r.onHand <= 0) return { key: 'out', tone: 'danger' }
  if (r.onHand <= threshold) return { key: 'low', tone: 'warning' }
  return { key: 'in', tone: 'success' }
}

// Product-level summaries derived from its variants.
const productOnHand = (p) => (p.variants ?? []).reduce((s, v) => s + (v.onHand || 0), 0)
function productPrice(p, t) {
  const prices = (p.variants ?? []).map((v) => Number(v.price) || 0)
  if (!prices.length) return money(0)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? money(min) : `${money(min)} – ${money(max)}`
}
const attrText = (r) => Object.values(r.attributes ?? {}).filter(Boolean).join(' / ')

export default function InventoryPage() {
  const { t } = useTranslation()
  const { has } = usePermissions()
  const [tab, setTab] = useState('products')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState(null)

  const [productDrawer, setProductDrawer] = useState({ open: false, product: null })
  const [viewProduct, setViewProduct] = useState(null)
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null })
  const [receive, setReceive] = useState(null)
  const [adjust, setAdjust] = useState(null)
  const [movementsOf, setMovementsOf] = useState(null)
  const [unitsOf, setUnitsOf] = useState(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const params = { query: query || undefined, page, size: SIZE }
  const productsQ = useGetProductsQuery(params, { skip: tab !== 'products' })
  const inventoryQ = useGetInventoryQuery({ ...params, lowStock: lowStockOnly || undefined }, { skip: tab !== 'inventory' })
  const categoriesQ = useGetCategoriesQuery(params, { skip: tab !== 'categories' })
  const { data: allCategories = [] } = useGetAllCategoriesQuery()

  const [createProduct, cpS] = useCreateProductMutation()
  const [updateProduct, upS] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [importProducts] = useImportProductsMutation()
  const [adjustStock, adjS] = useAdjustStockMutation()
  const [createCategory] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const ok = (m) => setToast({ type: 'success', message: m })
  const fail = (e) => setToast({ type: 'error', message: apiErrorMessage(e) })
  const changeTab = (tb) => { setTab(tb); setPage(0); setQuery(''); setLowStockOnly(false) }
  const toggleLowStock = (v) => { setLowStockOnly(v); setPage(0) }
  const onSearch = (v) => { setQuery(v); setPage(0) }

  const active = tab === 'products' ? productsQ : tab === 'inventory' ? inventoryQ : categoriesQ

  const productColumns = [
    { key: 'name', header: t('inventory.product'), render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} size={32} /><span className="font-medium">{r.name}</span></span> },
    { key: 'sku', header: t('inventory.sku'), render: (r) => <span className="text-muted">{r.sku}</span> },
    { key: 'category', header: t('inventory.category'), render: (r) => r.categoryName || '—' },
    { key: 'variants', header: t('inventory.variants'), render: (r) => (r.hasVariants ? number((r.variants ?? []).length) : t('inventory.simple')) },
    { key: 'price', header: t('common.price'), render: (r) => productPrice(r, t) },
    { key: 'qty', header: t('inventory.qty'), render: (r) => number(productOnHand(r)) },
    { key: 'status', header: t('common.status'), render: (r) => <Badge tone={tone(r.status)}>{t(`common.${r.status === 'ACTIVE' ? 'active' : 'inactive'}`)}</Badge> },
    { key: 'actions', header: t('common.actions'), render: (r) => (
      <span className="flex items-center gap-3">
        <button onClick={() => setViewProduct(r)} className="text-muted hover:text-ink" title={t('inventory.viewTitle')}><Eye className="h-4 w-4" /></button>
        <button onClick={() => setProductDrawer({ open: true, product: r })} className="text-brand-600 hover:text-brand-800" title={t('common.edit')}><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setConfirm({ type: 'product', row: r })} className="text-danger hover:text-danger-strong" title={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
      </span>
    ) },
  ]

  const inventoryColumns = [
    { key: 'name', header: t('inventory.product'), render: (r) => (
      <span className="flex flex-col">
        <span className="font-medium">{r.productName}</span>
        {!r.isDefault && <span className="text-xs text-muted">{attrText(r) || r.variantName}</span>}
      </span>
    ) },
    { key: 'sku', header: t('inventory.sku'), render: (r) => <span className="text-muted">{r.sku}</span> },
    { key: 'onHand', header: t('inventory.availableQty'), render: (r) => number(r.onHand) },
    { key: 'stock', header: t('inventory.stockStatus'), render: (r) => { const s = stockStatus(r); return <Badge tone={s.tone}>{t(`inventory.stock.${s.key}`)}</Badge> } },
    { key: 'price', header: t('common.price'), render: (r) => money(r.price) },
    { key: 'quantitySold', header: t('inventory.quantitySold'), render: (r) => number(r.quantitySold) },
    { key: 'totalReceived', header: t('inventory.totalReceived'), render: (r) => number(r.totalReceived) },
    { key: 'actions', header: t('common.actions'), render: (r) => {
      const unitTracked = r.trackingType === 'SERIAL'
      const label = r.productName + (!r.isDefault ? ` — ${r.variantName}` : '')
      return (
      <span className="flex items-center gap-3">
        <button onClick={() => setReceive({ variantId: r.variantId, name: r.productName, variant: r.variantName, isDefault: r.isDefault, onHand: r.onHand, unitTracked })} className="text-success hover:opacity-80" title={t('inventory.receiveTitle')}><PackagePlus className="h-4 w-4" /></button>
        {unitTracked ? (
          <button onClick={() => setUnitsOf({ variantId: r.variantId, name: label })} className="text-brand-600 hover:text-brand-800" title={t('inventory.unitsTitle')}><Barcode className="h-4 w-4" /></button>
        ) : (
          <button onClick={() => setAdjust({ variantId: r.variantId, name: r.productName, onHand: r.onHand, newOnHand: String(r.onHand), reason: '' })} className="text-brand-600 hover:text-brand-800" title={t('inventory.adjustTitle')}><SlidersHorizontal className="h-4 w-4" /></button>
        )}
        <button onClick={() => setMovementsOf({ variantId: r.variantId, name: r.productName })} className="text-muted hover:text-ink" title={t('inventory.movementsTitle')}><History className="h-4 w-4" /></button>
      </span>
      )
    } },
  ]

  const rowActions = (onEdit, onDelete) => (
    <span className="flex items-center gap-3">
      <button onClick={onEdit} className="text-brand-600 hover:text-brand-800"><Pencil className="h-4 w-4" /></button>
      {onDelete && <button onClick={onDelete} className="text-danger hover:text-danger-strong"><Trash2 className="h-4 w-4" /></button>}
    </span>
  )
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
      await adjustStock({ variantId: adjust.variantId, onHand: Number(adjust.newOnHand), reason: adjust.reason || undefined }).unwrap()
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
          tabs={[
            { value: 'products', label: t('inventory.tabs.products') },
            ...(has('inventory.view') ? [{ value: 'inventory', label: t('inventory.tabs.inventory') }] : []),
            ...(has('category.view') ? [{ value: 'categories', label: t('inventory.tabs.categories') }] : []),
          ]}
          value={tab} onChange={changeTab}
        />
      </PageHeader>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={query} onChange={onSearch} placeholder={t('common.search')} className="w-full sm:w-72" virtualKeyboard />
          <div className="flex flex-wrap items-center gap-3">
            {tab === 'inventory' && (
              <label className="flex items-center gap-2 text-sm text-muted">
                <Toggle checked={lowStockOnly} onChange={toggleLowStock} /> {t('inventory.lowStockOnly')}
              </label>
            )}
            {tab === 'products' && has('product.create') && <Button variant="secondary" onClick={() => setCsvOpen(true)}><Upload className="h-4 w-4" /> {t('inventory.uploadCsv')}</Button>}
            {tab === 'products' && has('product.create') && <Button onClick={() => setProductDrawer({ open: true, product: null })}><Plus className="h-4 w-4" /> {t('inventory.addProduct')}</Button>}
            {tab === 'categories' && has('category.create') && <Button onClick={() => setCategoryModal({ open: true, category: null })}><Plus className="h-4 w-4" /> {t('inventory.createCategory')}</Button>}
          </div>
        </div>

        {active.isLoading ? <Loading /> : active.isError ? <ErrorState error={active.error} /> : (
          <>
            {tab === 'products' && <DataTable columns={productColumns} rows={productsQ.data?.content ?? []} rowKey={(r) => r.id} empty={t('inventory.emptyProducts')} />}
            {tab === 'inventory' && <DataTable columns={inventoryColumns} rows={inventoryQ.data?.content ?? []} rowKey={(r) => r.variantId} empty={t('inventory.emptyInventory')} />}
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
      <ProductViewModal
        open={!!viewProduct} product={viewProduct}
        onClose={() => setViewProduct(null)}
        onEdit={(p) => { setViewProduct(null); setProductDrawer({ open: true, product: p }) }}
      />
      <CategoryModal
        open={categoryModal.open} category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, category: null })} onSave={saveCategory}
      />
      <CsvUploadModal open={csvOpen} onClose={() => setCsvOpen(false)} onDone={doImport} />

      {/* Receive stock */}
      <ReceiveModal receive={receive} onClose={() => setReceive(null)} onToast={setToast} />

      {/* Adjust stock */}
      <Modal
        open={!!adjust} onClose={() => setAdjust(null)} title={`${t('inventory.adjustTitle')} — ${adjust?.name ?? ''}`}
        footer={<><Button variant="secondary" onClick={() => setAdjust(null)}>{t('common.cancel')}</Button><Button onClick={saveAdjust} disabled={adjS.isLoading}>{t('common.save')}</Button></>}
      >
        {adjust && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{t('inventory.adjustHint', { qty: adjust.onHand })}</p>
            <Field label={t('inventory.newOnHand')}>
              <Input type="number" min="0" autoFocus value={adjust.newOnHand} onChange={(e) => setAdjust((a) => ({ ...a, newOnHand: e.target.value }))} />
            </Field>
            <Field label={t('inventory.reason')}>
              <Input placeholder={t('inventory.reasonPlaceholder')} value={adjust.reason} onChange={(e) => setAdjust((a) => ({ ...a, reason: e.target.value }))} />
            </Field>
          </div>
        )}
      </Modal>

      <MovementsModal movementsOf={movementsOf} onClose={() => setMovementsOf(null)} />
      <UnitsModal unitsOf={unitsOf} onClose={() => setUnitsOf(null)} onToast={setToast} />

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title={confirm?.type === 'product' ? t('inventory.deleteProductTitle') : t('inventory.deleteCategoryTitle')}
        message={t('inventory.deleteItemMsg')}
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

// Receive stock. Quantity-tracked variants just take a quantity; unit-tracked
// variants (product has capture-at-stock-in labels like IMEI) take a quantity and
// then a per-unit grid: one row per unit, one field per capture label.
function ReceiveModal({ receive, onClose, onToast }) {
  const { t } = useTranslation()
  const [receiveStock, { isLoading }] = useReceiveStockMutation()
  const unitTracked = !!receive?.unitTracked
  const { data: captureLabels = [] } = useGetVariantCaptureLabelsQuery(receive?.variantId, { skip: !receive || !unitTracked })
  const [qty, setQty] = useState('')
  const [units, setUnits] = useState([])
  const [reason, setReason] = useState('')

  useEffect(() => { if (receive) { setQty(''); setUnits([]); setReason('') } }, [receive])

  const n = Math.max(0, Math.min(500, parseInt(qty, 10) || 0))

  // Keep the per-unit rows in sync with the quantity and the label set (seeding
  // each field with the label's default; preserving anything already typed).
  useEffect(() => {
    if (!unitTracked) return
    setUnits((prev) => Array.from({ length: n }, (_, i) => {
      const base = prev[i] || {}
      const row = {}
      captureLabels.forEach((l) => { row[l.name] = base[l.name] ?? (l.defaultValue ?? '') })
      return row
    }))
  }, [n, captureLabels, unitTracked])

  const setUnitVal = (i, name, v) => setUnits((u) => u.map((row, idx) => (idx === i ? { ...row, [name]: v } : row)))

  const unitsComplete = n > 0 && units.length === n
    && units.every((row) => captureLabels.every((l) => !l.required || String(row[l.name] || '').trim()))
  const canReceive = unitTracked ? unitsComplete : n > 0

  const submit = async () => {
    try {
      const body = unitTracked
        ? { variantId: receive.variantId, units, reason: reason || undefined }
        : { variantId: receive.variantId, quantity: n, reason: reason || undefined }
      await receiveStock(body).unwrap()
      onToast({ type: 'success', message: t('toasts.stockReceived') })
      onClose()
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }

  return (
    <Modal
      open={!!receive} onClose={onClose} title={t('inventory.receiveTitle')} size={unitTracked ? 'lg' : 'md'}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={submit} disabled={isLoading || !canReceive}>{t('inventory.receive')}</Button></>}
    >
      {receive && (
        <div className="space-y-4">
          <p className="text-sm text-ink">{receive.name}{!receive.isDefault && receive.variant ? ` — ${receive.variant}` : ''}</p>
          <p className="text-sm text-muted">{t('inventory.restockHint', { qty: receive.onHand })}</p>

          <Field label={unitTracked ? t('inventory.receiveUnitsQty') : t('inventory.receiveQty')}>
            <Input type="number" min="1" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>

          {unitTracked && n > 0 && (
            captureLabels.length === 0 ? (
              <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning">{t('inventory.noCaptureLabels')}</p>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {units.map((row, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('inventory.unitN', { n: i + 1 })}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {captureLabels.map((l) => (
                        <Field key={l.name} label={l.name + (l.required ? ' *' : '')}>
                          {(l.type === 'SINGLE_SELECT' || l.type === 'MULTI_SELECT') && (l.options ?? []).length > 0 ? (
                            <Select value={row[l.name] ?? ''} onChange={(e) => setUnitVal(i, l.name, e.target.value)}>
                              <option value="">—</option>
                              {l.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </Select>
                          ) : (
                            <Input value={row[l.name] ?? ''} onChange={(e) => setUnitVal(i, l.name, e.target.value)} />
                          )}
                        </Field>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {!unitTracked && n > 0 && <p className="text-sm text-ink">{t('inventory.restockResult', { total: receive.onHand + n })}</p>}

          <Field label={t('inventory.reason')}>
            <Input placeholder={t('inventory.reasonPlaceholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      )}
    </Modal>
  )
}

const MOVEMENT_TONE = { OPENING: 'neutral', RECEIVE: 'success', SALE: 'info', RETURN: 'warning', ADJUST: 'neutral', SERVICE_OUT: 'info', SERVICE_RETURN: 'warning' }

function MovementsModal({ movementsOf, onClose }) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error } = useGetStockMovementsQuery(
    { variantId: movementsOf?.variantId, page: 0, size: 50 },
    { skip: !movementsOf },
  )
  const rows = data?.content ?? []
  return (
    <Modal open={!!movementsOf} onClose={onClose} title={`${t('inventory.movementsTitle')} — ${movementsOf?.name ?? ''}`} size="lg">
      {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{t('inventory.noMovements')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <Badge tone={MOVEMENT_TONE[m.movementType] ?? 'neutral'}>{t(`inventory.movement.${m.movementType}`)}</Badge>
                <div>
                  <p className="text-sm font-medium text-ink">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</p>
                  {m.reason && <p className="text-xs text-muted">{m.reason}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink">{t('inventory.balanceAfter', { n: m.balanceAfter })}</p>
                <p className="text-xs text-muted">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

const UNIT_TONE = { IN_STOCK: 'success', SOLD: 'info', RETURNED: 'warning', DEFECTIVE: 'danger' }

// A unit's identity line: its captured label values (IMEI1: … · Battery: 100%), else its serial.
const unitLabel = (u) => {
  const entries = Object.entries(u.attributes ?? {}).filter(([, v]) => String(v).trim())
  return entries.length ? entries.map(([k, v]) => `${k}: ${v}`).join(' · ') : (u.serial || '—')
}

function UnitsModal({ unitsOf, onClose, onToast }) {
  const { t } = useTranslation()
  const { data: units = [], isLoading, isError, error } = useGetVariantUnitsQuery(unitsOf?.variantId, { skip: !unitsOf })
  const [retireUnit, { isLoading: retiring }] = useRetireUnitMutation()

  const retire = async (u) => {
    try {
      await retireUnit({ variantId: unitsOf.variantId, unitId: u.id }).unwrap()
      onToast({ type: 'success', message: t('toasts.unitRetired') })
    } catch (e) { onToast({ type: 'error', message: apiErrorMessage(e) }) }
  }

  return (
    <Modal open={!!unitsOf} onClose={onClose} title={`${t('inventory.unitsTitle')} — ${unitsOf?.name ?? ''}`} size="lg">
      {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : units.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{t('inventory.noUnits')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {units.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-ink">{unitLabel(u)}</p>
                {u.soldAt && <p className="text-xs text-muted">{new Date(u.soldAt).toLocaleString()}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={UNIT_TONE[u.status] ?? 'neutral'}>{t(`inventory.unit.${u.status}`)}</Badge>
                {u.status === 'IN_STOCK' && (
                  <button onClick={() => retire(u)} disabled={retiring} className="text-xs font-medium text-danger hover:underline disabled:opacity-50">{t('inventory.retire')}</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
