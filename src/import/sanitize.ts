// Excel escapes numeric-looking text fields (ref numbers) as `="12345"` so
// the cell isn't auto-converted to a number and truncated/reformatted.
const EXCEL_ESCAPE_RE = /^="(.*)"$/;

// A cell is money-ish only if, after stripping $/parens/commas, what's left
// is purely a signed decimal number -- this gates the transform so it never
// touches free-text cells like descriptions or symbols.
const MONEY_RE = /^\(?-?\$?-?[\d,]+(\.\d+)?\)?$/;

/**
 * Normalizes one raw CSV cell: unwraps Excel's `="..."` ref-number escape,
 * and turns broker money formatting -- `($0.10)`, `$1,532.00`, `-1,091.95`
 * -- into a plain signed decimal string. Leaves every other cell untouched,
 * so it's safe to apply uniformly to a whole row.
 */
export function sanitizeCell(raw: string): string {
  const trimmed = raw.trim();

  const excelMatch = EXCEL_ESCAPE_RE.exec(trimmed);
  if (excelMatch) return excelMatch[1];

  if (!MONEY_RE.test(trimmed)) return trimmed;

  const negative = trimmed.startsWith("(") || trimmed.includes("-");
  const digits = trimmed.replace(/[(),$-]/g, "");
  if (digits === "") return trimmed;

  return negative ? `-${digits}` : digits;
}

export function sanitizeRow(row: string[]): string[] {
  return row.map(sanitizeCell);
}

/**
 * Parses a sanitized cell as a number, treating broker placeholders for
 * "not applicable" (`~` for market price, `--`, empty string) as null
 * rather than 0 -- callers must not silently coerce those to zero.
 */
export function parseMoney(raw: string): number | null {
  const cleaned = sanitizeCell(raw);
  if (cleaned === "" || cleaned === "~" || cleaned === "--") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
