import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import StoreOnboarding from './StoreOnboarding'
import { Loading } from '../../shared/States'
import { useMeQuery, useGetStoresQuery } from '../../store/api'
import { setUser } from '../../store/authSlice'

export default function BusinessLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const dispatch = useDispatch()
  // Validate the session and keep the current user fresh.
  const { data: me } = useMeQuery()
  // A business must have at least one store before it can use the app; the first
  // store's TYPE drives the POS. Until one exists, force the onboarding form.
  const { data: stores, isLoading: storesLoading } = useGetStoresQuery()

  useEffect(() => {
    if (me) dispatch(setUser(me))
  }, [me, dispatch])

  if (storesLoading) {
    return <div className="flex h-screen items-center justify-center bg-canvas"><Loading /></div>
  }
  if (stores && stores.length === 0) {
    return <StoreOnboarding />
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
