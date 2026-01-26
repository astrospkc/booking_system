import express from "express"
import db from "../connection/drizzle.ts"
import { usersTable } from "../db/schema.js"

const router = express.Router()

// Post: Create User
async function createUser(req: express.Request, res: express.Response) {
    const { name, email } = req.body
    const data = {
        name: name,
        email: email
    }
    try {
        const user = await db.insert(usersTable).values(data).returning().onConflictDoNothing()
        res.json(user)
    } catch (error) {
        console.error("Error creating user:", error)
        res.status(500).json({ error: "Failed to create user" })
    }

}
router.post("/", createUser)

export default router