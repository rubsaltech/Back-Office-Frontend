import { Routes, Route, Navigate } from 'react-router-dom'
import BusinessLayout from './portals/business/BusinessLayout'
import DashboardPage from './portals/business/pages/DashboardPage'
import InventoryPage from './portals/business/pages/inventory/InventoryPage'
import ServicesPage from './portals/business/pages/services/ServicesPage'
import EmployeesPage from './portals/business/pages/employees/EmployeesPage'
import RolesPage from './portals/business/pages/roles/RolesPage'
import FloorPlanPage from './portals/business/pages/floor/FloorPlanPage'
import SettingsPage from './portals/business/pages/settings/SettingsPage'
import LoginPage from './portals/business/auth/LoginPage'
import SignupPage from './portals/business/auth/SignupPage'
import ForgotPasswordPage from './portals/business/auth/ForgotPasswordPage'
import { ProtectedRoute } from './portals/business/auth/ProtectedRoute'
import { PortalPlaceholder } from './portals/PortalPlaceholder'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/business" replace />} />

      {/* Business auth (outside the app shell) */}
      <Route path="/business/login" element={<LoginPage />} />
      <Route path="/business/signup" element={<SignupPage />} />
      <Route path="/business/forgot-password" element={<ForgotPasswordPage />} />

      {/* Business portal (app shell) — auth-guarded */}
      <Route element={<ProtectedRoute />}>
        <Route path="/business" element={<BusinessLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="floor-plan" element={<FloorPlanPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Other portals — built later */}
      <Route path="/cashier/*" element={<PortalPlaceholder name="Cashier Portal" />} />
      <Route path="/admin/*" element={<PortalPlaceholder name="Admin Portal" />} />

      <Route path="*" element={<Navigate to="/business" replace />} />
    </Routes>
  )
}
