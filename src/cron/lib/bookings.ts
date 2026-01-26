import { booking, trip } from "../../db/schema.ts";
import db from "../../connection/drizzle.ts";
import { and, eq, lt } from "drizzle-orm";

export async function expireBookings() {
    const expired = await db.select().from(booking).where(and(eq(booking.state, "PENDING_PAYMENT"), lt(booking.expires_at, new Date())))
    if (expired.length == 0) {
        return
    }

    for (const b of expired) {
        await db.transaction(async (tx) => {
            tx.update(booking).set({ state: "EXPIRED" }).where(eq(booking.id, b.id))
            tx.update(trip).set({ available_seats: booking.num_seats + trip.available_seats }).where(eq(trip.id, b.trip_id))
        })

    }
}