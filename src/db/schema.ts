import { integer, pgTable, timestamp, varchar, decimal, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("app_users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
});


export const tripStatusEnum = pgEnum("trip_status", [
    "DRAFT",
    "PUBLISHED"
])
export const trip = pgTable("app_trip", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    destination: varchar({ length: 255 }).notNull(),
    start_date: timestamp("start_date").notNull(),
    end_date: timestamp("end_date").notNull(),
    price: decimal("price").notNull(),
    max_capacity: integer("max_capacity").notNull(),
    available_seats: integer("available_seats").notNull(),
    status: tripStatusEnum("status").notNull(),
    refund_policy: jsonb("refund_policy").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
})
export const bookingStateEnum = pgEnum("booking_state", [
    "PENDING_PAYMENT",
    "CONFIRMED",
    "CANCELLED",
    "EXPIRED"
])


export const booking = pgTable("app_bookings", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    trip_id: integer("trip_id").notNull(),
    user_id: integer("user_id").notNull(),
    num_seats: integer("num_seats").notNull(),
    state: bookingStateEnum("state").notNull(),
    price_at_booking: decimal("price_at_booking").notNull(),
    payment_reference: varchar({ length: 255 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    expires_at: timestamp("expires_at").notNull(),
    cancelled_at: timestamp("cancelled_at"),
    refund_amount: decimal("refund_amount"),
    idempotency_key: varchar({ length: 255 }).unique().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
})