// Pure cart/order helpers for the POS. No React — easy to reason about and test.

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/** Unit price = base product price + all selected modifier deltas. */
export function unitPrice(line) {
  const mods = (line.modifiers || []).reduce((s, m) => s + num(m.priceDelta), 0)
  return num(line.basePrice) + mods
}

export function lineTotal(line) {
  return unitPrice(line) * (line.quantity || 1)
}

/** Build a cart line from a product + the modifier selections made in the panel. */
export function makeLine({ product, seatNumber, quantity, specialInstructions, modifiers }) {
  return {
    uid: uid(),
    productId: product.id,
    name: product.name,
    basePrice: num(product.price),
    taxAmount: num(product.taxAmount),
    quantity: quantity || 1,
    seatNumber: seatNumber ?? null,
    specialInstructions: specialInstructions || '',
    modifiers: (modifiers || []).map((m) => ({
      groupName: m.groupName || '',
      name: m.name,
      priceDelta: num(m.priceDelta),
    })),
  }
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
      seatNumber: l.seatNumber ?? null,
      quantity: l.quantity || 1,
      specialInstructions: l.specialInstructions || null,
      sortOrder: i,
      modifiers: (l.modifiers || []).map((m) => ({
        groupName: m.groupName || null,
        name: m.name,
        priceDelta: num(m.priceDelta),
      })),
    })),
    payment: payment?.method
      ? { method: payment.method, deviceId: payment.deviceId ?? null }
      : null,
  }
}
