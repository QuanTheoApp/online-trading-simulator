ALTER TABLE "users" ADD COLUMN "pin" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" ("email");