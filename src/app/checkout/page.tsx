import { redirect } from "next/navigation"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { getCurrentUser } from "@/auth"
import { prisma } from "@/lib/prisma"
import { quoteHotel } from "@/lib/booking-service"
import { formatCurrency, formatDate } from "@/lib/utils"
import CheckoutForm from "@/app/checkout/CheckoutForm"

export const dynamic = "force-dynamic"

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length ? v : undefined
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const user = await getCurrentUser()

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v)

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout?${qs.toString()}`)}`)
  }

  const roomTypeId = str(sp.roomTypeId)
  const checkIn = str(sp.checkIn)
  const checkOut = str(sp.checkOut)
  const rooms = Math.max(1, Number(str(sp.rooms) ?? 1) || 1)
  const adults = Math.max(1, Number(str(sp.adults) ?? 2) || 2)
  const children = Math.max(0, Number(str(sp.children) ?? 0) || 0)

  if (!roomTypeId || !checkIn || !checkOut) {
    redirect("/search")
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      hotel: { include: { city: { include: { state: true } }, images: { take: 1, orderBy: { order: "asc" } } } },
    },
  })

  if (!roomType) redirect("/search")

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  let quoteError: string | null = null
  let line: Awaited<ReturnType<typeof quoteHotel>>[number] | undefined

  try {
    const lines = await quoteHotel({
      hotelId: roomType.hotelId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms,
      guests: adults + children,
    })
    line = lines.find((l) => l.roomTypeId === roomTypeId)
    if (!line) quoteError = "That room type is no longer available for these dates."
  } catch (e: any) {
    quoteError = e?.message ?? "Unable to price this stay"
  }

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Complete your booking</h1>

        {quoteError || !line ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center max-w-xl">
            <p className="font-semibold mb-2">We couldn't price this stay</p>
            <p className="text-secondaryText text-sm">{quoteError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CheckoutForm
                user={{ name: user.name, email: user.email, phone: user.phone ?? "" }}
                hotel={{ id: roomType.hotel.id, name: roomType.hotel.name, city: roomType.hotel.city.name }}
                roomTypeName={roomType.name}
                checkIn={checkIn}
                checkOut={checkOut}
                rooms={rooms}
                adults={adults}
                children={children}
                roomTypeId={roomTypeId}
                initialState={{ roomCharges: line.price.roomCharges, taxes: line.price.taxes, total: line.price.totalAmount }}
              />
            </div>

            <aside>
              <div className="bg-white border border-border rounded-lg overflow-hidden sticky top-4">
                {roomType.hotel.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={roomType.hotel.images[0].url}
                    alt={roomType.hotel.name}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-5">
                  <h2 className="font-semibold">{roomType.hotel.name}</h2>
                  <p className="text-sm text-secondaryText">
                    {roomType.hotel.city.name}, {roomType.hotel.city.state.name}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondaryText">Room</span>
                      <span className="font-medium">{roomType.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondaryText">Check-in</span>
                      <span>{formatDate(checkInDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondaryText">Check-out</span>
                      <span>{formatDate(checkOutDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondaryText">Nights</span>
                      <span>{line.price.numberOfNights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondaryText">Rooms × guests</span>
                      <span>{rooms} × {adults + children}</span>
                    </div>
                  </div>

                  <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondaryText">Room charges</span>
                      <span>{formatCurrency(line.price.roomCharges)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondaryText">GST ({Math.round(line.price.gstRate * 100)}%)</span>
                      <span>{formatCurrency(line.price.taxes)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                      <span>Total payable</span>
                      <span className="text-deepOceanBlue">{formatCurrency(line.price.totalAmount)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-secondaryText mt-4">
                    Prices are in Indian Rupees and include applicable GST. Free cancellation up to 48 hours
                    before check-in.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
