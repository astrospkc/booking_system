import { integer, pgTable, timestamp, varchar, decimal, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
});


// Trip
// id (UUID)
// title (string)
// destination (string)
// start_date (datetime)
// end_date (datetime)
// price (decimal) - price per seat
// max_capacity (integer) - total seats
// available_seats (integer) - seats left (denormalized, must stay in sync)
// status (enum: DRAFT, PUBLISHED)
// refund_policy
// ├── refundable_until_days_before (integer, e.g., 7)
// └── cancellation_fee_percent (integer, e.g., 10)
// created_at (datetime)
// updated_at (datetime)

export const tripStatusEnum = pgEnum("trip_status", [
    "DRAFT",
    "PUBLISHED"
])
export const trip = pgTable("trip", {
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
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
})