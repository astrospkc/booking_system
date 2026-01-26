import cron from "node-cron"
import { expireBookings } from "./lib/bookings.js"

cron.schedule("*/1 * * * *", async () => {
    console.log("⏱ Running booking expiry job...")

    await expireBookings()
})