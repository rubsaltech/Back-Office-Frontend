import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../lib/cn'
import { Button } from './ui'

function useLockScroll(open) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
}

/* Centered modal dialog */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useLockScroll(open)
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl bg-white p-6 shadow-xl', widths[size])}>
        <div className="mb-5 flex items-start justify-between">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* Right-side slide-over drawer (used for Add/Edit forms) */
export function Drawer({ open, onClose, title, children, footer, width = 'max-w-lg' }) {
  useLockScroll(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* Confirm dialog (delete / void / deactivate) */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Yes, Delete',
  tone = 'danger',
}) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <span
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full',
              tone === 'danger' ? 'bg-danger-bg text-danger' : 'bg-success-bg text-success',
            )}
          >
            <AlertCircle className="h-5 w-5" />
          </span>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
        <div className="mt-6">
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* Success toast/dialog shown after create/update actions */
export function SuccessDialog({ open, onClose, title = 'Success', message }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onClose?.(), 2200)
    return () => clearTimeout(t)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      </div>
    </div>,
    document.body,
  )
}
