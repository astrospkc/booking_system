import express from "express"
import db from "../connection/drizzle.ts"
import { usersTable } from "../db/schema.js"

const router = express.Router()





// Post: Create User
async function createUser(req: express.Request, res: express.Response) {
    const { name, email, role } = req.body
    const data = {
        name: name,
        email: email,
        role: role
    }
    try {
        const user = await db.insert(usersTable).values(data).returning().onConflictDoNothing()
        res.json(user)
    } catch (error) {
        console.error("Error creating user:", error)
        res.status(500).json({ error: "Failed to create user" })
    }

}

async function getAllUsers(req: express.Request, res: express.Response) {
    try {
        const users = await db.select().from(usersTable)
        res.json(users)
    } catch (error) {
        console.error("Error fetching users:", error)
        res.status(500).json({ error: "Failed to fetch users" })
    }
}
router.post("/", createUser)
router.get("/all", getAllUsers)
export default router