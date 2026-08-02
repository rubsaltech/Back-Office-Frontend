import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Boxes,
  Users,
  ShieldCheck,
  Layers,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Avatar } from '../../../shared/ui'
import { currentUser } from '../data/mock'
import { RubsalLogo } from '../../../shared/Brand'

const nav = [
  { to: '/business', end: true, label: 'Dashboard Overview', icon: LayoutGrid },
  { to: '/business/inventory', label: 'Inventory Management', icon: Boxes },
  { to: '/business/employees', label: 'Employee Management', icon: Users },
  { to: '/business/roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { to: '/business/floor-plan', label: 'Floor Plan', icon: Layers },
  { to: '/business/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-gradient-to-b from-brand-50/60 to-white">
      <div className="px-6 py-6">
        <RubsalLogo />
      </div>

      <nav className="flex-1 space-y-1.5 px-4">
        {nav.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-muted hover:bg-white hover:text-ink',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
        <Avatar name={currentUser.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{currentUser.name}</p>
          <p className="truncate text-xs text-muted">{currentUser.email}</p>
        </div>
        <button className="text-accent-500 hover:text-accent-600" title="Log out">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  )
}
