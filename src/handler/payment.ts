import { razorpay } from "../connection/razorpay.ts"
import express from "express"
const router = express.Router()
export async function createPaymentLink(bookingId: number, amount: number, trip_id: number) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: "Trip booking payment",
        reference_id: bookingId.toString(),
        callback_url: "http://localhost:3000/payment-success",
        callback_method: "get",
        notes: {
            booking_id: bookingId.toString()
        }
    })

    return link.short_url
}

export async function PaymentLink(req: express.Request, res: express.Response) {
    const { bookingId, amount, trip_id } = req.body
    const link = await createPaymentLink(bookingId, amount, trip_id)
    res.json({ link })
}
router.post("/create-payment-link", PaymentLink)

export default router