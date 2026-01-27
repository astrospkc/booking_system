# Booking System

## Project Structure

The project follows a modular structure organized by functionality:

- **`src/`**
  - **`connection/`**: Configuration for external services and databases (e.g., Drizzle ORM, Razorpay).
  - **`cron/`**: Background jobs, such as cleaning up expired bookings.
  - **`db/`**: Database definitions, including `schema.ts` for tables and `seed.ts` for initial data.
  - **`handler/`**: API Controllers containing the business logic.
    - `trip.ts`: Handles trip listing and the core booking reservation logic.
    - `payment.ts`: Manages payment link generation, webhooks, and refunds.
    - `user.ts`: User-related operations.
  - **`index.ts`**: The main entry point that initializes the Express app and routes.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Payment Gateway**: Razorpay
- **Scheduling**: node-cron

## Booking System Logic

The booking system is designed to handle concurrency and payment states efficiently:

1.  **Reservation (Locking)**:
    -   When a user initiates a booking, the system first checks if the trip is `PUBLISHED` and has sufficient `available_seats`.
    -   If valid, it **immediately decrements** the `available_seats` from the `trip` table.
    -   A `booking` record is created with status `PENDING_PAYMENT` and an `expires_at` timestamp (set to 15 minutes).

2.  **Payment Flow**:
    -   A Razorpay payment link is generated.
    -   **Expiration Check**: If the user attempts to pay after the 15-minute window, the system detects the expiration, releases the reserved seats back to the trip, and marks the booking as `EXPIRED`.

3.  **Confirmation (Webhooks)**:
    -   The system relies on Razorpay Webhooks for final confirmation (`payment.captured`).
    -   **Security**: Webhook signatures are validated using an HMAC SHA256 hash.
    -   **Idempotency**: The system checks if a booking is already `CONFIRMED` to handle duplicate webhook events gracefully.
    -   Upon success, the booking state moves to `CONFIRMED`.

4.  **Cancellation & Refunds**:
    -   Refunds are calculated dynamically based on the trip's specific `refund_policy` (e.g., cancellation fee %).
    -   The system triggers a Razorpay refund for the calculated amount and updates the booking state.

## Application Process

1.  **Browse**: User retrieves a list of trips.
2.  **Book**: User requests a booking `->` Seats are reserved `->` 15-min timer starts.
3.  **Pay**: User pays via the secure Razorpay link.
4.  **Verify**: System receives a Webhook `->` Verifies Signature `->` Confirms Booking.
5.  **Cleanup**: A Cron job (or pre-payment check) ensures unpaid bookings release their seats after expiration.
