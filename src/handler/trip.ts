import express from "express"
import db from "../connection/drizzle.ts"
import { trip } from "../db/schema.ts"
import { eq } from "drizzle-orm"
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

router.get("/all", GetAllTrips)
router.get("/:id", TripWithId)
export default router