import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Store, ChevronDown, Bell, MapPin, Check, Menu, Plus } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { selectCurrentUser } from '../../../store/authSlice'
import { setActiveStore, selectActiveStoreId, STORE_SCOPED_TAGS } from '../../../store/storeSlice'
import { api, useGetStoresQuery } from '../../../store/api'
import { LanguageToggle } from '../../../shared/LanguageToggle'
import { CreateStoreModal } from './CreateStoreModal'

export function Topbar({ onMenu }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const user = useSelector(selectCurrentUser)
  const activeStoreId = useSelector(selectActiveStoreId)
  const { data: stores = [] } = useGetStoresQuery()

  const active = stores.find((s) => s.id === activeStoreId) || null

  // Default the active store to the main (or first) store once stores load, or
  // whenever the persisted id is no longer one of the business's stores.
  useEffect(() => {
    if (stores.length && !stores.some((s) => s.id === activeStoreId)) {
      dispatch(setActiveStore((stores.find((s) => s.main) || stores[0]).id))
    }
  }, [stores, activeStoreId, dispatch])

  const switchStore = (s) => {
    if (s.id !== activeStoreId) {
      dispatch(setActiveStore(s.id))
      dispatch(api.util.invalidateTags(STORE_SCOPED_TAGS))
    }
    setOpen(false)
  }

  const onCreated = (created) => {
    setCreateOpen(false)
    dispatch(setActiveStore(created.id))
    dispatch(api.util.invalidateTags(STORE_SCOPED_TAGS))
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink hover:bg-canvas lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-sm text-muted sm:block">{t('topbar.welcome')}</p>
          <p className="truncate text-base font-semibold text-ink sm:text-lg">{user?.name || 'User'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageToggle />
        <button
          onClick={() => navigate('/business/pos')}
          className="hidden items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas md:flex"
        >
          <MapPin className="h-4 w-4 text-muted" />
          {t('topbar.storeSettings')}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm font-semibold text-brand-800 sm:px-4 sm:py-2.5"
          >
            <Store className="h-4 w-4 shrink-0" />
            <span className="max-w-[92px] truncate sm:max-w-none">{active?.name || t('stores.pick')}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => switchStore(s)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-canvas',
                      s.id === activeStoreId ? 'text-brand-800 font-medium' : 'text-ink',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted" />
                      {s.name}
                      {s.main && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                          {t('stores.main')}
                        </span>
                      )}
                    </span>
                    {s.id === activeStoreId && <Check className="h-4 w-4 text-brand-700" />}
                  </button>
                ))}
                <div className="my-1 border-t border-line" />
                <button
                  onClick={() => { setOpen(false); setCreateOpen(true) }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <Plus className="h-4 w-4" />
                  {t('stores.addStore')}
                </button>
              </div>
            </>
          )}
        </div>

        <button className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas sm:h-11 sm:w-11">
          <Bell className="h-5 w-5" />
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-accent-500" />
        </button>
      </div>

      <CreateStoreModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreated} />
    </header>
  )
}
