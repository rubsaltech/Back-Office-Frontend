import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Boxes,
  Users,
  ShieldCheck,
  Layers,
  Settings,
  LogOut,
  X,
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

export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-scrim lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] shrink-0 flex-col border-r border-line bg-white lg:static lg:z-auto lg:max-w-none lg:flex',
          open ? 'flex' : 'hidden',
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <RubsalLogo />
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-muted hover:bg-white hover:text-ink',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
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
    </>
  )
}
