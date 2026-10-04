import { configureStore } from '@reduxjs/toolkit'
import { api } from './api'
import authReducer from './authSlice'
import storeReducer from './storeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    store: storeReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
})
