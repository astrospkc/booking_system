import { razorpay } from "../connection/razorpay.ts"
import express from "express"
import crypto from "crypto"
import db from "../connection/drizzle.ts"
import { booking } from "../db/schema.ts"
import { eq } from "drizzle-orm"

const router = express.Router()

export async function createPaymentLink(bookingId: number, amount: number, trip_id: number, idempotency_key: string) {
    const link = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        description: "Trip booking payment",
        reference_id: bookingId.toString(),
        callback_url: "http://localhost:8000/payment_success",
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

function validateSignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto.createHmac("sha256", secret)
        .update(body)
        .digest("hex")
    return expectedSignature === signature
}

export async function PaymentWebhook(req: express.Request, res: express.Response) {
    const signature = req.headers["x-razorpay-signature"] as string
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    console.log("signature and secret: ", signature, secret)

    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not set")
        res.status(500).json({ error: "Configuration error" })
        return
    }

    try {
        const isValid = validateSignature(
            JSON.stringify(req.body),
            signature,
            secret
        )

        console.log("isValid", isValid)
        if (!isValid) {
            res.status(400).json({ error: "Invalid signature" })
            return
        }

        const { event, payload } = req.body

        if (event === "payment.captured") {
            const paymentEntity = payload.payment.entity
            const bookingId = paymentEntity.notes.booking_id
            const paymentId = paymentEntity.id

            if (!bookingId) {
                console.error("Booking ID missing in payment notes")
                res.status(400).json({ error: "Booking ID missing" })
                return
            }

            const currentBooking = await db.select().from(booking).where(eq(booking.id, parseInt(bookingId)))

            if (currentBooking.length === 0) {
                res.status(404).json({ error: "Booking not found" })
                return
            }

            const bookingRecord = currentBooking[0]

            // Idempotency check
            if (bookingRecord.state === "CONFIRMED") {
                if (bookingRecord.payment_reference === paymentId) {
                    res.json({ message: "Payment already processed", status: "idempotent_success" })
                    return
                } else {
                    console.warn(`Duplicate confirmation for booking ${bookingId} with new payment ${paymentId}`)
                    res.json({ message: "Booking already confirmed", status: "already_confirmed" })
                    return
                }
            }

            // Update booking
            await db.update(booking).set({
                state: "CONFIRMED",
                payment_reference: paymentId,
                updated_at: new Date()
            }).where(eq(booking.id, parseInt(bookingId)))

            res.json({ message: "Payment processed successfully" })
            return
        }

        res.status(200).send("OK")

    } catch (error) {
        console.error("Webhook processing error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}

router.get("/create-payment-link", PaymentLink)
router.post("/webhook/razorpay", PaymentWebhook)

export default router

