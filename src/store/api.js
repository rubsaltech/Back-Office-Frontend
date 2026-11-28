import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setCredentials, logout } from './authSlice'

// Dev: '/api/v1' goes through the Vite proxy → localhost:8080.
// Prod (Render): set VITE_API_BASE_URL to the backend URL, e.g.
//   https://rubsal-pos-api.onrender.com/api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const storeId = getState().store?.activeStoreId
    if (storeId) headers.set('X-Store-Id', String(storeId))
    return headers
  },
})

// Wraps the base query: on 401, try to refresh once, then retry the request.
let refreshing = null
async function baseQueryWithReauth(args, apiCtx, extraOptions) {
  let result = await rawBaseQuery(args, apiCtx, extraOptions)

  if (result.error?.status === 401) {
    const refreshToken = apiCtx.getState().auth.refreshToken
    const isAuthCall = typeof args === 'object' && String(args.url).startsWith('/auth/')
    if (refreshToken && !isAuthCall) {
      // De-duplicate concurrent refreshes
      refreshing =
        refreshing ||
        rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          apiCtx,
          extraOptions,
        )
      const refreshResult = await refreshing
      refreshing = null

      if (refreshResult.data) {
        apiCtx.dispatch(setCredentials(refreshResult.data))
        result = await rawBaseQuery(args, apiCtx, extraOptions)
      } else {
        apiCtx.dispatch(logout())
      }
    }
  }
  return result
}

