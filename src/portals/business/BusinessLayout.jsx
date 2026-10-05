import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { StorePicker } from './components/StorePicker'
import StoreOnboarding from './StoreOnboarding'
import { Loading } from '../../shared/States'
import { useMeQuery, useGetStoresQuery } from '../../store/api'
import { setUser } from '../../store/authSlice'
import { setActiveStore, selectActiveStoreId, STORE_SCOPED_TAGS } from '../../store/storeSlice'
import { api } from '../../store/api'
import { usePermissions, NoAccess } from './auth/permissions'

export default function BusinessLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const dispatch = useDispatch()
  // Validate the session and keep the current user fresh.
  const { data: me } = useMeQuery()
  const { data: stores, isLoading: storesLoading } = useGetStoresQuery()
  const activeStoreId = useSelector(selectActiveStoreId)
  const { isOwner } = usePermissions()

  useEffect(() => {
    if (me) dispatch(setUser(me))
  }, [me, dispatch])

  // With exactly one store, select it automatically (no picker needed).
  useEffect(() => {
    if (stores && stores.length === 1 && stores[0].id !== activeStoreId) {
      dispatch(setActiveStore(stores[0].id))
    }
  }, [stores, activeStoreId, dispatch])

  if (storesLoading || !me) {
    return <div className="flex h-screen items-center justify-center bg-canvas"><Loading /></div>
  }

  // No store: owners onboard their first store; employees can't, so show access note.
  if (stores && stores.length === 0) {
    return isOwner ? <StoreOnboarding /> : (
      <div className="flex h-screen items-center justify-center bg-canvas"><NoAccess /></div>
    )
  }

  // Multiple stores and none chosen yet → let the user pick which to manage.
  const validActive = stores?.some((s) => s.id === activeStoreId)
  if (stores && stores.length > 1 && !validActive) {
    return (
      <StorePicker
        stores={stores}
        onPick={(id) => { dispatch(setActiveStore(id)); dispatch(api.util.invalidateTags(STORE_SCOPED_TAGS)) }}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
