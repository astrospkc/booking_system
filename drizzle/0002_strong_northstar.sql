CREATE TYPE "public"."booking_state" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"trip_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"num_seats" integer NOT NULL,
	"state" "booking_state" NOT NULL,
	"price_at_booking" numeric NOT NULL,
	"payment_reference" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"refund_amount" numeric,
	"idempotencyKey" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_idempotencyKey_unique" UNIQUE("idempotencyKey")
);
