import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, X, ArrowLeft, Plus, ListOrdered } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../shared/ui'
import { BrandLogo } from '../../../../shared/Brand'
import { OrderBuilder } from './OrderBuilder'
import { OrdersList } from './OrdersList'
import { InvoiceModal } from './InvoiceModal'
import { ServiceBillModal } from './ServiceBillModal'
import { PosToast } from './PosOverlay'
import { useSelector } from 'react-redux'
import { verticalFor } from './verticals'
import { useGetStoresQuery } from '../../../../store/api'
import { selectActiveStoreId } from '../../../../store/storeSlice'
import { usePermissions } from '../../auth/permissions'

// The POS opens inline in the dashboard shell and can enter true browser full
// screen (see fullscreen handlers). It also drives the whole cashier flow:
// choose type → (floor/table | customer) → order builder → confirm → invoice,
// plus an orders listing. This same screen is intended for the Cashier portal.
export default function PosPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [stage, setStage] = useState('home') // home | builder | orders
  const [order, setOrder] = useState({ type: null, table: null, customer: null })
  const [invoiceId, setInvoiceId] = useState(null)
  const [showService, setShowService] = useState(false)
  const [toast, setToast] = useState(null)
  const { has } = usePermissions()
  const canBillService = has('order.create') && has('service.view')

  // The active store's vertical drives the whole POS (order modes, floor/tables,
  // seats, cart visuals) — it follows the store selected in the navbar.
  const { data: stores = [] } = useGetStoresQuery()
  const activeStoreId = useSelector(selectActiveStoreId)
  const activeStore = stores.find((s) => s.id === activeStoreId) || stores.find((s) => s.main) || stores[0] || null
  const vertical = verticalFor(activeStore?.type)

  // ---------- Fullscreen (YouTube-style) ----------
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(fsEl()))
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current
    const req = el?.requestFullscreen || el?.webkitRequestFullscreen
    if (req) Promise.resolve(req.call(el)).catch(() => {})
  }, [])
  const exitFullscreen = useCallback(() => {
    if (!fsEl()) return
    const exit = document.exitFullscreen || document.webkitExitFullscreen
    if (exit) Promise.resolve(exit.call(document)).catch(() => {})
  }, [])
  const toggleFullscreen = () => (isFullscreen ? exitFullscreen() : enterFullscreen())
  const handleClose = () => (isFullscreen ? exitFullscreen() : navigate('/business'))

  // ---------- Flow ----------
  // The order-type menu was removed: a new order goes straight to the builder
  // with the vertical's primary mode as the default type.
  const defaultType = vertical.modes?.[0] || 'COUNTER'
  const reset = () => { setOrder({ type: null, table: null, customer: null }); setStage('home') }
  const startNew = () => { setOrder({ type: defaultType, table: null, customer: null }); setStage('builder') }

  const back = () => {
    if (stage === 'orders') setStage('home')
    else reset()
  }

  const onPlaced = (placed) => { setInvoiceId(placed.id); reset() }

  const stageTitle = {
    home: t('pos.title'),
    builder: t('pos.title'),
    orders: t('pos.orders.title'),
  }[stage]

  const canBack = stage !== 'home'

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col rounded-2xl border border-line bg-white',
        isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[calc(100vh-9rem)]')}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {canBack ? (
            <button onClick={back} className="flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink hover:bg-canvas">
              <ArrowLeft className="h-4 w-4" /> {stage === 'orders' ? t('pos.orders.backToFloor') : t('common.cancel', 'Back')}
            </button>
          ) : (
            <BrandLogo height={32} />
          )}
          <h1 className="truncate text-lg font-bold text-ink">{stageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          {stage === 'home' && (
            <button onClick={() => setStage('orders')} className="hidden items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas sm:flex">
              <ListOrdered className="h-4 w-4 text-muted" /> {t('pos.viewOrders')}
            </button>
          )}
          <button onClick={toggleFullscreen} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas">
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-muted" /> : <Maximize2 className="h-4 w-4 text-muted" />}
            <span className="hidden sm:inline">{isFullscreen ? t('pos.minimize') : t('pos.maximize')}</span>
          </button>
          <button onClick={handleClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:bg-canvas" aria-label={t('pos.close')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1">
        {stage === 'home' && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <BrandLogo height={48} />
            <p className="max-w-sm text-sm text-muted">{t('pos.floor.selectHint')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={startNew}><Plus className="h-5 w-5" /> {t('pos.newOrder')}</Button>
              <Button size="lg" variant="secondary" onClick={() => setStage('orders')}><ListOrdered className="h-5 w-5" /> {t('pos.viewOrders')}</Button>
            </div>
          </div>
        )}

        {stage === 'builder' && (
          <OrderBuilder
            type={order.type}
            table={order.table}
            customer={order.customer}
            vertical={vertical}
            onCancel={reset}
            onPlaced={onPlaced}
            onToast={setToast}
            onService={canBillService ? () => setShowService(true) : null}
          />
        )}

        {stage === 'orders' && (
          <OrdersList onView={(id) => setInvoiceId(id)} onToast={setToast} />
        )}
      </div>

      {/* Flow modals (rendered inside the container so they show in full screen too) */}
      <InvoiceModal orderId={invoiceId} open={!!invoiceId} onClose={() => setInvoiceId(null)} />
      <ServiceBillModal
        open={showService}
        onClose={() => setShowService(false)}
        onBilled={(placed) => { setShowService(false); setInvoiceId(placed.id); setToast({ type: 'success', message: t('pos.toasts.placed', { number: placed.orderNumber }) }) }}
        onToast={setToast}
      />
      <PosToast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
