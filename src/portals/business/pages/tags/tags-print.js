// Barcode tag (label) printing for thermal label rolls (one 50×30mm label per unit).
import JsBarcode from 'jsbarcode'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** Render a barcode value to an inline SVG string. EAN13 for 13-digit codes, else Code128. */
export function barcodeSvg(value, opts = {}) {
  const v = String(value ?? '').trim()
  if (!v) return ''
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const base = { width: 1.6, height: 36, fontSize: 12, margin: 2, displayValue: true, ...opts }
  const isEan13 = /^\d{13}$/.test(v)
  try {
    JsBarcode(svg, v, { format: isEan13 ? 'EAN13' : 'CODE128', ...base })
  } catch {
    try { JsBarcode(svg, v, { format: 'CODE128', ...base }) } catch { return '' }
  }
  return svg.outerHTML
}

function labelHtml(name, specs, svg) {
  const specLines = specs.map(([k, v]) => `<div class="spec">${esc(k)}: ${esc(v)}</div>`).join('')
  return `<div class="label">
    <div class="name">${esc(name)}</div>
    ${specLines}
    <div class="bc">${svg}</div>
  </div>`
}

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=420,height=640')
  if (!w) { alert('Please allow pop-ups to print the tags.'); return }
  w.document.open()
  w.document.write(html)
  w.document.close()
  const go = () => { w.focus(); w.print() }
  if (w.document.readyState === 'complete') setTimeout(go, 200)
  else w.onload = () => setTimeout(go, 200)
  w.onafterprint = () => w.close()
}

function docHtml(labels) {
  // Continuous 50mm roll: each label is its own page, height grows with the spec
  // list so nothing is clipped. Left-aligned, uniform weight (no bold).
  return `<!doctype html><html><head><meta charset="utf-8"><title>Tags</title><style>
    @page { size: 50mm auto; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; font-weight: 400; }
    .label { width: 50mm; padding: 2.5mm 3mm; text-align: left; page-break-after: always; }
    .label:last-child { page-break-after: auto; }
    .name { font-size: 12px; font-weight: 400; line-height: 1.2; margin-bottom: 1.5mm; }
    .spec { font-size: 10px; font-weight: 400; line-height: 1.45; }
    .bc { margin-top: 2mm; line-height: 0; }
    .bc svg { width: 100%; max-width: 44mm; height: auto; display: block; }
  </style></head><body>${labels}</body></html>`
}

/** The variant's specifications as [key, value] lines for the tag. */
export function tagSpecs(variant) {
  return Object.entries(variant?.attributes || {}).filter(([k, v]) => k && String(v).trim())
}

/** Print `quantity` identical tags for a product's variant. */
export function printTags({ product, variant, quantity }) {
  const value = variant?.barcode || variant?.sku
  if (!value) { alert('This item has no barcode or SKU to print.'); return }
  const svg = barcodeSvg(value)
  const one = labelHtml(product.name, tagSpecs(variant), svg)
  const n = Math.max(1, Math.min(500, Number(quantity) || 1))
  openPrintWindow(docHtml(Array.from({ length: n }, () => one).join('')))
}
