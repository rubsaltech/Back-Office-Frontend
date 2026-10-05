import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { selectCurrentUser } from '../../../store/authSlice'

// Routes → the permission needed to access them, in landing priority order.
// Owners hold every permission, so this only constrains employees.
export const ROUTE_PERMS = [
  { to: '/business', perm: 'dashboard.view' },
  { to: '/business/pos', perm: 'order.view' },
  { to: '/business/inventory', perm: 'product.view' },
  { to: '/business/services', perm: 'service.view' },
  { to: '/business/floor-plan', perm: 'floor.view' },
  { to: '/business/employees', perm: 'employee.view' },
  { to: '/business/roles', perm: 'role.view' },
  { to: '/business/labels', perm: 'label.view' },
  { to: '/business/stores', perm: 'store.view' },
]

export function usePermissions() {
  const user = useSelector(selectCurrentUser)
  const isOwner = user?.type === 'BUSINESS_OWNER'
  const permissions = user?.permissions ?? []
  const has = (perm) => isOwner || !perm || permissions.includes(perm)
  // The first page this user can open (used for landing + redirect-on-deny).
  const firstAllowedRoute = () => {
    if (isOwner) return '/business'
    const r = ROUTE_PERMS.find((x) => permissions.includes(x.perm))
    return r ? r.to : null
  }
  return { isOwner, has, permissions, firstAllowedRoute }
}

/** Shown when an employee has no accessible area at all. */
export function NoAccess() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <p className="text-lg font-semibold text-ink">{t('access.noneTitle')}</p>
      <p className="mt-1 text-sm text-muted">{t('access.noneHint')}</p>
    </div>
  )
}

/** Route wrapper: renders children only if allowed, else redirects to a page the user can open. */
export function RequirePerm({ perm, ownerOnly, children }) {
  const { isOwner, has, firstAllowedRoute } = usePermissions()
  const allowed = ownerOnly ? isOwner : has(perm)
  if (allowed) return children
  const dest = firstAllowedRoute()
  return dest ? <Navigate to={dest} replace /> : <NoAccess />
}
