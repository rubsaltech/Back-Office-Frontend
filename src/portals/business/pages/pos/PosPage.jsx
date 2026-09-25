import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, X, ArrowLeft, Plus, ListOrdered } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../shared/ui'
import { RubsalLogo } from '../../../../shared/Brand'
import { ChooseTypeModal } from './ChooseTypeModal'
import { CustomerModal } from './CustomerModal'
import { FloorSelect } from './FloorSelect'
import { OrderBuilder } from './OrderBuilder'
import { OrdersList } from './OrdersList'
import { InvoiceModal } from './InvoiceModal'
import { PosToast } from './PosOverlay'

// The POS opens inline in the dashboard shell and can enter true browser full
// screen (see fullscreen handlers). It also drives the whole cashier flow:
// choose type → (floor/table | customer) → order builder → confirm → invoice,
// plus an orders listing. This same screen is intended for the Cashier portal.
export default function PosPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [stage, setStage] = useState('home') // home | chooseType | floor | customer | builder | orders
  const [order, setOrder] = useState({ type: null, table: null, customer: null })
  const [invoiceId, setInvoiceId] = useState(null)
  const [toast, setToast] = useState(null)

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
  const reset = () => { setOrder({ type: null, table: null, customer: null }); setStage('home') }
  const startNew = () => { setOrder({ type: null, table: null, customer: null }); setStage('chooseType') }

  const pickType = (type) => {
    setOrder((o) => ({ ...o, type }))
    if (type === 'DINE_IN') setStage('floor')
    else if (type === 'DELIVERY') setStage('customer')
    else setStage('builder') // TAKEAWAY
  }

  const back = () => {
    if (stage === 'floor' || stage === 'customer' || stage === 'chooseType') reset()
    else if (stage === 'builder') reset()
    else if (stage === 'orders') setStage('home')
  }

  const onPlaced = (placed) => { setInvoiceId(placed.id); reset() }

  const stageTitle = {
    home: t('pos.title'),
    chooseType: t('pos.chooseType.title'),
    floor: t('pos.floor.title'),
    customer: t('pos.title'),
    builder: order.type ? t(`pos.chooseType.${order.type === 'DINE_IN' ? 'dineIn' : order.type === 'TAKEAWAY' ? 'takeAway' : 'delivery'}`) : t('pos.title'),
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
            <RubsalLogo height={32} />
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
        {(stage === 'home' || stage === 'chooseType') && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <RubsalLogo height={48} />
            <p className="max-w-sm text-sm text-muted">{t('pos.floor.selectHint')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={startNew}><Plus className="h-5 w-5" /> {t('pos.newOrder')}</Button>
              <Button size="lg" variant="secondary" onClick={() => setStage('orders')}><ListOrdered className="h-5 w-5" /> {t('pos.viewOrders')}</Button>
            </div>
          </div>
        )}

        {stage === 'floor' && (
          <FloorSelect onSelectTable={(table) => { setOrder((o) => ({ ...o, table })); setStage('builder') }} />
        )}

        {stage === 'customer' && (
          <div className="flex h-full items-center justify-center p-8 text-muted">{t('pos.customer.title')}…</div>
        )}

        {stage === 'builder' && (
          <OrderBuilder
            type={order.type}
            table={order.table}
            customer={order.customer}
            onCancel={reset}
            onPlaced={onPlaced}
            onToast={setToast}
          />
        )}

        {stage === 'orders' && (
          <OrdersList onView={(id) => setInvoiceId(id)} onToast={setToast} />
        )}
      </div>

      {/* Flow modals (rendered inside the container so they show in full screen too) */}
      <ChooseTypeModal open={stage === 'chooseType'} onClose={reset} onPick={pickType} />
      <CustomerModal
        open={stage === 'customer'}
        onClose={reset}
        onContinue={(customer) => { setOrder((o) => ({ ...o, customer })); setStage('builder') }}
      />
      <InvoiceModal orderId={invoiceId} open={!!invoiceId} onClose={() => setInvoiceId(null)} />
      <PosToast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}
