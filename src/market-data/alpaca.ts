import type { Bar, MarketDataProvider } from "./provider";

const DATA_BASE_URL = "https://data.alpaca.markets/v2";

interface AlpacaBar {
  t: string; // RFC3339
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface AlpacaBarsResponse {
  bars: AlpacaBar[] | null;
  next_page_token: string | null;
  symbol: string;
}

/** Alpaca's market-data host (data.alpaca.markets) is fixed infrastructure,
 * separate from any trading/order-placement host -- this app only ever
 * reads market data, never places orders through Alpaca. */
export class AlpacaProvider implements MarketDataProvider {
  constructor(
    private readonly keyId = process.env.ALPACA_API_KEY,
    private readonly secretKey = process.env.ALPACA_API_SECRET,
    private readonly feed = process.env.ALPACA_FEED || "iex",
  ) {}

  async getBars(symbol: string, startUtc: Date, endUtc: Date): Promise<Bar[]> {
    if (!this.keyId || !this.secretKey) {
      console.warn("Alpaca credentials not configured -- skipping bar fetch");
      return [];
    }

    const headers = {
      "APCA-API-KEY-ID": this.keyId,
      "APCA-API-SECRET-KEY": this.secretKey,
    };

    const bars: Bar[] = [];
    let pageToken: string | null = null;

    do {
      const params = new URLSearchParams({
        timeframe: "1Min",
        start: startUtc.toISOString(),
        end: endUtc.toISOString(),
        feed: this.feed,
        adjustment: "raw",
        limit: "10000",
      });
      if (pageToken) params.set("page_token", pageToken);

      const res = await fetch(`${DATA_BASE_URL}/stocks/${symbol}/bars?${params}`, { headers });
      if (!res.ok) {
        // A missing history range (old trade) and a real credential/config
        // problem both surface as a non-2xx here. Log the reason for the
        // latter case but never throw -- the detail page must stay useful
        // without a chart either way.
        console.error(`Alpaca bars fetch failed for ${symbol}: ${res.status} ${await res.text()}`);
        return bars;
      }

      const data: AlpacaBarsResponse = await res.json();
      for (const b of data.bars ?? []) {
        bars.push({ time: new Date(b.t), open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v });
      }
      pageToken = data.next_page_token;
    } while (pageToken);

    return bars;
  }
}
