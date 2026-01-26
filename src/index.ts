import express from "express"
import dotenv from "dotenv"
import userRouter from "./handler/user.js"
import tripRouter from "./handler/trip.js"
import paymentRouter from "./handler/payment.js"
import "./cron/expireBooking.js"
dotenv.config()


const app = express()
app.use(express.json())

app.use("/user", userRouter)
app.use("/trip", tripRouter)
app.use("/payment", paymentRouter)
const port = 8000

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})