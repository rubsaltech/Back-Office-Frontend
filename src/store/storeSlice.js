import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'rubsal.activeStore'

// Tags for data that is scoped to the active store. Switching stores invalidates
// these so every store-specific screen refetches for the newly selected store.
export const STORE_SCOPED_TAGS = [
  'Product', 'Category', 'Service', 'Inventory', 'Floor', 'Table',
  'Employee', 'Order', 'PaymentDevice', 'Dashboard',
]

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { activeStoreId: Number(raw) || null }
  } catch {
    // ignore malformed storage
  }
  return { activeStoreId: null }
}

const storeSlice = createSlice({
  name: 'store',
  initialState: loadInitial(),
  reducers: {
    setActiveStore(state, { payload }) {
      state.activeStoreId = payload == null ? null : Number(payload)
      try {
        if (state.activeStoreId == null) localStorage.removeItem(STORAGE_KEY)
        else localStorage.setItem(STORAGE_KEY, String(state.activeStoreId))
      } catch {
        // ignore quota/serialization errors
      }
    },
  },
})

export const { setActiveStore } = storeSlice.actions
export default storeSlice.reducer

export const selectActiveStoreId = (s) => s.store.activeStoreId
