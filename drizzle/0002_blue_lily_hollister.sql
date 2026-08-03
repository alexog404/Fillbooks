CREATE TABLE "executions" (
	"id" text PRIMARY KEY NOT NULL,
	"dedupe_hash" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"symbol" text NOT NULL,
	"side" text NOT NULL,
	"qty" numeric(14, 4) NOT NULL,
	"price" numeric(12, 4) NOT NULL,
	CONSTRAINT "executions_dedupe_hash_unique" UNIQUE("dedupe_hash")
);
