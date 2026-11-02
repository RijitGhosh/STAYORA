import { PrismaClient } from '@prisma/client'
import { simulatePayment, validatePaymentToken, isSandboxMode } from '@/lib/payments'
import { createBooking } from '@/lib/booking-service'

const p = new PrismaClient()
const d = (n:number)=>{const x=new Date();x.setUTCHours(0,0,0,0);x.setUTCDate(x.getUTCDate()+n);return x}

async function main(){
  console.log('sandbox mode:', isSandboxMode())

  const hotel = await p.hotel.findFirst({ where: { name: 'The Imperial Meridian' }, include: { roomTypes: true } })
  const u = await p.user.findUnique({ where: { email: 'customer@stayora.com' } })

  console.log('\n--- payment token validation ---')
  console.log('UPI valid:', validatePaymentToken('UPI', 'ananya@okhdfcbank') === null)
  console.log('UPI invalid rejected:', validatePaymentToken('UPI', 'notanid') !== null)
  console.log('empty token rejected:', validatePaymentToken('CARD', '') !== null)
  console.log('pay at hotel needs no token:', validatePaymentToken('PAY_AT_HOTEL', undefined) === null)

  console.log('\n--- method simulation ---')
  for (const m of ['CARD','UPI','NETBANKING','WALLET','PAY_AT_HOTEL'] as const) {
    const r = simulatePayment({ amount: 5000, method: m, token: m === 'UPI' ? 'x@bank' : 'ref1234' })
    console.log(`  ${m.padEnd(14)} → ${r.status}`)
  }
  const fail = simulatePayment({ amount: 5000, method: 'CARD', token: 'fail-card' })
  console.log('  failure path   →', fail.status, '|', fail.failureReason)

  console.log('\n--- book + pay ---')
  const b = await createBooking({
    userId: u!.id, hotelId: hotel!.id, roomTypeId: hotel!.roomTypes[0].id,
    checkIn: d(6), checkOut: d(8), rooms: 1, adults: 2, children: 0,
    guestName: 'Ananya Iyer', guestEmail: 'customer@stayora.com', guestPhone: '9000000003',
  })
  console.log('booking:', b.bookingReference, '| total', b.totalAmount, '| paid', b.amountPaid)

  const sim = simulatePayment({ amount: b.totalAmount, method: 'UPI', token: 'ananya@okhdfcbank' })
  const pay = await p.payment.create({ data: {
    bookingId: b.id, razorpayOrderId: sim.orderId, razorpayPaymentId: sim.paymentId,
    amount: b.totalAmount, status: sim.status, method: 'UPI', provider: sim.provider,
    maskedReference: 'an***@okhdfcbank', paidAt: sim.status === 'CAPTURED' ? new Date() : null,
  }})
  const paid = await p.booking.update({ where: { id: b.id }, data: {
    amountPaid: sim.status === 'CAPTURED' ? b.totalAmount : 0,
    outstandingAmount: sim.status === 'CAPTURED' ? 0 : b.totalAmount,
    status: 'CONFIRMED',
  }})
  console.log('payment row:', pay.status, '| booking paid:', paid.amountPaid, '| outstanding:', paid.outstandingAmount)

  const reread = await p.payment.findUnique({ where: { id: pay.id } })
  console.log('stored masked ref:', reread!.maskedReference, '| raw UPI stored?', reread!.maskedReference?.includes('@okhdfcbank') ? 'no user part stored' : 'n/a')

  // cleanup
  await p.payment.deleteMany({ where: { bookingId: b.id } })
  await p.bookingItem.deleteMany({ where: { bookingId: b.id } })
  await p.bookingStatusHistory.deleteMany({ where: { bookingId: b.id } })
  await p.booking.delete({ where: { id: b.id } })
  console.log('\ncleanup ok')
}
main().catch(e=>{console.error('ERR', e.message)}).finally(()=>p.$disconnect())
