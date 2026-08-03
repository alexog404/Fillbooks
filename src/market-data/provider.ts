export interface Bar {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Behind this so the bar cache (and everything above it) never depends
 * directly on Alpaca -- swapping providers later is a new implementation
 * of this interface, not a rewrite of the caching/UI layers. */
export interface MarketDataProvider {
  /** 1-minute bars for `symbol` in `[startUtc, endUtc]`. Returns an empty
   * array (never throws) when the provider has no data for the range --
   * an old trade beyond the provider's history limit is a normal, expected
   * case the caller must render as "chart unavailable," not an error. */
  getBars(symbol: string, startUtc: Date, endUtc: Date): Promise<Bar[]>;
}
