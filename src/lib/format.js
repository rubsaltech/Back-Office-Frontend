// Per-business currency is configurable; the UI formats from a currency code.
// Default to EUR to match the dashboard mockups; swap when wired to the API.
let currency = 'EUR'

export function setCurrency(code) {
  currency = code
}

export function money(value, { code = currency, compact = false } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value ?? 0)
}

export function number(value, { compact = false } = {}) {
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value ?? 0)
}
