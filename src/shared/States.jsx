import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, AlertTriangle, Inbox, CheckCircle2, XCircle } from 'lucide-react'
import { apiErrorMessage } from '../lib/apiError'

/** Transient toast. Pass { type: 'success'|'error', message } or null. */
export function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => onDone?.(), 2600)
    return () => clearTimeout(t)
  }, [toast, onDone])
  if (!toast) return null
  const isError = toast.type === 'error'
  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${isError ? 'bg-danger' : 'bg-success'}`}>
        {isError ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        {toast.message}
      </div>
    </div>,
    document.body,
  )
}

export function Loading({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-16 text-muted ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ error, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-16 text-center ${className}`}>
      <AlertTriangle className="h-8 w-8 text-danger" />
      <p className="text-sm font-medium text-ink">Couldn't load this data</p>
      <p className="text-xs text-muted">{apiErrorMessage(error)}</p>
    </div>
  )
}

export function EmptyState({ message = 'Nothing here yet.', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-16 text-center text-muted ${className}`}>
      <Inbox className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
