import express from "express"
import db from "../connection/drizzle.ts"
import { trip } from "../db/schema.ts"
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
// Put :Update trip
// Delete :Delete trip

router.get("/all", GetAllTrips)
export default router