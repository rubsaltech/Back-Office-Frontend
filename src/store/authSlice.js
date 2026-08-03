import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'rubsal.auth'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore malformed storage
  }
  return { accessToken: null, refreshToken: null, user: null }
}

function persist(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    )
  } catch {
    // ignore quota/serialization errors
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    // Accepts a TokenResponse { accessToken, refreshToken, user }
    setCredentials(state, { payload }) {
      state.accessToken = payload.accessToken
      state.refreshToken = payload.refreshToken
      state.user = payload.user ?? state.user
      persist(state)
    },
    setUser(state, { payload }) {
      state.user = payload
      persist(state)
    },
    logout(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    },
  },
})

export const { setCredentials, setUser, logout } = authSlice.actions
export default authSlice.reducer

export const selectAccessToken = (s) => s.auth.accessToken
export const selectRefreshToken = (s) => s.auth.refreshToken
export const selectCurrentUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => Boolean(s.auth.accessToken)
