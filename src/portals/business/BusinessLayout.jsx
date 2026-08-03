import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useMeQuery } from '../../store/api'
import { setUser } from '../../store/authSlice'

export default function BusinessLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const dispatch = useDispatch()
  // Validate the session and keep the current user fresh.
  const { data: me } = useMeQuery()

  useEffect(() => {
    if (me) dispatch(setUser(me))
  }, [me, dispatch])

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
