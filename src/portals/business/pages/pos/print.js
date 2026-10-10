// Receipt printing for the POS invoice. Opens a dedicated print window with ONLY
// the receipt (fast), sized per format. Each store can customize its receipt via
// a config object (ctx.config = { thermal:{...}, full:{...} }): store-name
// override, logo, header/footer lines, terms text, and section toggles.
//   - thermal : 80mm / 58mm roll (normal customers)
//   - full    : A4 invoice (customers submitting the bill to a company)

import { money } from '../../../../lib/format.js'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Built-in default texts (used when the store hasn't overridden them).
export const DEFAULTS = {
  thermalTerms: 'Goods once sold are taken back only on exchange within 7 days with receipt.',
  thermalThankYou: 'Thank you! Visit Again',
  fullTerms: 'Payment due upon receipt. Goods once sold are taken back only on exchange within 7 days with this invoice.',
  fullThankYou: 'Thank you for your business.',
}

// A section is shown unless the config explicitly turns it off.
const show = (cfg, key) => cfg?.show?.[key] !== false
const lines = (arr) => (Array.isArray(arr) ? arr.map((s) => String(s || '').trim()).filter(Boolean) : [])
const text = (v, fallback) => (v != null && String(v).trim() !== '' ? String(v) : fallback)

function fmtDateTime(iso) {
  try {
    const d = new Date(iso)
    return {
      date: d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    }
  } catch {
    return { date: '', time: '' }
  }
}

// --- number to words (whole units) for the thermal "amount in words" line ---
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function below1000(n) {
  let out = ''
  if (n >= 100) { out += ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) out += ' and ' }
  if (n >= 20) { out += TENS[Math.floor(n / 10)]; if (n % 10) out += ' ' + ONES[n % 10] }
  else if (n > 0) out += ONES[n]
  return out.trim()
}

function amountInWords(value) {
  let n = Math.round(Number(value) || 0)
  if (n === 0) return 'Zero Only'
  const scales = [['Million', 1000000], ['Thousand', 1000]]
  let words = ''
  for (const [name, factor] of scales) {
    if (n >= factor) { words += below1000(Math.floor(n / factor)) + ' ' + name + ' '; n %= factor }
  }
  if (n > 0) words += below1000(n)
  return words.trim() + ' Only'
}

