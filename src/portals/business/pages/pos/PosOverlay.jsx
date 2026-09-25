import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../shared/ui'

/*
 * POS overlays are intentionally NOT portaled to document.body. When the POS is
 * in the browser's Fullscreen top layer, a portal to <body> renders OUTSIDE the
 * fullscreen element and is therefore invisible. Rendering these as `fixed
 * inset-0` children of the POS container keeps them inside the fullscreen subtree
 * (and they still cover the viewport when the POS is inline).
 */

export function PosModal({ open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={closeOnBackdrop ? onClose : undefined} />
      <div className={cn('relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl', widths[size])}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-semibold text-ink">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  )
}

export function PosConfirm({ open, onClose, onConfirm, title, message, confirmLabel, tone = 'danger' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-full',
          tone === 'danger' ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success')}>
          <AlertCircle className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm?.(); onClose?.() }}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PosToast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => onDone?.(), 2600)
    return () => clearTimeout(t)
  }, [toast, onDone])
  if (!toast) return null
  const isError = toast.type === 'error'
  return (
    <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2">
      <div className={cn('flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
        isError ? 'bg-danger' : 'bg-success')}>
        {isError ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        {toast.message}
      </div>
    </div>
  )
}
