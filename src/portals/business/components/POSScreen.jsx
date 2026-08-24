import { useEffect } from 'react'
import { Minimize2 } from 'lucide-react'

// Full-size POS screen rendered as an overlay. Press Escape to minimize (close).
export function POSScreen({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-ink">POS</h1>
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          <Minimize2 className="h-4 w-4 text-muted" />
          Minimize
          <span className="ml-1 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">Esc</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
        <p className="text-muted">POS screen</p>
      </div>
    </div>
  )
}
