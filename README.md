# Stayora — Every Stay, A Better Story

India-wide hotel booking and property management platform. Next.js 15 + TypeScript + Prisma + SQLite (local file database).

---

## What actually works

These are implemented, wired to the database, and verified:

| Area | Status |
|---|---|
| Customer registration, login, logout, password reset | Working |
| Role-based routing (customer / owner / admin) | Working |
| Search across **83 hotels in 32 cities** with filters + sorting + pagination | Working |
| Hotel detail with live per-night availability and pricing | Working |
| Booking creation with server-authoritative pricing | Working |
| GST at 12% (≤ ₹7,500/night) and 18% (above), itemised | Working |
| Coupon validation and redemption limits | Working |
| Inventory decrement per night, cancellation restores stock | Working |
| **Oversell protection** — verified with 6 concurrent bookings for 1 room | Working |
| Account dashboard: upcoming / past / cancelled stays | Working |
| Booking detail with price breakdown and status history | Working |
| Cancellation with 48-hour policy enforcement | Working |
| Downloadable invoice (print-ready HTML) | Working |
| About, Contact (creates real support tickets), Help, Terms, Privacy, Cancellation policy | Working |
| Dark / light theme toggle | Working |
| **Owner:** add/edit property, room types, physical rooms, rates, inventory, staff access | Working |
| **Operations:** check-in with room assignment, extra charges, check-out with final bill, housekeeping | Working |
| **Admin:** hotel approve/suspend, user roles, coupons, support replies, audit log | Working |
| **Tenant isolation** — one owner cannot reach another's property, rates, or guests | Verified |

### Not implemented (be aware)

- **Payments are not collected.** Booking records are created with `amountPaid = 0`. Razorpay is *not* wired — no checkout popup, no webhooks. The checkout UI says this explicitly.
- **Email is not sent.** Password reset writes the link to the server console instead.
- **Owner, operations, and admin portals are fully functional** (see below). Metal/real-world limits: no photo uploads, no email delivery, no payment gateway.
- **Photo uploads** are not implemented; images come from the seed.
- All hotels, reviews, and photographs are **sample data**. Properties are fictional.

---

## Requirements

- Node.js 18+ (tested on 26)
- No database server needed — SQLite file lives in `prisma/dev.db`

## Setup

```bash
cd /Users/mac/Desktop/STAYORA
npm install
```

`.env` is already created with a generated `NEXTAUTH_SECRET` and a SQLite URL:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<already generated>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Then create and seed the database:

```bash
npx prisma migrate deploy
node --experimental-strip-types prisma/seed.ts
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000

## Demo logins

| Role | Email | Password |
|---|---|---|
| Customer | `customer@stayora.com` | `Customer@123456` |
| Hotel owner | `owner@stayora.com` | `Owner@123456` |
| Admin | `admin@stayora.com` | `Admin@123456` |
| Reception | `reception@stayora.com` | `Owner@123456` |

**Coupons to try at checkout:** `STAYORA10` (10% off, max ₹2,000), `FIRSTSTAY` (15% off, max ₹3,000), `WEEKEND500` (₹500 off over ₹5,000).

## Reset the database

```bash
rm prisma/dev.db
npx prisma migrate deploy
node --experimental-strip-types prisma/seed.ts
```

## Other commands

```bash
npm run build        # production build
npm run start        # run the production build
npx tsc --noEmit     # type check
npx prisma studio    # browse the database
```

---

## Routes

**Public** — `/`, `/search`, `/hotels/[slug]`, `/about`, `/contact`, `/help`, `/terms`, `/privacy`, `/cancellation-policy`
**Auth** — `/login`, `/register`, `/forgot-password`, `/reset-password`
**Customer** — `/account`, `/account/bookings/[id]`, `/checkout`, `/booking/confirmation/[reference]`
**Owner** — `/owner`, `/owner/properties`, `/owner/properties/new`, `/owner/properties/[id]`, `/owner/rooms`, `/owner/rates`, `/owner/inventory`, `/owner/bookings`, `/owner/reports`, `/owner/staff`
**Operations** — `/operations`, `/operations/arrivals`, `/operations/departures`, `/operations/rooms`, `/operations/housekeeping`, `/operations/bookings/[id]`
**Admin** — `/admin`, `/admin/hotels`, `/admin/users`, `/admin/bookings`, `/admin/payments`, `/admin/coupons`, `/admin/support`, `/admin/audit-logs`, `/admin/settings`

---

## How the booking engine works

1. **Quote** (`src/lib/booking-service.ts` → `quoteHotel`) reads `RoomInventory` for every night of the stay and takes the *minimum* available across those nights. A room type with 4 rooms but 0 on one night is unavailable.
2. **Book** (`createBooking`) runs in a single Prisma `$transaction`. For each night it issues a conditional update:
   ```ts
   updateMany({ where: { roomTypeId, date, available: { gte: rooms } },
                data: { available: { decrement: rooms } } })
   ```
   If `count === 0` the night was taken in the meantime and the whole transaction rolls back. This is what prevents overselling under concurrency.
3. **Price** is computed server-side only (`src/lib/pricing.ts`) — the browser never sends an amount. Money is handled in integer paise to avoid float drift.
4. **Cancel** restores inventory for every night and moves the booking to `CANCELLED`, within the 48-hour window.

## Project layout

```
prisma/
  schema.prisma      # 45 models
  seed.ts            # 83 hotels, 32 cities, 238 room types, coupons
  dev.db             # the SQLite database (regenerated by seed)
src/
  app/               # pages + route handlers
  components/        # header, footer, ui primitives, theme
  lib/
    pricing.ts       # GST bands, per-night rates, paise arithmetic
    booking-service.ts  # quoting, booking, cancellation, coupons
    hotel-queries.ts # search, hotel detail, destinations
    invoice.ts       # print-ready invoice renderer
  auth.ts            # NextAuth config (credentials + bcrypt)
```

## Management flows

**Owner portal.** Create a property (it enters `PENDING_APPROVAL` and is not bookable yet). Add room types — each creates N physical rooms and 180 days of inventory in one transaction. Edit rates with a live weekend/GST preview. Move inventory per date; the server refuses to drop availability below rooms already committed to bookings. Grant staff access per property.

**Operations.** Arrivals lists confirmed bookings. Check-in requires an ID-verified acknowledgement and a physical room of the booked type that is free for the whole stay — the server re-checks overlap. Extra charges can be added or removed until checkout. Check-out computes the final bill (room + extras), records payment taken at the desk, releases the room, and queues a housekeeping task. Housekeeping runs its own status flow, separate from availability.

**Admin.** Approving a property is blocked unless it has at least one active room type with physical rooms. Commission is admin-only. Role changes write to the audit log; an admin cannot demote themselves. Every privileged mutation calls `audit()`.

## Known constraints

- `next@15.1.0` has a published security advisory. For a real deployment, upgrade Next and re-run the build.
- The argon2 package was replaced with bcryptjs because native install scripts are blocked on this machine.
- Server-side date handling uses UTC midnight throughout for stay dates; hotel-local timezone handling would be the next refinement.
