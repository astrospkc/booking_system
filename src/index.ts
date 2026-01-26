import express from "express"
import dotenv from "dotenv"
import userRouter from "./handler/user.js"

dotenv.config()


const app = express()
app.use(express.json())

app.use("/user", userRouter)
const port = 8000

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})