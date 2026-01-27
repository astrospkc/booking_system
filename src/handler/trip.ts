import express from "express"
import db from "../connection/drizzle.ts"
import { booking, trip, usersTable } from "../db/schema.ts"
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

// get all the bookings
async function GetAllBookings(req: express.Request, res: express.Response) {
    try {
        const userId = req.params.user_id
        const bookings = await db.select().from(booking).where(eq(booking.user_id, userId))
        res.json(bookings)
    } catch (error) {
        console.error("Error fetching bookings:", error)
        res.status(500).json({ error: "Failed to fetch bookings" })
    }
}


// Trip Metrics - GET /admin/trips/{tripId}/metrics
// Response:
// {
// trip_id: "...",
// title: "Paris City Tour",
// occupancy_percent: 75,
// total_seats: 20,
// booked_seats: 15,
// available_seats: 5,
// booking_summary: {
// confirmed: 12,
// pending_payment: 2,
// cancelled: 1,
// expired: 0
// },
// financial: {
// gross_revenue: 1200.00,
// refunds_issued: 100.00,
// net_revenue: 1100.00

// }
// }

async function TripMetrics(req: express.Request, res: express.Response) {
    try {
        const { trip_id, admin_id } = req.params
        const user = await db.select().from(usersTable).where(eq(usersTable.id, admin_id))
        if (user[0].role != "ADMIN") {
            res.status(401).json({ error: "Unauthorized" })
            return
        }
        const tripDetail = await db.select().from(trip).where(eq(trip.id, trip_id))
        const bookingSummary = await db.select().from(booking).where(eq(booking.trip_id, trip_id))
        const pendingPayment = bookingSummary.filter((b: any) => b.state === "PENDING_PAYMENT").length
        const PaymentConfirmed = bookingSummary.filter((b: any) => b.state === "CONFIRMED").length
        const PaymentCancelled = bookingSummary.filter((b: any) => b.state === "CANCELLED").length
        const PaymentExpired = bookingSummary.filter((b: any) => b.state === "EXPIRED").length
        const totalSeats = tripDetail[0].max_capacity
        const availableSeats = tripDetail[0].available_seats
        const bookedSeats = totalSeats - availableSeats
        console.log("bookingSummary", bookingSummary)
        const grossRevenue = bookingSummary.filter((b: any) => b.state === "CONFIRMED").reduce((acc: number, b: any) => acc + parseInt(b.price_at_booking), 0)
        const refundsIssued = bookingSummary.filter((b: any) => b.state === "REFUNDED").reduce((acc: number, b: any) => (acc) + parseInt(b.refund_amount), 0)
        const netRevenue = grossRevenue - refundsIssued

        const data = {
            trip_id: tripDetail[0].id,
            title: tripDetail[0].title,
            occupancy_percent: tripDetail[0].occupancy_percent,
            total_seats: totalSeats,
            booked_seats: bookedSeats,
            available_seats: availableSeats,
            booking_summary: {
                confirmed: PaymentConfirmed,
                pending_payment: pendingPayment,
                cancelled: PaymentCancelled,
                expired: PaymentExpired
            },
            financial: {
                gross_revenue: grossRevenue,
                refunds_issued: refundsIssued,
                net_revenue: netRevenue
            }
        }
        res.json(data)
    } catch (error) {
        console.error("Error fetching trip:", error)
        res.status(500).json({ error: "Failed to fetch trip" })
    }
}





router.get("/all", GetAllTrips)
router.get("/:id", TripWithId)
router.get("/user/:user_id", GetAllBookings)
router.post("/:id/book", BookTrip)
router.get("/metrics/:trip_id/admin/:admin_id", TripMetrics)
export default router