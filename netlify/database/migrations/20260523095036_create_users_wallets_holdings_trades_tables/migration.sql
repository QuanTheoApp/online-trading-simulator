CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"symbol" text NOT NULL,
	"quantity" numeric(20,8) DEFAULT '0' NOT NULL,
	"avg_entry_price" numeric(20,8) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"symbol" text NOT NULL,
	"side" text NOT NULL,
	"quantity" numeric(20,8) NOT NULL,
	"price" numeric(20,8) NOT NULL,
	"total" numeric(20,8) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"username" text NOT NULL UNIQUE,
	"full_name" text,
	"usd_balance" numeric(20,8) DEFAULT '100000' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallet_holdings" (
	"id" serial PRIMARY KEY,
	"wallet_id" integer NOT NULL,
	"symbol" text NOT NULL,
	"quantity" numeric(20,8) DEFAULT '0' NOT NULL,
	"avg_entry_price" numeric(20,8) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '📊',
	"initial_balance" numeric(20,8) DEFAULT '10000' NOT NULL,
	"usd_balance" numeric(20,8) DEFAULT '10000' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "holdings_user_symbol_idx" ON "holdings" ("user_id","symbol");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_holdings_wallet_symbol_idx" ON "wallet_holdings" ("wallet_id","symbol");--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "wallet_holdings" ADD CONSTRAINT "wallet_holdings_wallet_id_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");