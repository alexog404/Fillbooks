CREATE TABLE "broker_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"broker" text NOT NULL,
	"refresh_token_enc" text,
	"access_token_enc" text,
	"token_expires_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"status" text,
	CONSTRAINT "broker_connections_broker_unique" UNIQUE("broker")
);