const TAGS = [
  'Auth', 'Category', 'Product', 'Service', 'Inventory', 'StockMovement', 'StockUnit', 'Floor', 'Table',
  'Employee', 'Role', 'Permission', 'Store', 'Dashboard', 'Settings',
  'Order', 'PaymentDevice', 'Label', 'ServiceJob', 'Customer',
]

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAGS,
  endpoints: (build) => ({
    // ---------- Auth ----------
    login: build.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    // Signup: start emails a verification LINK; verify (via the link token) creates the account.
    signupStart: build.mutation({ query: (body) => ({ url: '/auth/signup/start', method: 'POST', body }) }),
    signupVerify: build.mutation({ query: (body) => ({ url: '/auth/signup/verify', method: 'POST', body }) }),
    me: build.query({ query: () => '/auth/me', providesTags: ['Auth'] }),
    // Password reset via emailed LINK: forgot sends it, validate checks the token, reset sets the password.
    forgotPassword: build.mutation({
      query: (body) => ({ url: '/auth/password/forgot', method: 'POST', body }),
    }),
    validateResetToken: build.mutation({
      query: (body) => ({ url: '/auth/password/validate', method: 'POST', body }),
    }),
    resetPassword: build.mutation({
      query: (body) => ({ url: '/auth/password/reset', method: 'POST', body }),
    }),

    // ---------- Categories ----------
    getCategories: build.query({
      query: (params) => ({ url: '/categories', params }),
      providesTags: ['Category'],
    }),
    getAllCategories: build.query({ query: () => '/categories/all', providesTags: ['Category'] }),
    createCategory: build.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: build.mutation({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: build.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),

    // ---------- Products ----------
    getProducts: build.query({
      query: (params) => ({ url: '/products', params }),
      providesTags: ['Product'],
    }),
    getProduct: build.query({
      query: (id) => `/products/${id}`,
      providesTags: (r, e, id) => [{ type: 'Product', id }],
    }),
    createProduct: build.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product', 'Category', 'Inventory', 'Dashboard'],
    }),
    updateProduct: build.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Product', 'Category', 'Inventory'],
    }),
    deleteProduct: build.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product', 'Category', 'Inventory', 'Dashboard'],
    }),
    importProducts: build.mutation({
      query: (formData) => ({ url: '/products/import', method: 'POST', body: formData }),
      invalidatesTags: ['Product', 'Inventory'],
    }),
    generateBarcode: build.mutation({ query: () => ({ url: '/products/barcode' }) }),

    // ---------- Services ----------
    getServices: build.query({
      query: (params) => ({ url: '/services', params }),
      providesTags: ['Service'],
    }),
    getService: build.query({
      query: (id) => `/services/${id}`,
      providesTags: (r, e, id) => [{ type: 'Service', id }],
    }),
    createService: build.mutation({
      query: (body) => ({ url: '/services', method: 'POST', body }),
      invalidatesTags: ['Service'],
    }),
    updateService: build.mutation({
      query: ({ id, ...body }) => ({ url: `/services/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Service'],
    }),
    deleteService: build.mutation({
      query: (id) => ({ url: `/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Service'],
    }),

    // ---------- Inventory (variant-centric, ledgered) ----------
    getInventory: build.query({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Inventory'],
    }),
    getStockMovements: build.query({
      query: ({ variantId, ...params }) => ({ url: `/inventory/variants/${variantId}/movements`, params }),
      providesTags: ['StockMovement'],
    }),
    getVariantUnits: build.query({
      query: (variantId) => `/inventory/variants/${variantId}/units`,
      providesTags: ['StockUnit'],
    }),
    getVariantCaptureLabels: build.query({
      query: (variantId) => `/inventory/variants/${variantId}/capture-labels`,
    }),
    lookupUnit: build.query({
      query: (serial) => ({ url: '/inventory/units/lookup', params: { serial } }),
    }),
    receiveStock: build.mutation({
      query: ({ variantId, quantity, units, reason }) => ({ url: `/inventory/variants/${variantId}/receive`, method: 'POST', body: { quantity, units, reason } }),
      invalidatesTags: ['Inventory', 'Product', 'Dashboard', 'StockMovement', 'StockUnit'],
    }),
    adjustStock: build.mutation({
      query: ({ variantId, onHand, reason }) => ({ url: `/inventory/variants/${variantId}/adjust`, method: 'POST', body: { onHand, reason } }),
      invalidatesTags: ['Inventory', 'Product', 'Dashboard', 'StockMovement'],
    }),
    retireUnit: build.mutation({
      query: ({ variantId, unitId, reason }) => ({ url: `/inventory/variants/${variantId}/units/${unitId}/retire`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Inventory', 'Product', 'Dashboard', 'StockMovement', 'StockUnit'],
    }),

    // ---------- Floors & Tables ----------
    getFloors: build.query({ query: () => '/floors', providesTags: ['Floor'] }),
    createFloor: build.mutation({
      query: (body) => ({ url: '/floors', method: 'POST', body }),
      invalidatesTags: ['Floor'],
    }),
    updateFloor: build.mutation({
      query: ({ id, ...body }) => ({ url: `/floors/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Floor'],
    }),
    deleteFloor: build.mutation({
      query: (id) => ({ url: `/floors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Floor', 'Table'],
    }),
    getTables: build.query({
      query: (params) => ({ url: '/tables', params }),
      providesTags: ['Table'],
    }),
    createTable: build.mutation({
      query: (body) => ({ url: '/tables', method: 'POST', body }),
      invalidatesTags: ['Table', 'Floor'],
    }),
    updateTable: build.mutation({
      query: ({ id, ...body }) => ({ url: `/tables/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Table', 'Floor'],
    }),
    deleteTable: build.mutation({
      query: (id) => ({ url: `/tables/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Table', 'Floor'],
    }),

    // ---------- Employees ----------
    getEmployees: build.query({
      query: (params) => ({ url: '/employees', params }),
      providesTags: ['Employee'],
    }),
    createEmployee: build.mutation({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),
    updateEmployee: build.mutation({
      query: ({ id, ...body }) => ({ url: `/employees/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Employee'],
    }),
    deleteEmployee: build.mutation({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee', 'Dashboard'],
    }),

    // ---------- Roles ----------
    getRoles: build.query({ query: (params) => ({ url: '/roles', params }), providesTags: ['Role'] }),
    createRole: build.mutation({
      query: (body) => ({ url: '/roles', method: 'POST', body }),
      invalidatesTags: ['Role'],
    }),
    updateRole: build.mutation({
      query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Role'],
    }),
    deleteRole: build.mutation({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Role'],
    }),

    // ---------- Permissions ----------
    getPermissions: build.query({
      query: (params) => ({ url: '/permissions', params }),
      providesTags: ['Permission'],
    }),
    createPermission: build.mutation({
      query: (body) => ({ url: '/permissions', method: 'POST', body }),
      invalidatesTags: ['Permission'],
    }),
    updatePermission: build.mutation({
      query: ({ id, ...body }) => ({ url: `/permissions/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Permission'],
    }),
    deletePermission: build.mutation({
      query: (id) => ({ url: `/permissions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Permission'],
    }),

    // ---------- Stores ----------
    getStores: build.query({ query: () => '/stores', providesTags: ['Store'] }),
    createStore: build.mutation({
      query: (body) => ({ url: '/stores', method: 'POST', body }),
      invalidatesTags: ['Store'],
    }),
    updateStore: build.mutation({
      query: ({ id, ...body }) => ({ url: `/stores/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Store'],
    }),
    deleteStore: build.mutation({
      query: (id) => ({ url: `/stores/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Store'],
    }),

    // ---------- Dashboard ----------
    getDashboard: build.query({ query: () => '/dashboard/summary', providesTags: ['Dashboard'] }),

    // ---------- Settings ----------
    getSettings: build.query({ query: () => '/settings', providesTags: ['Settings'] }),
    updateSettings: build.mutation({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings', 'Auth'],
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: '/settings/change-password', method: 'POST', body }),
    }),
    getNotifications: build.query({ query: () => '/settings/notifications', providesTags: ['Settings'] }),
    updateNotifications: build.mutation({
      query: (body) => ({ url: '/settings/notifications', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
    deactivateAccount: build.mutation({
      query: () => ({ url: '/settings/deactivate', method: 'POST' }),
    }),

    // ---------- Files ----------
    uploadFile: build.mutation({
      query: (formData) => ({ url: '/files', method: 'POST', body: formData }),
    }),

    // ---------- Orders (Cashier POS) ----------
    getOrders: build.query({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),
    getOrder: build.query({
      query: (id) => `/orders/${id}`,
      providesTags: (r, e, id) => [{ type: 'Order', id }],
    }),
    createOrder: build.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Table', 'Dashboard'],
    }),
    updateOrderStatus: build.mutation({
      query: ({ id, status }) => ({ url: `/orders/${id}/status`, method: 'POST', body: { status } }),
      invalidatesTags: ['Order'],
    }),
    voidOrder: build.mutation({
      query: (id) => ({ url: `/orders/${id}/void`, method: 'POST' }),
      invalidatesTags: ['Order'],
    }),

    // ---------- Service tracking (repair/service jobs) ----------
    getServiceJobs: build.query({
      query: (params) => ({ url: '/service-jobs', params }),
      providesTags: ['ServiceJob'],
    }),
    trackServiceJob: build.query({
      query: (token) => ({ url: '/service-jobs/track', params: { token } }),
    }),
    createServiceJob: build.mutation({
      query: (body) => ({ url: '/service-jobs', method: 'POST', body }),
      invalidatesTags: ['ServiceJob'],
    }),
    addServiceJobUpdate: build.mutation({
      query: ({ id, ...body }) => ({ url: `/service-jobs/${id}/updates`, method: 'POST', body }),
      invalidatesTags: ['ServiceJob'],
    }),
    addServiceJobProduct: build.mutation({
      query: ({ id, ...body }) => ({ url: `/service-jobs/${id}/products`, method: 'POST', body }),
      invalidatesTags: ['ServiceJob', 'Inventory', 'StockMovement', 'Dashboard'],
    }),
    removeServiceJobProduct: build.mutation({
      query: ({ id, lineId }) => ({ url: `/service-jobs/${id}/products/${lineId}`, method: 'DELETE' }),
      invalidatesTags: ['ServiceJob', 'Inventory', 'StockMovement', 'Dashboard'],
    }),
    addServiceJobCharge: build.mutation({
      query: ({ id, ...body }) => ({ url: `/service-jobs/${id}/charges`, method: 'POST', body }),
      invalidatesTags: ['ServiceJob'],
    }),
    removeServiceJobCharge: build.mutation({
      query: ({ id, chargeId }) => ({ url: `/service-jobs/${id}/charges/${chargeId}`, method: 'DELETE' }),
      invalidatesTags: ['ServiceJob'],
    }),
    billServiceJob: build.mutation({
      query: (body) => ({ url: '/service-jobs/bill', method: 'POST', body }),
      invalidatesTags: ['ServiceJob', 'Order', 'Dashboard'],
    }),

    // ---------- Customers ----------
    getCustomers: build.query({
      query: (params) => ({ url: '/customers', params }),
      providesTags: ['Customer'],
    }),
    getCustomer: build.query({
      query: (id) => `/customers/${id}`,
      providesTags: (r, e, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: build.mutation({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: build.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: build.mutation({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),

    // ---------- Payment devices (card terminals) ----------
    getPaymentDevices: build.query({ query: () => '/payment-devices', providesTags: ['PaymentDevice'] }),

    // ---------- Labels (custom fields for products & services) ----------
    getLabels: build.query({
      query: (params) => ({ url: '/labels', params }),
      providesTags: ['Label'],
    }),
    getAllLabels: build.query({ query: () => '/labels/all', providesTags: ['Label'] }),
    createLabel: build.mutation({
      query: (body) => ({ url: '/labels', method: 'POST', body }),
      invalidatesTags: ['Label'],
    }),
    updateLabel: build.mutation({
      query: ({ id, ...body }) => ({ url: `/labels/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Label', 'Product', 'Service'],
    }),
    deleteLabel: build.mutation({
      query: (id) => ({ url: `/labels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Label'],
    }),
  }),
})

export const {
  useLoginMutation, useSignupStartMutation, useSignupVerifyMutation, useMeQuery,
  useForgotPasswordMutation, useValidateResetTokenMutation, useResetPasswordMutation,
  useGetCategoriesQuery, useGetAllCategoriesQuery, useCreateCategoryMutation,
  useUpdateCategoryMutation, useDeleteCategoryMutation,
  useGetProductsQuery, useGetProductQuery, useCreateProductMutation,
  useUpdateProductMutation, useDeleteProductMutation, useImportProductsMutation, useGenerateBarcodeMutation,
  useGetServicesQuery, useGetServiceQuery, useCreateServiceMutation,
  useUpdateServiceMutation, useDeleteServiceMutation,
  useGetInventoryQuery, useGetStockMovementsQuery, useGetVariantUnitsQuery, useLazyLookupUnitQuery,
  useGetVariantCaptureLabelsQuery,
  useReceiveStockMutation, useAdjustStockMutation, useRetireUnitMutation,
  useGetFloorsQuery, useCreateFloorMutation, useUpdateFloorMutation, useDeleteFloorMutation,
  useGetTablesQuery, useCreateTableMutation, useUpdateTableMutation, useDeleteTableMutation,
  useGetEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation,
  useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
  useGetPermissionsQuery, useCreatePermissionMutation, useUpdatePermissionMutation, useDeletePermissionMutation,
  useGetStoresQuery, useCreateStoreMutation, useUpdateStoreMutation, useDeleteStoreMutation,
  useGetDashboardQuery,
  useGetSettingsQuery, useUpdateSettingsMutation, useChangePasswordMutation,
  useGetNotificationsQuery, useUpdateNotificationsMutation, useDeactivateAccountMutation,
  useUploadFileMutation,
  useGetOrdersQuery, useGetOrderQuery, useCreateOrderMutation,
  useUpdateOrderStatusMutation, useVoidOrderMutation,
  useGetPaymentDevicesQuery,
  useGetCustomersQuery, useGetCustomerQuery, useCreateCustomerMutation,
  useUpdateCustomerMutation, useDeleteCustomerMutation,
  useGetServiceJobsQuery, useLazyTrackServiceJobQuery, useCreateServiceJobMutation, useAddServiceJobUpdateMutation,
  useAddServiceJobProductMutation, useRemoveServiceJobProductMutation, useBillServiceJobMutation,
  useAddServiceJobChargeMutation, useRemoveServiceJobChargeMutation,
  useGetLabelsQuery, useGetAllLabelsQuery, useCreateLabelMutation,
  useUpdateLabelMutation, useDeleteLabelMutation,
} = api
