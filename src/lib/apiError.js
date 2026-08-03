/** Extract a human-readable message from an RTK Query error. */
export function apiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  const data = error.data
  if (data) {
    if (typeof data === 'string') return data
    if (data.message) return data.message
    if (Array.isArray(data.fieldErrors) && data.fieldErrors.length) {
      return data.fieldErrors.map((f) => f.message).join(', ')
    }
  }
  if (error.status === 'FETCH_ERROR') return 'Cannot reach the server. Is the backend running?'
  return fallback
}
