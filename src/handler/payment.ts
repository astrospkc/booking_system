import { razorpay } from "../connection/razorpay.ts"
import express from "express"
import crypto from "crypto"
import db from "../connection/drizzle.ts"
import { booking, trip } from "../db/schema.ts"
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
    // first check if payment time expired
    const currentBooking = await db.select().from(booking).where(eq(booking.id, bookingId))
    if (currentBooking[0].expires_at < new Date()) {
        // revert back the seats 
        const tripDetail = await db.select().from(trip).where(eq(trip.id, trip_id))
        const available_Seats = tripDetail[0].available_seats + currentBooking[0].num_seats
        await db.update(trip).set({
            available_seats: available_Seats,
            updated_at: new Date()
        }).where(eq(trip.id, trip_id))


        await db.update(booking).set({
            state: "EXPIRED",
            updated_at: new Date()
        }).where(eq(booking.id, bookingId))
        res.status(410).json({ message: "Payment time expired" })
        return
    }
    // 1st check if booking is already confirmed
    const link = await createPaymentLink(bookingId, amount, trip_id, idempotency_key)
    res.status(200).json({ link })
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
        console.log("event and payload: ", event, payload)
        console.log("book id: ", payload.refund.entity.notes.booking_id)
        const bookingId = payload.refund.entity.notes.booking_id
        if (event === "payment.captured") {
            const paymentEntity = payload.payment.entity
            const bookingId = paymentEntity.notes.booking_id
            const paymentId = paymentEntity.id
            console.log("bookingId and paymentId: ", bookingId, paymentId)

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
                    console.log("Payment already processed")
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

        switch (event) {
            case "refund.created":

                await db.update(booking).set({
                    state: "REFUND_REQUESTED",
                    updated_at: new Date()
                }).where(eq(booking.id, bookingId))
                break;
            case "refund.processed":

                await db.update(booking).set({
                    state: "REFUNDED",
                    updated_at: new Date()
                }).where(eq(booking.id, bookingId))
                console.log("refund is processed")
                break;
            default:
                res.status(400).json({ message: "invalid event" })
        }


        res.status(200).send("OK")

    } catch (error) {
        console.error("Webhook processing error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}

// cancel booking and refund 
// refund policy : 
// {
//   "cancellation_fee_percent": 10,
//   "refundable_until_days_before": 7
// }

async function CancelBooking(req: express.Request, res: express.Response) {
    try {
        const { trip_id, booking_id } = req.params
        console.log("trip id and booking id: ", trip_id, booking_id)
        const bookingDetail = await db.select().from(booking).where(eq(booking.id, parseInt(booking_id)))
        const b_state = bookingDetail[0].state
        if (b_state == "EXPIRED" || b_state == "PENDING_PAYMENT" || b_state == "CANCELLED") {
            res.status(400).json({ message: "Refund is not possible as the payment has not been processed" })
            return
        }
        const payment = await razorpay.payments.fetch(bookingDetail[0].payment_reference)
        if (payment.status !== "captured") {
            res.status(400).json({ message: "Payment not captured yet" })
            return
        }
        const tripDetail = await db.select().from(trip).where(eq(trip.id, parseInt(trip_id)))
        const refundAmount = bookingDetail[0].price_at_booking - bookingDetail[0].price_at_booking * (tripDetail[0].refund_policy.cancellation_fee_percent / 100)

        const refundLink = await razorpay.payments.refund(bookingDetail[0].payment_reference, {
            amount: refundAmount,
            speed: "normal",
            notes: {
                booking_id: booking_id,
                trip_id: trip_id,
                idempotency_key: bookingDetail[0].idempotency_key
            }
        })
        console.log("refund link : ", refundLink)
        await db.update(booking).set({
            state: "PROCESSING",
            refund_amount: refundAmount,
            updated_at: new Date()

        }).where(eq(booking.id, parseInt(booking_id)))

        res.status(200).json("refund is being processed")

    } catch (error) {
        res.status(500).json("error occurred while refund")

    }
}

router.get("/create-payment-link", PaymentLink)
router.post("/webhook/razorpay", PaymentWebhook)
router.post("/cancel-booking/:trip_id/:booking_id", CancelBooking)

export default router

