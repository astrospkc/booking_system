import express from "express"
import db from "../connection/drizzle.ts"
import { booking, trip } from "../db/schema.ts"
import { eq, and } from "drizzle-orm"
const router = express.Router()

// Post: Create Trip
// Get :List all trips
async function GetAllTrips(req: express.Request, res: express.Response) {
    try {
        const trips = await db.select().from(trip)
        res.json(trips)
    } catch (error) {
        console.error("Error fetching trips:", error)
        res.status(500).json({ error: "Failed to fetch trips" })
    }
}
// Get :Get trip by id
async function TripWithId(req: express.Request, res: express.Response) {
    try {
        const tripId = req.params.id
        const tripDetail = await db.select().from(trip).where(eq(trip.id, tripId))
        res.json(tripDetail)
    } catch (error) {
        console.error("Error fetching trip:", error)
        res.status(500).json({ error: "Failed to fetch trip" })
    }
}
// Put :Update trip
// Delete :Delete trip

// post : Create booking
// (reserve seat, initiate
// payment)
// booking can be done if seats are available and trip is published
const isTripPublished = async (tripId: number) => {
    const tripDetail = await db.select().from(trip).where(and(eq(trip.id, tripId), eq(trip.status, "PUBLISHED")))
    return tripDetail.length > 0
}
const numSeatsAvailable = async (tripId: number) => {
    const tripDetail = await db.select().from(trip).where(eq(trip.id, tripId))
    return tripDetail[0].available_seats
}
async function BookTrip(req: express.Request, res: express.Response) {
    try {
        const { user_id } = req.query
        const tripId = req.params.id
        const { num_seats } = req.body
        // trip is published and seats are available
        if (!(await isTripPublished(tripId))) {
            res.status(400).json({ error: "Trip is not published or no seats available" })
            return
        }
        if (await numSeatsAvailable(tripId) < num_seats) {
            res.status(400).json({ error: "No seats available" })
            return
        }

        const tripInfo = await db.select().from(trip).where(eq(trip.id, tripId))
        // booking confirmation
        const bookingUpdate = await db.insert(booking).values({
            trip_id: tripId,
            user_id: user_id,
            num_seats: num_seats,
            state: "PENDING_PAYMENT",
            price_at_booking: tripInfo[0].price,
            payment_reference: "",
            expires_at: new Date(Date.now() + 15 * 60 * 1000),
            idempotency_key: `${user_id}_${tripId}_${Date.now()}`,
            created_at: new Date(),
            updated_at: new Date()

        }).returning()

        const numSeatAvailable = await numSeatsAvailable(tripId) - num_seats
        // reserve seats 
        await db.update(trip).set({ available_seats: numSeatAvailable }).where(eq(trip.id, tripId))

        const tripDetail = await db.select().from(trip).where(eq(trip.id, tripId))
        res.json({ Booking_update: bookingUpdate, Trip_detail: tripDetail })
    } catch (error) {
        console.error("Error fetching trip:", error)
        res.status(500).json({ error: "Failed to fetch booking details" })
    }
}

router.get("/all", GetAllTrips)
router.get("/:id", TripWithId)
router.post("/:id/book", BookTrip)
export default router