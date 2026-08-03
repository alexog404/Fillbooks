CREATE TABLE "price_bars" (
	"symbol" text NOT NULL,
	"timeframe" text NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"o" numeric(12, 4) NOT NULL,
	"h" numeric(12, 4) NOT NULL,
	"l" numeric(12, 4) NOT NULL,
	"c" numeric(12, 4) NOT NULL,
	"v" integer,
	"source" text NOT NULL,
	CONSTRAINT "price_bars_symbol_timeframe_ts_pk" PRIMARY KEY("symbol","timeframe","ts")
);
