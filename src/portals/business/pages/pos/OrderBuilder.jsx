import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Minus, Plus, Trash2, Utensils } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { money } from '../../../../lib/format'
import { Button } from '../../../../shared/ui'
import { Loading, ErrorState } from '../../../../shared/States'
import {
  useGetAllCategoriesQuery, useGetProductsQuery, useGetPaymentDevicesQuery, useCreateOrderMutation,
} from '../../../../store/api'
import { apiErrorMessage } from '../../../../lib/apiError'
import { makeLine, lineTotal, totals, toOrderPayload, isOverridden } from './cart'
import { DiscountModal } from './DiscountModal'
import { PaymentModal } from './PaymentModal'
import { PriceModal } from './PriceModal'

// 32-bit signed max — effectively "no page limit", so the whole catalogue loads.
const ALL_PRODUCTS = 2147483647

export function OrderBuilder({ type, table, customer, vertical, onCancel, onPlaced, onToast }) {
  const { t } = useTranslation()
  const showSeats = Boolean(vertical?.hasSeats)
  const showTableRow = Boolean(vertical?.hasFloorTables && table)
  const CartIcon = vertical?.cartIcon || Utensils
  const noteLabel = vertical?.noteKey ? t(vertical.noteKey) : t('pos.builder.kitchenNote')

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [lines, setLines] = useState([])
  const [seat, setSeat] = useState(1)
  const [kitchenNote, setKitchenNote] = useState('')
  const [discount, setDiscount] = useState(null)
  const [payment, setPayment] = useState(null)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [priceEdit, setPriceEdit] = useState(null) // cart line whose price is being changed

  const { data: categories = [], isLoading: catLoading } = useGetAllCategoriesQuery()
  // Load the ENTIRE product catalogue in one request (MAX_INT page size) and
  // filter by category/search client-side — no server-side paging.
  const productsQ = useGetProductsQuery({ size: ALL_PRODUCTS })
  const { data: devices = [] } = useGetPaymentDevicesQuery()
  const [createOrder, { isLoading: placing }] = useCreateOrderMutation()

  const products = productsQ.data?.content ?? []

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matches = (p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    return products.filter((p) =>
      (categoryId == null || p.categoryId === categoryId) && (!q || matches(p)),
    )
  }, [products, categoryId, search])

  const t3 = totals(lines, discount)

  // ---- cart ops ----
  const changeQty = (uid, delta) =>
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l)))
  const removeLine = (uid) => setLines((ls) => ls.filter((l) => l.uid !== uid))
  const setLinePrice = (uid, price) =>
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, overridePrice: price } : l)))

  // Tapping a product adds it straight to the cart; tapping the same product
  // again just bumps its quantity (same seat), instead of stacking duplicate lines.
  const addProduct = (p) => {
    const seatNumber = showSeats ? seat : null
    setLines((ls) => {
      const existing = ls.find((l) => l.productId === p.id && l.seatNumber === seatNumber)
      if (existing) {
        return ls.map((l) => (l.uid === existing.uid ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [...ls, makeLine({ product: p, seatNumber, quantity: 1, specialInstructions: '' })]
    })
    onToast({ type: 'success', message: t('pos.toasts.itemAdded') })
  }

  const place = async () => {
    if (lines.length === 0) { onToast({ type: 'error', message: t('pos.toasts.emptyCart') }); return }
    try {
      const payload = toOrderPayload({
        type, table,
        customer: customer || { guests: 1 },
        kitchenNote, discount, lines, payment,
      })
      const order = await createOrder(payload).unwrap()
      onToast({ type: 'success', message: t('pos.toasts.placed', { number: order.orderNumber }) })
      onPlaced(order)
    } catch (e) {
      onToast({ type: 'error', message: apiErrorMessage(e) })
    }
  }

  if (catLoading || productsQ.isLoading) return <Loading label={t('common.loading')} />
  if (productsQ.isError) return <ErrorState error={productsQ.error} />

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="border-b border-line px-4 py-3 sm:px-6">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pos.builder.search')}
            className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm placeholder:text-muted focus:border-brand-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_180px_1fr]">
        {/* ---------------- Cart column ---------------- */}
        <div className="flex min-h-0 flex-col border-b border-line lg:border-b-0 lg:border-r">
          <div className="flex-1 overflow-y-auto">
            {lines.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted">
                <CartIcon className="h-10 w-10 text-brand-200" />
                <p className="whitespace-pre-line text-lg font-medium text-ink">{t('pos.builder.noItems')}</p>
              </div>
            ) : (
              lines.map((l) => (
                <div key={l.uid} className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
                  <button onClick={() => setPriceEdit(l)} className="min-w-0 flex-1 text-left" title={t('pos.price.title')}>
                    <p className="truncate text-sm font-medium text-ink">{l.name} <span className="text-muted">(x{l.quantity})</span></p>
                    <p className="truncate text-xs text-muted">
                      {showSeats && l.seatNumber != null && <>{t('pos.builder.seat')}: {l.seatNumber} · </>}
                      {isOverridden(l) && <><span className="text-muted line-through">{money(l.basePrice)}</span> <span className="font-semibold text-brand-700">{money(l.overridePrice)}</span> · </>}
                      {money(lineTotal(l))}
                    </p>
                  </button>
                  <button onClick={() => changeQty(l.uid, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-bg text-warning"><Minus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => changeQty(l.uid, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-bg text-success"><Plus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeLine(l.uid)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-bg text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))
            )}
          </div>

          {/* Totals + footer */}
          <div className="border-t border-line">
            <div className="bg-brand-50/70 px-4 py-3 text-sm">
              <div className="flex justify-between text-muted"><span>{t('pos.builder.includingTax')}</span><span>{money(t3.taxTotal)}</span></div>
              {t3.discountTotal > 0 && (
                <div className="flex justify-between text-success"><span>{t('pos.builder.discount')}</span><span>−{money(t3.discountTotal)}</span></div>
              )}
              <div className="mt-1 flex justify-between text-base font-bold text-ink"><span>{t('pos.builder.total')}</span><span>{money(t3.total)}</span></div>
            </div>

            {showSeats && (
              <div className="flex items-center justify-between border-t border-line px-4 py-2 text-sm">
                <span className="font-medium text-ink">{showTableRow ? `${t('pos.builder.table')}: ${table?.name ?? '—'}` : ''}</span>
                <span className="flex items-center gap-2 text-muted">
                  {t('pos.builder.seat')}:
                  <button onClick={() => setSeat((s) => Math.max(1, s - 1))} className="flex h-6 w-6 items-center justify-center rounded border border-line">−</button>
                  <span className="w-4 text-center font-semibold text-ink">{seat}</span>
                  <button onClick={() => setSeat((s) => s + 1)} className="flex h-6 w-6 items-center justify-center rounded border border-line">+</button>
                </span>
              </div>
            )}

            <div className="border-t border-line px-4 py-2">
              <input
                value={kitchenNote} onChange={(e) => setKitchenNote(e.target.value)}
                placeholder={noteLabel}
                className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm placeholder:text-muted focus:border-brand-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              <Button variant="danger" size="sm" onClick={onCancel}>{t('pos.builder.cancel')}</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDiscount(true)} className={cn(discount && 'border-brand-400 text-brand-700')}>{t('pos.builder.discount')}</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowPayment(true)} className={cn(payment && 'border-brand-400 text-brand-700')}>{t('pos.builder.payment')}</Button>
            </div>
            <div className="px-4 pb-4">
              <Button className="w-full" onClick={place} disabled={placing || lines.length === 0}>
                {placing ? t('common.saving') : t('pos.builder.confirmOrder')}
              </Button>
            </div>
          </div>
        </div>

        {/* ---------------- Category column ---------------- */}
        <div className="flex min-h-0 flex-col overflow-y-auto border-b border-line p-2 lg:border-b-0 lg:border-r">
          <CategoryButton active={categoryId == null} onClick={() => setCategoryId(null)} label={t('inventory.tabs.products') /* All */} allLabel />
          {categories.map((c) => (
            <CategoryButton key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)} label={c.name} />
          ))}
        </div>

        {/* ---------------- Products ---------------- */}
        <div className="grid min-h-0 grid-cols-1">
            <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
              {visibleProducts.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">{t('pos.builder.noProducts')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex min-h-[72px] flex-col items-center justify-center rounded-2xl border border-transparent bg-brand-50/60 p-3 text-center text-sm font-medium text-ink transition hover:bg-brand-50 active:scale-[0.98]"
                    >
                      <span>{p.name}</span>
                      <span className="mt-1 text-xs text-muted">{money(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      <DiscountModal open={showDiscount} current={discount} onClose={() => setShowDiscount(false)}
        onApply={(d) => { setDiscount(d && d.value > 0 ? d : null); setShowDiscount(false) }} />
      <PaymentModal open={showPayment} devices={devices} allowCod={type === 'DELIVERY'} onClose={() => setShowPayment(false)}
        onSelect={(p) => { setPayment(p); setShowPayment(false) }} />
      <PriceModal
        open={!!priceEdit} line={priceEdit} onClose={() => setPriceEdit(null)}
        onApply={(price) => { setLinePrice(priceEdit.uid, price); setPriceEdit(null) }}
      />
    </div>
  )
}

function CategoryButton({ active, onClick, label, allLabel }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className={cn('mb-1.5 w-full rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors',
        active ? 'bg-brand-700 text-white shadow-sm' : 'text-muted hover:bg-canvas hover:text-ink')}
    >
      {allLabel ? t('common.all', 'All') : label}
    </button>
  )
}

