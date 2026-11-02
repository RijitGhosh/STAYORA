import type { Booking, Hotel, RoomType, Invoice } from "@prisma/client"

export type InvoiceBooking = Booking & {
  hotel: Hotel
  items: { roomType: RoomType; quantity: number; ratePerNight: number; totalAmount: number }[]
  invoice: Invoice | null
}

/**
 * Build a print-ready HTML invoice. Kept as HTML rather than a bundled PDF
 * library so the browser can render, print and save it without extra
 * dependencies — and so hotel staff can read it in any browser.
 */
export function renderInvoiceHtml(booking: InvoiceBooking): string {
  const nightRate = booking.items[0]?.ratePerNight ?? 0
  const rooms = booking.numberOfRooms

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

  const date = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  const invoiceNo = booking.invoice?.invoiceNumber ?? `INV-${booking.bookingReference.replace("STY-", "")}`
  const issueDate = booking.invoice?.issueDate ?? booking.createdAt

  const policy = (() => {
    try { return JSON.parse(booking.policySnapshot) } catch { return {} }
  })()
  const gstRate = policy.gstRate ?? 0.12

  const rows = booking.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.roomType.name)}</td>
        <td>${date(booking.checkInDate)} – ${date(booking.checkOutDate)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${booking.numberOfNights}</td>
        <td class="num">${inr(item.ratePerNight)}</td>
        <td class="num">${inr(item.totalAmount)}</td>
      </tr>`
    )
    .join("")

  const taxBreakup = `
    <tr><td class="num">Room charges</td><td class="num">${inr(booking.roomCharges + booking.discounts)}</td></tr>
    ${booking.discounts > 0 ? `<tr><td class="num">Discount${booking.couponCode ? ` (${escapeHtml(booking.couponCode)})` : ""}</td><td class="num">−${inr(booking.discounts)}</td></tr>` : ""}
    <tr><td class="num">GST @ ${Math.round(gstRate * 100)}%</td><td class="num">${inr(booking.taxes)}</td></tr>
    <tr class="total"><td class="num">Total</td><td class="num">${inr(booking.totalAmount)}</td></tr>
    <tr><td class="num">Amount paid</td><td class="num">${inr(booking.amountPaid)}</td></tr>
    <tr><td class="num">Outstanding</td><td class="num">${inr(booking.outstandingAmount)}</td></tr>
  `

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(invoiceNo)} — ${escapeHtml(booking.hotel.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Inter, Arial, sans-serif; color: #202B36; margin: 0; padding: 40px; background: #FAF9F6; }
  .sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #E3E8EC; border-radius: 10px; padding: 40px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #087F8C; padding-bottom: 20px; margin-bottom: 24px; }
  .brand h1 { margin: 0; font-size: 26px; color: #123047; letter-spacing: -0.3px; }
  .brand p { margin: 4px 0 0; color: #687786; font-size: 12px; }
  .doc { text-align: right; }
  .doc h2 { margin: 0 0 6px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #087F8C; }
  .doc p { margin: 2px 0; font-size: 12px; color: #687786; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .meta h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #687786; }
  .meta p { margin: 2px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: #123047; color: #fff; text-align: left; padding: 10px 8px; font-weight: 600; font-size: 12px; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #E3E8EC; }
  td.num, th.num { text-align: right; }
  .totals { margin-top: 18px; margin-left: auto; width: 300px; }
  .totals td { padding: 6px 8px; border: 0; }
  .total td { border-top: 2px solid #123047; font-weight: 700; font-size: 15px; padding-top: 10px; }
  .note { margin-top: 28px; padding: 14px; background: #FAF9F6; border-left: 3px solid #22B8B0; font-size: 12px; color: #687786; }
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #E3E8EC; font-size: 11px; color: #687786; display: flex; justify-content: space-between; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge.paid { background: #21865B15; color: #21865B; }
  .badge.due { background: #D98B1215; color: #D98B12; }
  @media print { body { background: #fff; padding: 0; } .sheet { border: 0; padding: 0; } }
</style>
</head>
<body>
<div class="sheet">
  <div class="head">
    <div class="brand">
      <h1>Stayora</h1>
      <p>Every Stay, A Better Story</p>
    </div>
    <div class="doc">
      <h2>${booking.status === "CANCELLED" ? "Cancellation statement" : booking.amountPaid >= booking.totalAmount ? "Tax invoice" : "Pro forma invoice"}</h2>
      <p><strong>${escapeHtml(invoiceNo)}</strong></p>
      <p>Issued ${date(issueDate)}</p>
      <p>Booking ${escapeHtml(booking.bookingReference)}</p>
    </div>
  </div>

  <div class="meta">
    <div>
      <h3>Property</h3>
      <p><strong>${escapeHtml(booking.hotel.name)}</strong></p>
      <p>${escapeHtml(booking.hotel.address)}</p>
      <p>${escapeHtml(booking.hotel.pincode)}</p>
      ${booking.hotel.gstin ? `<p>GSTIN ${escapeHtml(booking.hotel.gstin)}</p>` : ""}
      <p>${escapeHtml(booking.hotel.phone)}</p>
    </div>
    <div>
      <h3>Billed to</h3>
      <p><strong>${escapeHtml(booking.guestName)}</strong></p>
      <p>${escapeHtml(booking.guestEmail)}</p>
      <p>${escapeHtml(booking.guestPhone)}</p>
      <p style="margin-top:8px">
        <span class="badge ${booking.amountPaid >= booking.totalAmount ? "paid" : "due"}">
          ${booking.amountPaid >= booking.totalAmount ? "Paid in full" : `Balance due`}
        </span>
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Room</th>
        <th>Stay dates</th>
        <th class="num">Rooms</th>
        <th class="num">Nights</th>
        <th class="num">Rate/night</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <table class="totals">
    ${taxBreakup}
  </table>

  <div class="note">
    ${booking.status === "CANCELLED"
      ? `This booking was cancelled on ${booking.cancelledAt ? date(booking.cancelledAt) : "record"}${booking.cancellationReason ? ` — ${escapeHtml(booking.cancellationReason)}` : ""}. Refund status: ${escapeHtml(booking.refundStatus.replace(/_/g, " ").toLowerCase())}.`
      : `Free cancellation up to 48 hours before check-in. Check-in ${escapeHtml(booking.hotel.checkInTime)}, check-out ${escapeHtml(booking.hotel.checkOutTime)}. This document is a computer-generated invoice and does not require a physical signature.`}
  </div>

  <div class="footer">
    <span>Stayora · support@stayora.example · +91 80 4000 0000</span>
    <span>${escapeHtml(invoiceNo)}</span>
  </div>
</div>
</body>
</html>`
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
