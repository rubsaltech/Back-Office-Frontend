import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Delete, ArrowBigUp, X, Space } from 'lucide-react'
import { cn } from '../lib/cn'

const ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']

/**
 * Touch on-screen keyboard docked to the bottom of the screen. Reports key
 * presses through callbacks; the host owns the text value.
 */
export function OnScreenKeyboard({ onKey, onBackspace, onSpace, onClear, onClose }) {
  const [shift, setShift] = useState(false)

  const keyCls = 'flex h-11 min-w-[32px] flex-1 items-center justify-center rounded-lg border border-line bg-white text-sm font-medium text-ink shadow-sm active:scale-95 active:bg-brand-50 sm:min-w-[40px]'
  const wideCls = 'flex h-11 items-center justify-center rounded-lg border border-line bg-canvas px-3 text-sm font-medium text-ink shadow-sm active:scale-95'

  // Use onMouseDown + preventDefault so pressing a key doesn't blur the field.
  const tap = (fn) => (e) => { e.preventDefault(); fn() }

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[70] px-2 pb-2">
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-canvas p-2 shadow-2xl">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted">Keyboard</span>
          <button onMouseDown={tap(onClose)} className="flex h-8 items-center gap-1 rounded-lg bg-brand-700 px-3 text-xs font-medium text-white">
            <X className="h-3.5 w-3.5" /> Done
          </button>
        </div>
        {ROWS.map((row, i) => (
          <div key={i} className="mb-1.5 flex gap-1.5">
            {i === 3 && (
              <button onMouseDown={tap(() => setShift((s) => !s))} className={cn(wideCls, shift && 'bg-brand-100 text-brand-700')}>
                <ArrowBigUp className="h-4 w-4" />
              </button>
            )}
            {row.split('').map((ch) => {
              const out = shift && /[a-z]/.test(ch) ? ch.toUpperCase() : ch
              return <button key={ch} onMouseDown={tap(() => onKey(out))} className={keyCls}>{out}</button>
            })}
            {i === 3 && (
              <button onMouseDown={tap(onBackspace)} className={wideCls}><Delete className="h-4 w-4" /></button>
            )}
          </div>
        ))}
        <div className="flex gap-1.5">
          <button onMouseDown={tap(onClear)} className={wideCls}>Clear</button>
          <button onMouseDown={tap(onSpace)} className={cn(keyCls, 'flex-[6] gap-2')}><Space className="h-4 w-4" /> Space</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
