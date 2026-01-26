ALTER TABLE "app_bookings" RENAME COLUMN "idempotencyKey" TO "idempotency_key";--> statement-breakpoint
ALTER TABLE "app_bookings" DROP CONSTRAINT "app_bookings_idempotencyKey_unique";--> statement-breakpoint
ALTER TABLE "app_bookings" ADD CONSTRAINT "app_bookings_idempotency_key_unique" UNIQUE("idempotency_key");