-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingReference" TEXT NOT NULL,
    "userId" TEXT,
    "hotelId" TEXT NOT NULL,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "numberOfNights" INTEGER NOT NULL,
    "numberOfRooms" INTEGER NOT NULL,
    "numberOfAdults" INTEGER NOT NULL,
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refundStatus" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
    "roomCharges" REAL NOT NULL,
    "taxes" REAL NOT NULL,
    "discounts" REAL NOT NULL DEFAULT 0,
    "additionalCharges" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "outstandingAmount" REAL NOT NULL,
    "couponCode" TEXT,
    "policySnapshot" TEXT NOT NULL,
    "cancellationDeadline" DATETIME,
    "confirmedAt" DATETIME,
    "checkedInAt" DATETIME,
    "checkedOutAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("additionalCharges", "amountPaid", "bookingReference", "cancellationDeadline", "cancellationReason", "cancelledAt", "checkInDate", "checkOutDate", "checkedInAt", "checkedOutAt", "confirmedAt", "couponCode", "createdAt", "discounts", "guestEmail", "guestName", "guestPhone", "hotelId", "id", "numberOfAdults", "numberOfChildren", "numberOfNights", "numberOfRooms", "outstandingAmount", "policySnapshot", "refundStatus", "roomCharges", "status", "taxes", "totalAmount", "updatedAt", "userId") SELECT "additionalCharges", "amountPaid", "bookingReference", "cancellationDeadline", "cancellationReason", "cancelledAt", "checkInDate", "checkOutDate", "checkedInAt", "checkedOutAt", "confirmedAt", "couponCode", "createdAt", "discounts", "guestEmail", "guestName", "guestPhone", "hotelId", "id", "numberOfAdults", "numberOfChildren", "numberOfNights", "numberOfRooms", "outstandingAmount", "policySnapshot", "refundStatus", "roomCharges", "status", "taxes", "totalAmount", "updatedAt", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
