import express from "express"
import db from "../connection/drizzle.ts"

const router = express.Router()

// Post: Create User
async function createUser(req: express.Request, res: express.Response) {
    const { name, email, password } = req.body
    const user = await db.usersTable.create({
        data: {
            name,
            email,
            password,
        },
    })
    res.json(user)
}
router.post("/", createUser)

export default router