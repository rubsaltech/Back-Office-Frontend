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
  'Auth', 'Category', 'Product', 'Inventory', 'Floor', 'Table',
  'Employee', 'Role', 'Permission', 'Store', 'Dashboard', 'Settings',
]

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAGS,
  endpoints: (build) => ({
    // ---------- Auth ----------
    login: build.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    signup: build.mutation({ query: (body) => ({ url: '/auth/signup', method: 'POST', body }) }),
    me: build.query({ query: () => '/auth/me', providesTags: ['Auth'] }),
    forgotPassword: build.mutation({
      query: (body) => ({ url: '/auth/password/forgot', method: 'POST', body }),
    }),
    verifyOtp: build.mutation({
      query: (body) => ({ url: '/auth/password/verify-otp', method: 'POST', body }),
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

    // ---------- Inventory ----------
    getInventory: build.query({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Inventory'],
    }),
    adjustInventory: build.mutation({
      query: ({ productId, ...body }) => ({ url: `/inventory/${productId}`, method: 'PUT', body }),
      invalidatesTags: ['Inventory', 'Product'],
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
  }),
})

export const {
  useLoginMutation, useSignupMutation, useMeQuery,
  useForgotPasswordMutation, useVerifyOtpMutation, useResetPasswordMutation,
  useGetCategoriesQuery, useGetAllCategoriesQuery, useCreateCategoryMutation,
  useUpdateCategoryMutation, useDeleteCategoryMutation,
  useGetProductsQuery, useGetProductQuery, useCreateProductMutation,
  useUpdateProductMutation, useDeleteProductMutation, useImportProductsMutation,
  useGetInventoryQuery, useAdjustInventoryMutation,
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
} = api
