// Single source of truth for how each store vertical behaves in the POS.
// Add a new vertical here (+ its i18n labels) and the whole POS adapts — no
// scattered `if (type === 'RESTAURANT')` checks.
import {
  UtensilsCrossed, Bike, Truck, ShoppingCart, Package, Wrench, Smartphone, ShoppingBag,
} from 'lucide-react'

// Fulfillment-mode metadata. `needsTable` sends the flow to floor/table select
// (only when the vertical also has floor/tables); `needsCustomer` opens the
// customer form. Everything else goes straight to the order builder.
export const ORDER_MODES = {
  DINE_IN: { icon: UtensilsCrossed, needsTable: true, needsCustomer: false },
  TAKEAWAY: { icon: Bike, needsTable: false, needsCustomer: false },
  DELIVERY: { icon: Truck, needsTable: false, needsCustomer: true },
  COUNTER: { icon: ShoppingCart, needsTable: false, needsCustomer: false },
  PICKUP: { icon: Package, needsTable: false, needsCustomer: false },
  SERVICE: { icon: Wrench, needsTable: false, needsCustomer: true },
  REPAIR: { icon: Smartphone, needsTable: false, needsCustomer: true },
}

export const VERTICALS = {
  RESTAURANT: { modes: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'], hasFloorTables: true, hasSeats: true, cartIcon: UtensilsCrossed, noteKey: 'pos.noteLabels.RESTAURANT' },
  RETAIL: { modes: ['COUNTER', 'DELIVERY'], hasFloorTables: false, hasSeats: false, cartIcon: ShoppingCart, noteKey: 'pos.noteLabels.RETAIL' },
  MOBILE: { modes: ['COUNTER', 'REPAIR', 'DELIVERY'], hasFloorTables: false, hasSeats: false, cartIcon: Smartphone, noteKey: 'pos.noteLabels.MOBILE' },
  MECHANIC: { modes: ['SERVICE', 'PICKUP'], hasFloorTables: false, hasSeats: false, cartIcon: Wrench, noteKey: 'pos.noteLabels.MECHANIC' },
  GENERAL: { modes: ['COUNTER', 'DELIVERY'], hasFloorTables: false, hasSeats: false, cartIcon: ShoppingBag, noteKey: 'pos.noteLabels.GENERAL' },
}

/** Store types, in the order shown in the onboarding dropdown. */
export const STORE_TYPES = ['RESTAURANT', 'RETAIL', 'MOBILE', 'MECHANIC', 'GENERAL']

export function verticalFor(type) {
  return VERTICALS[type] || VERTICALS.GENERAL
}

export function modeMeta(mode) {
  return ORDER_MODES[mode] || ORDER_MODES.COUNTER
}
