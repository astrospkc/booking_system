import { razorpay } from "../connection/razorpay.ts"
import express from "express"
const router = express.Router()

export async function createPaymentLink(bookingId: number, amount: number, trip_id: number, idempotency_key: string) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: "Trip booking payment",
        reference_id: bookingId.toString(),
        callback_url: "http://localhost:3000/payment-success",
        callback_method: "get",
        notes: {
            booking_id: bookingId.toString(),
            trip_id: trip_id.toString(),
            idempotency_key: idempotency_key
        }
    })

    return link.short_url
}

export async function PaymentLink(req: express.Request, res: express.Response) {
    const { bookingId, amount, trip_id, idempotency_key } = req.body
    const link = await createPaymentLink(bookingId, amount, trip_id, idempotency_key)
    res.json({ link })
}





router.get("/create-payment-link", PaymentLink)

export default router


// http://localhost:3000/payment-success?razorpay_payment_id=pay_S8ZYqObqpJE9ln&razorpay_payment_link_id=plink_S8ZY8tecsd7B7r&razorpay_payment_link_reference_id=7&razorpay_payment_link_status=paid&razorpay_signature=6d98aa9e1b9dcbf947fde3637e942be2a5eeb7648640cf2e7840de3f15f5f914