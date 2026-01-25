CREATE TYPE "public"."trip_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "trip" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "trip_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"price" numeric NOT NULL,
	"max_capacity" integer NOT NULL,
	"available_seats" integer NOT NULL,
	"status" "trip_status" NOT NULL,
	"refund_policy" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
