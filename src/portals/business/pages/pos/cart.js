// Pure cart/order helpers for the POS. No React — easy to reason about and test.

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/** Effective unit price = manual override if set, else the base product price. */
export function unitPrice(line) {
  return line.overridePrice != null ? num(line.overridePrice) : num(line.basePrice)
}

export function lineTotal(line) {
  return unitPrice(line) * (line.quantity || 1)
}

/** True when this line's price was manually changed from the catalog price. */
export function isOverridden(line) {
  return line.overridePrice != null && num(line.overridePrice) !== num(line.basePrice)
}

/** Build a cart line from a product + a chosen variant (price/stock live on the variant).
 *  For a serial-tracked variant, pass `units` ([{id, serial}]); the line's quantity
 *  is then the number of selected units, and it carries their ids + serials. */
export function makeLine({ product, variant, seatNumber, quantity, specialInstructions, units }) {
  const v = variant || defaultVariant(product)
  const serial = Array.isArray(units)
  return {
    uid: uid(),
    productId: product.id,
    variantId: v?.id ?? null,
    name: product.name,
    variantName: v && !v.isDefault ? v.variantName : null,
    basePrice: num(v?.price),
    overridePrice: null, // manual per-line price; null = use basePrice
    taxAmount: num(product.taxAmount),
    serial,
    unitIds: serial ? units.map((u) => u.id) : null,
    serials: serial ? units.map((u) => u.serial) : null,
    quantity: serial ? units.length : (quantity || 1),
    seatNumber: seatNumber ?? null,
    specialInstructions: specialInstructions || '',
  }
}

/** The default (single) variant of a product. */
export function defaultVariant(product) {
  const vs = product?.variants ?? []
  return vs.find((v) => v.isDefault) ?? vs[0] ?? null
}

/** Order totals, mirroring the backend computation so the preview matches. */
export function totals(lines, discount) {
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0)
  const taxTotal = lines.reduce((s, l) => s + num(l.taxAmount) * (l.quantity || 1), 0)
  let discountTotal = 0
  if (discount && num(discount.value) > 0) {
    discountTotal =
      discount.type === 'PERCENTAGE' ? (subtotal * num(discount.value)) / 100 : num(discount.value)
    if (discountTotal > subtotal) discountTotal = subtotal
  }
  return { subtotal, taxTotal, discountTotal, total: subtotal + taxTotal - discountTotal }
}

/** Convert the client cart + context into the POST /orders payload. */
export function toOrderPayload({ type, table, customer, kitchenNote, discount, lines, payment }) {
  return {
    type,
    tableId: table?.id ?? null,
    guestCount: customer?.guests ?? 1,
    customerName: customer?.name ?? null,
    customerPhone: customer?.phone ?? null,
    customerAddress: customer?.address ?? null,
    kitchenNote: kitchenNote || null,
    discountType: discount && num(discount.value) > 0 ? discount.type : null,
    discountValue: discount && num(discount.value) > 0 ? num(discount.value) : null,
    items: lines.map((l, i) => ({
      productId: l.productId,
      variantId: l.variantId ?? null,
      seatNumber: l.seatNumber ?? null,
      quantity: l.quantity || 1,
      specialInstructions: l.specialInstructions || null,
      // Send the manual price only when it was changed; else the server uses the catalog price.
      unitPrice: l.overridePrice != null ? num(l.overridePrice) : null,
      // Serialized lines carry the specific units (IMEIs) being sold.
      unitIds: l.unitIds ?? null,
      sortOrder: i,
    })),
    payment: payment?.method
      ? { method: payment.method, deviceId: payment.deviceId ?? null }
      : null,
  }
}
