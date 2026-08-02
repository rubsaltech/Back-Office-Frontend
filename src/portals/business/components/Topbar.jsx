import { useState } from 'react'
import { Store, ChevronDown, Bell, MapPin, Check } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { currentUser, stores } from '../data/mock'

export function Topbar() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(stores[0])

  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-8 py-4">
      <div>
        <p className="text-sm text-muted">Welcome,</p>
        <p className="text-lg font-semibold text-ink">{currentUser.name}</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas">
          <MapPin className="h-4 w-4 text-muted" />
          Store Settings
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-sm font-semibold text-brand-800"
          >
            <Store className="h-4 w-4" />
            {active.name}
            <ChevronDown className="h-4 w-4" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActive(s)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-canvas',
                      s.id === active.id ? 'text-brand-800 font-medium' : 'text-ink',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted" />
                      {s.name}
                      {s.isMain && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                          Main
                        </span>
                      )}
                    </span>
                    {s.id === active.id && <Check className="h-4 w-4 text-brand-700" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas">
          <Bell className="h-5 w-5" />
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-accent-500" />
        </button>
      </div>
    </header>
  )
}
