import "dotenv/config"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse"
import db from "../connection/drizzle"
import { trip } from "./schema"

type TripRow = {
    title: string
    destination: string
    start_date: string
    end_date: string
    price: string
    max_capacity: string
    available_seats: string
    status: "DRAFT" | "PUBLISHED"
    refund_policy: string
}

const csvPath = path.join(process.cwd(), "data", "trip.csv")

async function seedTrips() {
    const rows: TripRow[] = []

    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(parse({ columns: true, trim: true }))
            .on("data", (row: TripRow) => rows.push(row))
            .on("end", resolve)
            .on("error", reject)
    })


    const values = rows.map((r) => {


        return {
            title: r.title,
            destination: r.destination,
            start_date: new Date(r.start_date),
            end_date: new Date(r.end_date),
            price: Number(r.price),
            max_capacity: Number(r.max_capacity),
            available_seats: Number(r.available_seats),
            status: r.status,
            refund_policy: JSON.parse(r.refund_policy)
        };
    })

    await db.insert(trip).values(values).onConflictDoNothing()

    console.log(`✅ Seeded ${values.length} trips`)
}

async function main() {
    try {
        await seedTrips()
    } catch (err) {
        console.error("❌ Seeding failed:", err)
        process.exit(1)
    } finally {
        process.exit(0)
    }
}

main()
