CREATE TABLE "daily_notes" (
	"date" text PRIMARY KEY NOT NULL,
	"note" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"trade_id" text NOT NULL,
	"execution_id" text NOT NULL,
	"role" text NOT NULL,
	"qty_applied" numeric(14, 4) NOT NULL,
	"price" numeric(12, 4) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "notes" text;