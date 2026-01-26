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


// http://localhost:3000/payment-success?razorpay_payment_id=pay_S8bBZxROjPQG6W&razorpay_payment_link_id=plink_S8bBCBKScXfNhL&razorpay_payment_link_reference_id=9&razorpay_payment_link_status=paid&razorpay_signature=8f66d95758176916e33447484169e6e0e25c1d21092c8b0536e1a5178970693c