function priceChanged(it) {
  return it.originalUnitPrice != null && Number(it.originalUnitPrice) !== Number(it.unitPrice)
}
function unitPriceHtml(it) {
  return priceChanged(it)
    ? `<s>${money(it.originalUnitPrice)}</s> ${money(it.unitPrice)}`
    : money(it.unitPrice)
}

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=420,height=640')
  if (!w) {
    alert('Please allow pop-ups to print the receipt.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  const go = () => { w.focus(); w.print() }
  if (w.document.readyState === 'complete') setTimeout(go, 150)
  else w.onload = () => setTimeout(go, 150)
  w.onafterprint = () => w.close()
}

// ---------------------------------------------------------------- thermal ----
function thermalHtml(order, ctx, mm = 80, cfg = {}) {
  const small = mm <= 58
  const pad = small ? '3mm 2mm' : '6mm 4mm'
  const fs = small ? 9 : 11
  const big = small ? 12 : 16
  const { date, time } = fmtDateTime(order.createdAt)
  const name = esc(text(cfg.storeName, ctx.storeName || 'Store'))
  const terms = text(cfg.terms, DEFAULTS.thermalTerms)
  const thankYou = text(cfg.footerThankYou, DEFAULTS.thermalThankYou)

  const rows = (order.items ?? []).map((it, i) => `
    <tr>
      <td class="l">${i + 1}. ${esc(it.productName)}${it.specialInstructions ? `<div class="note">${esc(it.specialInstructions)}</div>` : ''}</td>
    </tr>
    <tr class="sub">
      <td class="l"><span>${it.quantity} x ${unitPriceHtml(it)}</span><span class="r">${money(it.lineTotal)}</span></td>
    </tr>`).join('')

  const saved = (show(cfg, 'youSaved') && Number(order.discountTotal) > 0)
    ? `<div class="saved">YOU SAVED ${money(order.discountTotal)}</div>` : ''

  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt #${esc(order.orderNumber)}</title>
  <style>
    @page { size: ${mm}mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { width: ${mm}mm; margin: 0; padding: ${pad}; font-family: 'Courier New', monospace; font-size: ${fs}px; color: #000; }
    .c { text-align: center; }
    .b { font-weight: 700; }
    .big { font-size: ${big}px; font-weight: 700; }
    .logo { max-width: ${small ? 60 : 50}%; max-height: ${small ? 60 : 80}px; margin: 0 auto 4px; display: block; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 1px 0; vertical-align: top; }
    .l { text-align: left; }
    .r { float: right; text-align: right; }
    .note { font-size: 10px; font-style: italic; }
    .row { display: flex; justify-content: space-between; }
    .saved { text-align: center; border: 1px solid #000; padding: 4px; margin: 6px 0; font-weight: 700; }
    .words { font-size: 10px; margin-top: 4px; }
    .terms { font-size: 9px; margin-top: 6px; }
  </style></head><body>
    ${cfg.logoUrl ? `<img class="logo" src="${esc(cfg.logoUrl)}" alt="" />` : ''}
    <div class="c big">${name}</div>
    ${lines(cfg.headerLines).map((l) => `<div class="c">${esc(l)}</div>`).join('')}
    ${show(cfg, 'address') && ctx.address ? `<div class="c">${esc(ctx.address)}</div>` : ''}
    ${show(cfg, 'phone') && ctx.phone ? `<div class="c">Ph: ${esc(ctx.phone)}</div>` : ''}
    <div class="hr"></div>
    <div class="c b">INVOICE</div>
    <div class="row"><span>Bill No: ${esc(order.orderNumber)}</span><span>${esc(order.type)}</span></div>
    ${show(cfg, 'dateTime') ? `<div class="row"><span>Date: ${date}</span><span>${time}</span></div>` : ''}
    ${show(cfg, 'customer') && order.customerName ? `<div>Customer: ${esc(order.customerName)}</div>` : ''}
    ${show(cfg, 'customer') && order.customerPhone ? `<div>Contact: ${esc(order.customerPhone)}</div>` : ''}
    ${show(cfg, 'table') && order.tableName ? `<div>Table: ${esc(order.tableName)}</div>` : ''}
    ${show(cfg, 'servedBy') && order.handlerName ? `<div>Served by: ${esc(order.handlerName)}</div>` : ''}
    <div class="hr"></div>
    <table>${rows}</table>
    <div class="hr"></div>
    ${show(cfg, 'itemsCount') ? `<div class="row"><span>Items: ${(order.items ?? []).length}</span><span>Qty: ${(order.items ?? []).reduce((s, i) => s + i.quantity, 0)}</span></div><div class="hr"></div>` : ''}
    <div class="row"><span>Sub Total</span><span>${money(order.subtotal)}</span></div>
    ${show(cfg, 'tax') ? `<div class="row"><span>Tax</span><span>${money(order.taxTotal)}</span></div>` : ''}
    ${show(cfg, 'discount') && Number(order.discountTotal) > 0 ? `<div class="row"><span>Discount</span><span>- ${money(order.discountTotal)}</span></div>` : ''}
    <div class="row b big"><span>TOTAL</span><span>${money(order.total)}</span></div>
    ${saved}
    ${show(cfg, 'amountInWords') ? `<div class="words">${esc(amountInWords(order.total))}</div>` : ''}
    <div class="hr"></div>
    ${(order.payments ?? []).map((p) => `<div class="row"><span>Paid (${esc(p.method)})</span><span>${money(p.amount)}</span></div>`).join('')}
    ${terms ? `<div class="terms">${esc(terms)}</div>` : ''}
    ${lines(cfg.footerLines).map((l) => `<div class="c">${esc(l)}</div>`).join('')}
    ${thankYou ? `<div class="c b" style="margin-top:8px">${esc(thankYou)}</div>` : ''}
  </body></html>`
}

// --------------------------------------------------------------- full page ----
function fullHtml(order, ctx, cfg = {}) {
  const { date } = fmtDateTime(order.createdAt)
  const name = esc(text(cfg.storeName, ctx.businessName || ctx.storeName || 'Business'))
  const terms = text(cfg.terms, DEFAULTS.fullTerms)
  const thankYou = text(cfg.footerThankYou, DEFAULTS.fullThankYou)

  const rows = (order.items ?? []).map((it) => `
    <tr>
      <td>${esc(it.productName)}${it.specialInstructions ? `<div class="note">${esc(it.specialInstructions)}</div>` : ''}</td>
      <td class="c">${it.quantity}</td>
      <td class="r">${unitPriceHtml(it)}</td>
      <td class="r">${money(it.lineTotal)}</td>
    </tr>`).join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${esc(order.orderNumber)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1f2937; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .title { font-size: 34px; font-weight: 800; letter-spacing: 1px; }
    .biz { text-align: right; }
    .biz .name { font-size: 18px; font-weight: 700; }
    .biz .muted, .muted { color: #6b7280; }
    .logo { max-height: 70px; max-width: 220px; margin-bottom: 6px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .meta h4 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: .5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #111827; color: #fff; text-align: left; padding: 10px; font-size: 12px; }
    th.c, td.c { text-align: center; }
    th.r, td.r { text-align: right; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .note { font-size: 11px; color: #6b7280; }
    .totals { width: 42%; margin-left: auto; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 2px solid #111827; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 800; }
    .foot { margin-top: 40px; font-size: 12px; color: #6b7280; }
    .foot h4 { color: #111827; margin: 0 0 6px; }
  </style></head><body>
    <div class="head">
      <div><div class="title">INVOICE</div><div class="muted">#${esc(String(order.orderNumber).padStart(6, '0'))}</div></div>
      <div class="biz">
        ${cfg.logoUrl ? `<img class="logo" src="${esc(cfg.logoUrl)}" alt="" />` : ''}
        <div class="name">${name}</div>
        ${lines(cfg.headerLines).map((l) => `<div class="muted">${esc(l)}</div>`).join('')}
        ${show(cfg, 'address') && ctx.address ? `<div class="muted">${esc(ctx.address)}</div>` : ''}
        ${show(cfg, 'phone') && ctx.phone ? `<div class="muted">${esc(ctx.phone)}</div>` : ''}
        ${show(cfg, 'email') && ctx.email ? `<div class="muted">${esc(ctx.email)}</div>` : ''}
      </div>
    </div>

    <div class="meta">
      <div>
        <h4>Bill To</h4>
        <div class="name">${esc(order.customerName || '—')}</div>
        ${order.customerAddress ? `<div class="muted">${esc(order.customerAddress)}</div>` : ''}
        ${order.customerPhone ? `<div class="muted">${esc(order.customerPhone)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div><span class="muted">Invoice #:</span> ${esc(order.orderNumber)}</div>
        ${show(cfg, 'dateTime') ? `<div><span class="muted">Issued:</span> ${date}</div>` : ''}
        <div><span class="muted">Balance Due:</span> <b>${money(order.total)}</b></div>
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span class="muted">Subtotal</span><span>${money(order.subtotal)}</span></div>
      ${show(cfg, 'tax') ? `<div class="row"><span class="muted">Tax</span><span>${money(order.taxTotal)}</span></div>` : ''}
      ${show(cfg, 'discount') && Number(order.discountTotal) > 0 ? `<div class="row"><span class="muted">Discount</span><span>- ${money(order.discountTotal)}</span></div>` : ''}
      <div class="row grand"><span>Total</span><span>${money(order.total)}</span></div>
    </div>

    <div class="foot">
      ${terms ? `<h4>Terms &amp; Conditions</h4><div>${esc(terms)}</div>` : ''}
      ${lines(cfg.footerLines).map((l) => `<div>${esc(l)}</div>`).join('')}
      ${thankYou ? `<div style="margin-top:16px;text-align:center">${esc(thankYou)}</div>` : ''}
    </div>
  </body></html>`
}

/** Resolve the template config for a format from ctx.config = { thermal, full }. */
function cfgFor(ctx, format) {
  const all = ctx.config || {}
  return (format === 'full' ? all.full : all.thermal) || {}
}

/** Build the receipt HTML. format = 'thermal' (80mm) | 'thermal58' (58mm) | 'full'. */
export function buildReceiptHtml(order, format, ctx = {}) {
  const cfg = cfgFor(ctx, format)
  if (format === 'full') return fullHtml(order, ctx, cfg)
  if (format === 'thermal58') return thermalHtml(order, ctx, 58, cfg)
  return thermalHtml(order, ctx, 80, cfg)
}

/** Print the order invoice. */
export function printReceipt(order, format, ctx = {}) {
  if (!order) return
  openPrintWindow(buildReceiptHtml(order, format, ctx))
}
