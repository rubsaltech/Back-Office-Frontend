import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Minus, Plus, Trash2, Utensils } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { money } from '../../../../lib/format'
import { Button, Textarea } from '../../../../shared/ui'
import { Loading, ErrorState } from '../../../../shared/States'
import {
  useGetAllCategoriesQuery, useGetProductsQuery, useGetPaymentDevicesQuery, useCreateOrderMutation,
} from '../../../../store/api'
import { apiErrorMessage } from '../../../../lib/apiError'
import { makeLine, lineTotal, totals, toOrderPayload } from './cart'
import { DiscountModal } from './DiscountModal'
import { PaymentModal } from './PaymentModal'

export function OrderBuilder({ type, table, customer, vertical, onCancel, onPlaced, onToast }) {
  const { t } = useTranslation()
  const showSeats = Boolean(vertical?.hasSeats)
  const showTableRow = Boolean(vertical?.hasFloorTables && table)
  const CartIcon = vertical?.cartIcon || Utensils
  const noteLabel = vertical?.noteKey ? t(vertical.noteKey) : t('pos.builder.kitchenNote')

  const { data: categories = [], isLoading: catLoading } = useGetAllCategoriesQuery()
  const productsQ = useGetProductsQuery({ size: 200 })
  const { data: devices = [] } = useGetPaymentDevicesQuery()
  const [createOrder, { isLoading: placing }] = useCreateOrderMutation()

  const products = productsQ.data?.content ?? []

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [selected, setSelected] = useState(null) // product being configured
  const [lines, setLines] = useState([])
  const [seat, setSeat] = useState(1)
  const [kitchenNote, setKitchenNote] = useState('')
  const [discount, setDiscount] = useState(null)
  const [payment, setPayment] = useState(null)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) =>
      (categoryId == null || p.categoryId === categoryId) &&
      (!q || p.name.toLowerCase().includes(q)),
    )
  }, [products, categoryId, search])

  const t3 = totals(lines, discount)

  // ---- cart ops ----
  const addLine = (line) => setLines((ls) => [...ls, line])
  const changeQty = (uid, delta) =>
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l)))
  const removeLine = (uid) => setLines((ls) => ls.filter((l) => l.uid !== uid))

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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.name} <span className="text-muted">(x{l.quantity})</span></p>
                    <p className="truncate text-xs text-muted">
                      {showSeats && l.seatNumber != null && <>{t('pos.builder.seat')}: {l.seatNumber} · </>}
                      {money(lineTotal(l))}
                      {l.modifiers.length > 0 && <> · {l.modifiers.map((m) => m.name).join(', ')}</>}
                    </p>
                  </div>
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
            <CategoryButton key={c.id} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setSelected(null) }} label={c.name} />
          ))}
        </div>

        {/* ---------------- Products + modifier panel ---------------- */}
        <div className={cn('grid min-h-0', selected ? 'grid-cols-1 lg:grid-cols-[1fr_320px]' : 'grid-cols-1')}>
            <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
              {visibleProducts.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">{t('pos.builder.noProducts')}</p>
              ) : (
                <div className={cn('grid gap-3', selected ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
                  {visibleProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={cn('flex min-h-[72px] flex-col items-center justify-center rounded-2xl border p-3 text-center text-sm font-medium transition',
                        selected?.id === p.id ? 'border-brand-400 bg-white shadow-sm' : 'border-transparent bg-brand-50/60 text-ink hover:bg-brand-50')}
                    >
                      <span>{p.name}</span>
                      <span className="mt-1 text-xs text-muted">{money(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <ModifierPanel
                key={selected.id}
                product={selected}
                onCancel={() => setSelected(null)}
                onAdd={(cfg) => {
                  addLine(makeLine({ product: selected, seatNumber: showSeats ? seat : null, ...cfg }))
                  setSelected(null)
                  onToast({ type: 'success', message: t('pos.toasts.itemAdded') })
                }}
              />
            )}
          </div>
        </div>

      <DiscountModal open={showDiscount} current={discount} onClose={() => setShowDiscount(false)}
        onApply={(d) => { setDiscount(d && d.value > 0 ? d : null); setShowDiscount(false) }} />
      <PaymentModal open={showPayment} devices={devices} allowCod={type === 'DELIVERY'} onClose={() => setShowPayment(false)}
        onSelect={(p) => { setPayment(p); setShowPayment(false) }} />
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

function ModifierPanel({ product, onAdd, onCancel }) {
  const { t } = useTranslation()
  const groups = product.modifierGroups ?? []

  // selections: { [groupId]: Set(optionId) }, seeded with defaults for single-selects.
  const [sel, setSel] = useState(() => {
    const init = {}
    groups.forEach((g) => {
      const single = g.maxSelect <= 1
      const defaults = g.options.filter((o) => o.isDefault).map((o) => o.id)
      const seed = defaults.length ? defaults : (single && g.required && g.options[0] ? [g.options[0].id] : [])
      init[g.id] = new Set(seed)
    })
    return init
  })
  const [instructions, setInstructions] = useState('')

  const toggle = (g, optId) => {
    setSel((prev) => {
      const next = { ...prev }
      const set = new Set(next[g.id])
      const single = g.maxSelect <= 1
      if (single) { next[g.id] = new Set([optId]) }
      else { set.has(optId) ? set.delete(optId) : set.add(optId); next[g.id] = set }
      return next
    })
  }

  const add = () => {
    const modifiers = []
    groups.forEach((g) => {
      g.options.forEach((o) => {
        if (sel[g.id]?.has(o.id)) modifiers.push({ groupName: g.name, name: o.name, priceDelta: o.priceDelta })
      })
    })
    onAdd({ quantity: 1, specialInstructions: instructions, modifiers })
  }

  return (
    <div className="flex min-h-0 flex-col border-l border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h4 className="text-lg font-semibold text-ink">{t('pos.builder.itemModifier')}</h4>
        <button onClick={onCancel} className="text-sm text-muted hover:text-ink">✕</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {groups.length === 0 && <p className="text-sm text-muted">{t('pos.builder.noModifiers')}</p>}
        {groups.map((g) => {
          const single = g.maxSelect <= 1
          return (
            <div key={g.id} className="mb-5">
              <p className="mb-2 text-sm font-medium text-ink">{g.required && <span className="text-danger">*</span>}{g.name}</p>
              <div className="space-y-2">
                {g.options.map((o) => {
                  const on = sel[g.id]?.has(o.id)
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(g, o.id)}
                      className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm',
                        on ? 'border-brand-400 bg-brand-50' : 'border-line hover:bg-canvas')}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn('flex h-4 w-4 items-center justify-center border', single ? 'rounded-full' : 'rounded',
                          on ? 'border-brand-700 bg-brand-700' : 'border-toggle-off')}>
                          {on && <span className={cn('bg-white', single ? 'h-1.5 w-1.5 rounded-full' : 'h-2 w-2 rounded-[2px]')} />}
                        </span>
                        {o.name}
                      </span>
                      <span className="text-muted">{Number(o.priceDelta) > 0 ? `+${money(o.priceDelta)}` : ''}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="mb-2">
          <p className="mb-2 text-sm font-medium text-ink">{t('pos.builder.specialInstructions')}</p>
          <Textarea rows={3} placeholder={t('pos.builder.specialPlaceholder')} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>
      </div>
      <div className="border-t border-line p-4">
        <Button className="w-full" onClick={add}>{t('pos.builder.addItem')}</Button>
      </div>
    </div>
  )
}
