import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated } from '../../../store/authSlice'

export function ProtectedRoute() {
  const authenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()
  if (!authenticated) {
    return <Navigate to="/business/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
